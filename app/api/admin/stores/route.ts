import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/server/auth/guard";
import { db } from "@/lib/server/db";
import { handleRouteError, RouteError } from "@/lib/server/http";

const createStoreSchema = z.object({
  storeName: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  defaultChargeAmount: z.number().int().positive(),
  ownerUsername: z.string().trim().min(3).optional(),
  ownerPassword: z.string().min(6).optional(),
  ownerName: z.string().trim().min(1).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["ADMIN"]);
    if (!auth.ok) {
      return auth.response;
    }

    const stores = await db.store.findMany({
      include: {
        ownerUser: {
          select: {
            username: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(
      stores.map((store) => ({
        storeId: store.id,
        storeName: store.name,
        defaultChargeAmount: store.defaultChargeAmount,
        ownerUserId: store.ownerUserId,
        ownerUsername: store.ownerUser.username,
        ownerName: store.ownerUser.name ?? null,
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
    const parsed = createStoreSchema.safeParse(json);
    if (!parsed.success) {
      throw new RouteError(
        400,
        "INVALID_INPUT",
        "storeName (or name) and positive integer defaultChargeAmount are required",
      );
    }

    const storeName = parsed.data.storeName ?? parsed.data.name;
    if (!storeName) {
      throw new RouteError(400, "INVALID_INPUT", "storeName is required");
    }

    const normalizedBase = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const fallbackUsername = `store_${normalizedBase || "canteen"}_${Math.random().toString(36).slice(2, 6)}`;
    const ownerUsername = parsed.data.ownerUsername ?? fallbackUsername;
    const ownerPassword = parsed.data.ownerPassword ?? "store123";

    const usernameExists = await db.user.findUnique({
      where: { username: ownerUsername },
    });
    if (usernameExists) {
      throw new RouteError(400, "USERNAME_EXISTS", "ownerUsername already exists");
    }
    const passwordHash = await bcrypt.hash(ownerPassword, 10);

    const created = await db.$transaction(async (tx) => {
      const ownerUser = await tx.user.create({
        data: {
          username: ownerUsername,
          passwordHash,
          role: "STORE",
          name: parsed.data.ownerName ?? `${storeName} Operator`,
        },
      });

      const store = await tx.store.create({
        data: {
          name: storeName,
          defaultChargeAmount: parsed.data.defaultChargeAmount,
          ownerUserId: ownerUser.id,
        },
      });

      return {
        store,
        ownerUser,
      };
    });

    return Response.json(
      {
        storeId: created.store.id,
        storeName: created.store.name,
        defaultChargeAmount: created.store.defaultChargeAmount,
        ownerUserId: created.ownerUser.id,
        ownerUsername: created.ownerUser.username,
        ownerPassword,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
