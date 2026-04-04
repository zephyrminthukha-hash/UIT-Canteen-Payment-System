import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { handleRouteError, RouteError } from "@/lib/server/http";

const topupSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive(),
  note: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const json = await request.json().catch(() => null);
    const parsed = topupSchema.safeParse(json);
    if (!parsed.success) {
      throw new RouteError(400, "INVALID_INPUT", "userId and positive integer amount are required");
    }

    const targetUser = await db.user.findUnique({
      where: { id: parsed.data.userId },
    });
    if (!targetUser) {
      throw new RouteError(404, "USER_NOT_FOUND", "User not found");
    }

    const result = await db.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({
        where: { userId: parsed.data.userId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: parsed.data.userId,
            balance: 0,
          },
        });
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + parsed.data.amount;

      await tx.wallet.update({
        where: { userId: parsed.data.userId },
        data: {
          balance: balanceAfter,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          type: "TOPUP",
          amount: parsed.data.amount,
          userId: parsed.data.userId,
          storeId: null,
          note: parsed.data.note ?? null,
          balanceBefore,
          balanceAfter,
        },
      });

      return {
        walletBalance: balanceAfter,
        txId: transaction.id,
      };
    });

    return Response.json({
      ok: true,
      newBalance: result.walletBalance,
      txId: result.txId,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
