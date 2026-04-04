import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { serializeTransaction } from "@/lib/server/serializers";
import { getMonthKeys, monthKeyFromDate, startOfMonthUtc } from "@/lib/server/time";
import { handleRouteError, RouteError } from "@/lib/server/http";

const updateStoreSchema = z.object({
  storeName: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  defaultChargeAmount: z.number().int().positive().optional(),
  ownerUserId: z.string().trim().min(1).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(request, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;
    const monthsCount = Math.max(1, Math.min(24, Number(request.nextUrl.searchParams.get("months") ?? 6)));
    const monthKeys = getMonthKeys(monthsCount);
    const rangeStart = startOfMonthUtc(-(monthsCount - 1));

    const store = await db.store.findUnique({
      where: { id },
    });
    if (!store) {
      throw new RouteError(404, "STORE_NOT_FOUND", "Store not found");
    }

    const [monthlyTransactions, recentTransactions] = await Promise.all([
      db.transaction.findMany({
        where: {
          storeId: id,
          type: "PURCHASE",
          createdAt: { gte: rangeStart },
        },
        select: {
          amount: true,
          createdAt: true,
        },
      }),
      db.transaction.findMany({
        where: { storeId: id },
        include: {
          user: { select: { name: true } },
          store: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const monthTotalsMap = new Map<string, number>();
    for (const transaction of monthlyTransactions) {
      const key = monthKeyFromDate(transaction.createdAt);
      monthTotalsMap.set(key, (monthTotalsMap.get(key) ?? 0) + transaction.amount);
    }

    const monthlyTotals = monthKeys.map((key) => monthTotalsMap.get(key) ?? 0);

    return Response.json({
      storeId: store.id,
      storeName: store.name,
      defaultChargeAmount: store.defaultChargeAmount,
      months: monthKeys,
      monthlyTotals,
      recentTransactions: recentTransactions.map(serializeTransaction),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(request, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;
    const json = await request.json().catch(() => null);
    const parsed = updateStoreSchema.safeParse(json);
    if (!parsed.success) {
      throw new RouteError(400, "INVALID_INPUT", "Invalid update payload");
    }

    const existing = await db.store.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new RouteError(404, "STORE_NOT_FOUND", "Store not found");
    }

    const nextName = parsed.data.storeName ?? parsed.data.name;

    if (parsed.data.ownerUserId && parsed.data.ownerUserId !== existing.ownerUserId) {
      const newOwner = await db.user.findUnique({
        where: { id: parsed.data.ownerUserId },
        include: { ownerStore: true },
      });

      if (!newOwner) {
        throw new RouteError(404, "STORE_OWNER_NOT_FOUND", "Target STORE owner not found");
      }
      if (newOwner.role !== "STORE") {
        throw new RouteError(400, "INVALID_STORE_OWNER", "ownerUserId must belong to a STORE account");
      }
      if (newOwner.ownerStore && newOwner.ownerStore.id !== id) {
        throw new RouteError(400, "STORE_OWNER_IN_USE", "STORE account is already linked to another store");
      }
    }

    const updated = await db.store.update({
      where: { id },
      data: {
        ...(nextName ? { name: nextName } : {}),
        ...(typeof parsed.data.defaultChargeAmount === "number"
          ? { defaultChargeAmount: parsed.data.defaultChargeAmount }
          : {}),
        ...(parsed.data.ownerUserId ? { ownerUserId: parsed.data.ownerUserId } : {}),
      },
    });

    return Response.json({
      storeId: updated.id,
      storeName: updated.name,
      defaultChargeAmount: updated.defaultChargeAmount,
      ownerUserId: updated.ownerUserId,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(request, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;
    const store = await db.store.findUnique({
      where: { id },
    });
    if (!store) {
      throw new RouteError(404, "STORE_NOT_FOUND", "Store not found");
    }

    await db.store.delete({
      where: { id },
    });

    return Response.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
