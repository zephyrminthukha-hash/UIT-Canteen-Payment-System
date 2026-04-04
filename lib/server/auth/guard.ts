import type { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, type SessionPayload, type SessionRole } from "@/lib/server/auth/session";
import { errorResponse } from "@/lib/server/http";

type AuthSuccess = {
  ok: true;
  session: SessionPayload;
};

type AuthFailure = {
  ok: false;
  response: NextResponse;
};

export async function requireRole(
  request: NextRequest,
  allowedRoles: SessionRole[],
): Promise<AuthSuccess | AuthFailure> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return {
      ok: false,
      response: errorResponse(401, "UNAUTHENTICATED", "Please login first"),
    };
  }

  if (!allowedRoles.includes(session.role)) {
    return {
      ok: false,
      response: errorResponse(403, "FORBIDDEN", "You do not have access to this resource"),
    };
  }

  return {
    ok: true,
    session,
  };
}
