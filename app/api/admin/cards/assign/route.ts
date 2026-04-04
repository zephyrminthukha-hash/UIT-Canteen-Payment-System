import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { handleRouteError, RouteError } from "@/lib/server/http";

const assignCardSchema = z.object({
  uid: z.string().trim().min(1),
  userId: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const json = await request.json().catch(() => null);
    const parsed = assignCardSchema.safeParse(json);
    if (!parsed.success) {
      throw new RouteError(400, "INVALID_INPUT", "uid and userId are required");
    }

    const targetUser = await db.user.findUnique({
      where: { id: parsed.data.userId },
    });
    if (!targetUser) {
      throw new RouteError(404, "USER_NOT_FOUND", "User not found");
    }

    const existing = await db.card.findUnique({
      where: { uid: parsed.data.uid },
    });

    if (existing && existing.userId !== parsed.data.userId) {
      throw new RouteError(400, "UID_ALREADY_ASSIGNED", "This UID is already assigned to another user");
    }

    if (!existing) {
      await db.card.create({
        data: {
          uid: parsed.data.uid,
          userId: parsed.data.userId,
        },
      });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
