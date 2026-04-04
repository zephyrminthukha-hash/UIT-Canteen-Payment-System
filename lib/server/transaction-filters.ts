import type { Prisma, TransactionType } from "@prisma/client";
import type { NextRequest } from "next/server";
import { parseDateOrUndefined } from "@/lib/server/time";

export function buildAdminTransactionWhere(request: NextRequest): Prisma.TransactionWhereInput {
  const searchParams = request.nextUrl.searchParams;
  const startDate = parseDateOrUndefined(searchParams.get("startDate"));
  const endDate = parseDateOrUndefined(searchParams.get("endDate"));
  const storeId = searchParams.get("storeId");
  const userId = searchParams.get("userId");
  const type = searchParams.get("type");

  const where: Prisma.TransactionWhereInput = {};

  if (startDate || endDate) {
    where.createdAt = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }

  if (storeId) {
    where.storeId = storeId;
  }

  if (userId) {
    where.userId = userId;
  }

  if (type && (type === "PURCHASE" || type === "TOPUP")) {
    where.type = type as TransactionType;
  }

  return where;
}

export function parseLimitOffset(request: NextRequest, defaultLimit = 100, maxLimit = 500) {
  const searchParams = request.nextUrl.searchParams;
  const limitRaw = Number(searchParams.get("limit") ?? defaultLimit);
  const offsetRaw = Number(searchParams.get("offset") ?? 0);

  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(maxLimit, Math.floor(limitRaw)))
    : defaultLimit;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.floor(offsetRaw)) : 0;

  return { limit, offset };
}
