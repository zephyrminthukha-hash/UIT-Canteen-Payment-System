import { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
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

    const store = await db.store.findUnique({
      where: { id: auth.session.storeId },
    });

    if (!store) {
      throw new RouteError(404, "STORE_NOT_FOUND", "Store was not found");
    }

    return Response.json({
      storeId: store.id,
      storeName: store.name,
      defaultChargeAmount: store.defaultChargeAmount,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
