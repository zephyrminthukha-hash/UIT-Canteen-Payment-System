import { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { buildAdminTransactionWhere } from "@/lib/server/transaction-filters";
import { handleRouteError } from "@/lib/server/http";

function escapeCsvCell(value: unknown) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const where = buildAdminTransactionWhere(request);
    const rows = await db.transaction.findMany({
      where,
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
      take: 5000,
    });

    const header = [
      "id",
      "type",
      "amount",
      "userId",
      "userName",
      "storeId",
      "storeName",
      "createdAt",
      "note",
      "balanceBefore",
      "balanceAfter",
    ];

    const csvRows = [
      header.join(","),
      ...rows.map((row) =>
        [
          row.id,
          row.type,
          row.amount,
          row.userId,
          row.user.name ?? "",
          row.storeId ?? "",
          row.store?.name ?? "",
          row.createdAt.toISOString(),
          row.note ?? "",
          row.balanceBefore ?? "",
          row.balanceAfter ?? "",
        ]
          .map(escapeCsvCell)
          .join(","),
      ),
    ];

    const csvText = csvRows.join("\n");
    return new Response(csvText, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
