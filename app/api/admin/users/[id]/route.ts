import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { serializeTransaction } from "@/lib/server/serializers";
import { handleRouteError, RouteError } from "@/lib/server/http";

const updateUserSchema = z.object({
  username: z.string().trim().min(3).optional(),
  name: z.string().trim().min(1).optional(),
  password: z.string().min(6).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(request, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;
    const user = await db.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new RouteError(404, "USER_NOT_FOUND", "User not found");
    }

    const [wallet, cards, recentTransactions] = await Promise.all([
      db.wallet.findUnique({ where: { userId: id } }),
      db.card.findMany({
        where: { userId: id },
        orderBy: { createdAt: "desc" },
      }),
      db.transaction.findMany({
        where: { userId: id },
        include: {
          user: { select: { name: true } },
          store: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return Response.json({
      id: user.id,
      username: user.username,
      name: user.name ?? "",
      role: user.role,
      balance: wallet?.balance ?? 0,
      cards: cards.map((card) => ({
        uid: card.uid,
        userId: card.userId,
      })),
      recentTransactions: recentTransactions.map(serializeTransaction),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(request, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;
    const existing = await db.user.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new RouteError(404, "USER_NOT_FOUND", "User not found");
    }
    if (existing.role !== "USER") {
      throw new RouteError(400, "INVALID_TARGET", "Only USER role accounts can be edited here");
    }

    const json = await request.json().catch(() => null);
    const parsed = updateUserSchema.safeParse(json);
    if (!parsed.success) {
      throw new RouteError(400, "INVALID_INPUT", "Invalid update payload");
    }

    if (parsed.data.username && parsed.data.username !== existing.username) {
      const usernameTaken = await db.user.findUnique({
        where: { username: parsed.data.username },
      });
      if (usernameTaken && usernameTaken.id !== existing.id) {
        throw new RouteError(400, "USERNAME_EXISTS", "Username already exists");
      }
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        ...(parsed.data.username ? { username: parsed.data.username } : {}),
        ...(parsed.data.name ? { name: parsed.data.name } : {}),
        ...(parsed.data.password ? { passwordHash: await bcrypt.hash(parsed.data.password, 10) } : {}),
      },
    });

    return Response.json({
      id: updated.id,
      username: updated.username,
      name: updated.name ?? "",
      role: updated.role,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireRole(request, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;
    const user = await db.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new RouteError(404, "USER_NOT_FOUND", "User not found");
    }
    if (user.role !== "USER") {
      throw new RouteError(400, "INVALID_TARGET", "Only USER role accounts can be deleted here");
    }

    await db.user.delete({
      where: { id },
    });

    return Response.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
