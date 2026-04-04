import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { getSessionCookieName, getSessionCookieOptions, signSessionToken } from "@/lib/server/auth/session";
import { handleRouteError, RouteError } from "@/lib/server/http";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(json);

    if (!parsed.success) {
      throw new RouteError(400, "INVALID_INPUT", "Username and password are required");
    }

    const user = await db.user.findUnique({
      where: { username: parsed.data.username },
      include: {
        ownerStore: true,
      },
    });

    if (!user) {
      throw new RouteError(401, "INVALID_CREDENTIALS", "Invalid username or password");
    }

    const validPassword = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!validPassword) {
      throw new RouteError(401, "INVALID_CREDENTIALS", "Invalid username or password");
    }

    const token = await signSessionToken({
      userId: user.id,
      role: user.role,
      ...(user.role === "STORE" && user.ownerStore ? { storeId: user.ownerStore.id } : {}),
    });

    const response = NextResponse.json({
      ok: true,
      role: user.role,
    });

    response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions());
    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
