import { NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { getSessionFromRequest } from "@/lib/server/auth/session";
import { errorResponse, handleRouteError, okResponse } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return errorResponse(401, "UNAUTHENTICATED", "Not logged in");
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: {
        ownerStore: true,
      },
    });

    if (!user) {
      return errorResponse(401, "UNAUTHENTICATED", "Session is no longer valid");
    }

    return okResponse({
      role: user.role,
      userId: user.id,
      name: user.name ?? null,
      storeId: user.ownerStore?.id ?? null,
      storeName: user.ownerStore?.name ?? null,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
