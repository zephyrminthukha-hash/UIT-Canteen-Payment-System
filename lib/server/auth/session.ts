import { jwtVerify, SignJWT } from "jose";
import type { NextRequest } from "next/server";
import { z } from "zod";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const roleSchema = z.union([z.literal("ADMIN"), z.literal("STORE"), z.literal("USER")]);

const sessionSchema = z.object({
  userId: z.string().min(1),
  role: roleSchema,
  storeId: z.string().optional(),
});

export type SessionRole = z.infer<typeof roleSchema>;
export type SessionPayload = z.infer<typeof sessionSchema>;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is not configured");
  }

  return new TextEncoder().encode("dev-insecure-secret-change-me");
}

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const parsed = sessionSchema.safeParse(payload);
    if (!parsed.success) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}
