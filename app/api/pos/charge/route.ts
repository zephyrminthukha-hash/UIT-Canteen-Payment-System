import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { handleRouteError, RouteError } from "@/lib/server/http";

const chargeSchema = z.object({
  uid: z.string().trim().min(1, "UID is required"),
});



function formatChargeResponse(params: {
  txId: string;
  createdAt: Date;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  user: { id: string; name: string | null };
}) {
  return {
    ok: true,
    txId: params.txId,
    createdAt: params.createdAt.toISOString(),
    amount: params.amount,
    balanceBefore: params.balanceBefore,
    balanceAfter: params.balanceAfter,
    user: {
      id: params.user.id,
      name: params.user.name ?? "",
    },
  };
}

export async function POST(request: NextRequest) {
  let finalIdempotencyKey: string | null = null;
  let fallbackUser: { id: string; name: string | null } | null = null;

  try {
    const auth = await requireRole(request, ["STORE"]);
    if (!auth.ok) {
      return auth.response;
    }

    if (!auth.session.storeId) {
      throw new RouteError(403, "STORE_CONTEXT_MISSING", "No store is attached to this account");
    }

    const payload = await request.json().catch(() => null);
    const parsed = chargeSchema.safeParse(payload);
    if (!parsed.success) {
      throw new RouteError(400, "INVALID_INPUT", "UID is required");
    }

    const card = await db.card.findUnique({
      where: { uid: parsed.data.uid },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!card) {
      throw new RouteError(404, "UNKNOWN_CARD", "Unknown card");
    }
    fallbackUser = {
      id: card.user.id,
      name: card.user.name ?? null,
    };

    const store = await db.store.findUnique({
      where: { id: auth.session.storeId },
    });

    if (!store) {
      throw new RouteError(404, "STORE_NOT_FOUND", "Store not found");
    }

    const nowMs = Date.now();
    const idempotencyKey = `${store.id}:${parsed.data.uid}:${Math.floor(nowMs / 2000)}`;
    finalIdempotencyKey = idempotencyKey;

    const alreadyProcessed = await db.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (alreadyProcessed) {
      const fallbackBalance = await db.wallet.findUnique({ where: { userId: card.userId } });
      const balanceAfter = alreadyProcessed.balanceAfter ?? fallbackBalance?.balance ?? 0;
      const balanceBefore = alreadyProcessed.balanceBefore ?? balanceAfter + alreadyProcessed.amount;
      return Response.json(
        formatChargeResponse({
          txId: alreadyProcessed.id,
          createdAt: alreadyProcessed.createdAt,
          amount: alreadyProcessed.amount,
          balanceBefore,
          balanceAfter,
          user: {
            id: card.user.id,
            name: card.user.name ?? null,
          },
        }),
      );
    }

    const result = await db.$transaction(async (tx) => {
      const duplicate = await tx.transaction.findUnique({
        where: { idempotencyKey },
      });
      if (duplicate) {
        return {
          transaction: duplicate,
          duplicated: true,
        };
      }

      let wallet = await tx.wallet.findUnique({
        where: { userId: card.userId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: card.userId,
            balance: 0,
          },
        });
      }

      const balanceBefore = wallet.balance;
      const amount = store.defaultChargeAmount;

      if (balanceBefore < amount) {
        throw new RouteError(400, "INSUFFICIENT_BALANCE", "Insufficient balance");
      }

      const balanceAfter = balanceBefore - amount;
      await tx.wallet.update({
        where: { userId: card.userId },
        data: { balance: balanceAfter },
      });

      const created = await tx.transaction.create({
        data: {
          type: "PURCHASE",
          amount,
          userId: card.userId,
          storeId: store.id,
          idempotencyKey,
          balanceBefore,
          balanceAfter,
        },
      });

      return {
        transaction: created,
        duplicated: false,
      };
    });

    return Response.json(
      formatChargeResponse({
        txId: result.transaction.id,
        createdAt: result.transaction.createdAt,
        amount: result.transaction.amount,
        balanceBefore: result.transaction.balanceBefore ?? 0,
        balanceAfter: result.transaction.balanceAfter ?? 0,
        user: {
          id: card.user.id,
          name: card.user.name ?? null,
        },
      }),
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      if (finalIdempotencyKey) {
        const existing = await db.transaction.findUnique({
          where: {
            idempotencyKey: finalIdempotencyKey,
          },
        });
        if (existing) {
          const fallbackBalance = await db.wallet.findUnique({ where: { userId: existing.userId } });
          const balanceAfter = existing.balanceAfter ?? fallbackBalance?.balance ?? 0;
          const balanceBefore = existing.balanceBefore ?? balanceAfter + existing.amount;
          return Response.json(
            formatChargeResponse({
              txId: existing.id,
              createdAt: existing.createdAt,
              amount: existing.amount,
              balanceBefore,
              balanceAfter,
              user: fallbackUser ?? { id: existing.userId, name: null },
            }),
          );
        }
      }
    }

    return handleRouteError(error);
  }
}
