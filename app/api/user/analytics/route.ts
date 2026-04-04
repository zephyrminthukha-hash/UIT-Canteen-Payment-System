import { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { getMonthKeys, monthKeyFromDate, startOfMonthUtc } from "@/lib/server/time";
import { handleRouteError } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["USER"]);
    if (!auth.ok) {
      return auth.response;
    }

    const monthsCount = Math.max(1, Math.min(24, Number(request.nextUrl.searchParams.get("months") ?? 6)));
    const selectedMonth = request.nextUrl.searchParams.get("month");
    const months = getMonthKeys(monthsCount);
    const rangeStart = startOfMonthUtc(-(monthsCount - 1));
    const breakdownMonth = selectedMonth && months.includes(selectedMonth) ? selectedMonth : months[months.length - 1];

    const purchases = await db.transaction.findMany({
      where: {
        userId: auth.session.userId,
        type: "PURCHASE",
        createdAt: {
          gte: rangeStart,
        },
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const monthlyTotalsMap = new Map<string, number>();
    for (const tx of purchases) {
      const key = monthKeyFromDate(tx.createdAt);
      monthlyTotalsMap.set(key, (monthlyTotalsMap.get(key) ?? 0) + tx.amount);
    }

    const monthlyTotals = months.map((month) => monthlyTotalsMap.get(month) ?? 0);

    const byStoreMap = new Map<string, { storeId: string; storeName: string; total: number }>();
    for (const tx of purchases) {
      if (!tx.storeId || !tx.store) {
        continue;
      }
      if (monthKeyFromDate(tx.createdAt) !== breakdownMonth) {
        continue;
      }
      const existing = byStoreMap.get(tx.storeId) ?? {
        storeId: tx.storeId,
        storeName: tx.store.name,
        total: 0,
      };
      existing.total += tx.amount;
      byStoreMap.set(tx.storeId, existing);
    }

    const byStore = [...byStoreMap.values()].sort((a, b) => b.total - a.total);

    return Response.json({
      months,
      monthlyTotals,
      byStore,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
