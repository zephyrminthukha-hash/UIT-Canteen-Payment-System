import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { buildAdminTransactionWhere } from "@/lib/server/transaction-filters";
import { handleRouteError } from "@/lib/server/http";

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

    const worksheetRows = rows.map((row) => ({
      id: row.id,
      type: row.type,
      amount: row.amount,
      userId: row.userId,
      userName: row.user.name ?? "",
      storeId: row.storeId ?? "",
      storeName: row.store?.name ?? "",
      createdAt: row.createdAt.toISOString(),
      note: row.note ?? "",
      balanceBefore: row.balanceBefore ?? "",
      balanceAfter: row.balanceAfter ?? "",
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
