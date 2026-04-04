import { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { getMonthKeys, monthKeyFromDate, startOfMonthUtc } from "@/lib/server/time";
import { handleRouteError } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const monthsCount = Math.max(1, Math.min(24, Number(request.nextUrl.searchParams.get("months") ?? 6)));
    const months = getMonthKeys(monthsCount);
    const rangeStart = startOfMonthUtc(-(monthsCount - 1));

    const [stores, purchases] = await Promise.all([
      db.store.findMany({
        orderBy: {
          name: "asc",
        },
      }),
      db.transaction.findMany({
        where: {
          type: "PURCHASE",
          createdAt: {
            gte: rangeStart,
          },
        },
        select: {
          storeId: true,
          amount: true,
          createdAt: true,
        },
      }),
    ]);

    const matrix = new Map<string, Map<string, number>>();
    for (const purchase of purchases) {
      if (!purchase.storeId) {
        continue;
      }
      const key = monthKeyFromDate(purchase.createdAt);
      const storeMap = matrix.get(purchase.storeId) ?? new Map<string, number>();
      storeMap.set(key, (storeMap.get(key) ?? 0) + purchase.amount);
      matrix.set(purchase.storeId, storeMap);
    }

    const storesPayload = stores.map((store) => {
      const values = months.map((monthKey) => matrix.get(store.id)?.get(monthKey) ?? 0);
      const thisMonth = values[values.length - 1] ?? 0;
      const lastMonth = values[values.length - 2] ?? 0;
      const growthPercent = lastMonth === 0 ? null : (thisMonth - lastMonth) / lastMonth;

      return {
        storeId: store.id,
        storeName: store.name,
        monthlyTotals: values,
        thisMonth,
        lastMonth,
        growthPercent,
      };
    });

    return Response.json({
      months,
      stores: storesPayload,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
