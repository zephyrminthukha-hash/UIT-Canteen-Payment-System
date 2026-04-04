import { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { handleRouteError } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const cards = await db.card.findMany({
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(
      cards.map((card) => ({
        uid: card.uid,
        userId: card.userId,
        userName: card.user.name ?? null,
      })),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
