import { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { serializeTransaction } from "@/lib/server/serializers";
import { parseDateOrUndefined } from "@/lib/server/time";
import { handleRouteError, RouteError } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["STORE"]);
    if (!auth.ok) {
      return auth.response;
    }

    if (!auth.session.storeId) {
      throw new RouteError(403, "STORE_CONTEXT_MISSING", "No store is attached to this account");
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = parseDateOrUndefined(searchParams.get("startDate"));
    const endDate = parseDateOrUndefined(searchParams.get("endDate"));
    const search = searchParams.get("search");

    const transactions = await db.transaction.findMany({
      where: {
        storeId: auth.session.storeId,
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { id: { contains: search } },
                { userId: { contains: search } },
                { user: { name: { contains: search } } },
              ],
            }
          : {}),
      },
      include: {
        user: {
          select: { name: true },
        },
        store: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 200,
    });

    return Response.json(transactions.map(serializeTransaction));
  } catch (error) {
    return handleRouteError(error);
  }
}
