import { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { handleRouteError, RouteError } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["USER"]);
    if (!auth.ok) {
      return auth.response;
    }

    const user = await db.user.findUnique({
      where: { id: auth.session.userId },
    });
    if (!user) {
      throw new RouteError(404, "USER_NOT_FOUND", "User not found");
    }

    const wallet = await db.wallet.findUnique({
      where: { userId: user.id },
    });

    return Response.json({
      id: user.id,
      name: user.name ?? "",
      balance: wallet?.balance ?? 0,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
