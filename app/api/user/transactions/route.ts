import { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { serializeTransaction } from "@/lib/server/serializers";
import { parseDateOrUndefined } from "@/lib/server/time";
import { handleRouteError } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["USER"]);
    if (!auth.ok) {
      return auth.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = parseDateOrUndefined(searchParams.get("startDate"));
    const endDate = parseDateOrUndefined(searchParams.get("endDate"));
    const storeId = searchParams.get("storeId");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const transactions = await db.transaction.findMany({
      where: {
        userId: auth.session.userId,
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
        ...(storeId ? { storeId } : {}),
        ...(type === "PURCHASE" || type === "TOPUP" ? { type } : {}),
        ...(search
          ? {
              OR: [{ id: { contains: search } }, { store: { name: { contains: search } } }],
            }
          : {}),
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        store: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 300,
    });

    return Response.json(transactions.map(serializeTransaction));
  } catch (error) {
    return handleRouteError(error);
  }
}
