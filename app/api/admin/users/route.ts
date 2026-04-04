import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { handleRouteError, RouteError } from "@/lib/server/http";

const createUserSchema = z.object({
  username: z.string().trim().min(3),
  name: z.string().trim().min(1),
  password: z.string().min(6),
  role: z.literal("USER").optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const query = request.nextUrl.searchParams.get("query")?.trim();

    const users = await db.user.findMany({
      where: {
        role: "USER",
        ...(query
          ? {
              OR: [
                { id: { contains: query } },
                { username: { contains: query } },
                { name: { contains: query } },
              ],
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(
      users.map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name ?? "",
        role: user.role,
      })),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const json = await request.json().catch(() => null);
    const parsed = createUserSchema.safeParse(json);
    if (!parsed.success) {
      throw new RouteError(400, "INVALID_INPUT", "username, name and password are required");
    }

    const existing = await db.user.findUnique({
      where: { username: parsed.data.username },
    });
    if (existing) {
      throw new RouteError(400, "USERNAME_EXISTS", "Username already exists");
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await db.user.create({
      data: {
        username: parsed.data.username,
        name: parsed.data.name,
        role: "USER",
        passwordHash,
      },
    });

    await db.wallet.upsert({
      where: {
        userId: user.id,
      },
      update: {},
      create: {
        userId: user.id,
        balance: 0,
      },
    });

    return Response.json(
      {
        id: user.id,
        username: user.username,
        name: user.name ?? "",
        role: user.role,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
