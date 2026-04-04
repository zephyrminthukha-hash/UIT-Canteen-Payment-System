import { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { serializeTransaction } from "@/lib/server/serializers";
import { buildAdminTransactionWhere, parseLimitOffset } from "@/lib/server/transaction-filters";
import { handleRouteError } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const where = buildAdminTransactionWhere(request);
    const { limit, offset } = parseLimitOffset(request);

    const transactions = await db.transaction.findMany({
      where,
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
      take: limit,
      skip: offset,
    });

    return Response.json(transactions.map(serializeTransaction));
  } catch (error) {
    return handleRouteError(error);
  }
}
