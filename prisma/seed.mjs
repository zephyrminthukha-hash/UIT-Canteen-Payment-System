import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser({ id, username, password, role, name }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      role,
      name,
    },
    create: {
      id,
      username,
      passwordHash,
      role,
      name,
    },
  });
}

async function main() {
  await upsertUser({
    id: "admin-1",
    username: "admin",
    password: "admin123",
    role: "ADMIN",
    name: "Administrator",
  });

  const storeUser = await upsertUser({
    id: "store-user-1",
    username: "store1",
    password: "store123",
    role: "STORE",
    name: "Store Operator 1",
  });

  const student1 = await upsertUser({
    id: "user-1",
    username: "student1",
    password: "user123",
    role: "USER",
    name: "Student One",
  });

  const student2 = await upsertUser({
    id: "user-2",
    username: "student2",
    password: "user123",
    role: "USER",
    name: "Student Two",
  });

  const student3 = await upsertUser({
    id: "user-3",
    username: "student3",
    password: "user123",
    role: "USER",
    name: "Student Three",
  });

  await prisma.store.upsert({
    where: { ownerUserId: storeUser.id },
    update: {
      id: "store-1",
      name: "Main Canteen",
      defaultChargeAmount: 3500,
    },
    create: {
      id: "store-1",
      name: "Main Canteen",
      defaultChargeAmount: 3500,
      ownerUserId: storeUser.id,
    },
  });

  await prisma.wallet.upsert({
    where: { userId: student1.id },
    update: { balance: 15000 },
    create: { userId: student1.id, balance: 15000 },
  });

  await prisma.wallet.upsert({
    where: { userId: student2.id },
    update: { balance: 12000 },
    create: { userId: student2.id, balance: 12000 },
  });

  await prisma.wallet.upsert({
    where: { userId: student3.id },
    update: { balance: 9000 },
    create: { userId: student3.id, balance: 9000 },
  });

  await prisma.card.upsert({
    where: { uid: "04AABB11CC22" },
    update: { userId: student1.id },
    create: { uid: "04AABB11CC22", userId: student1.id },
  });

  await prisma.card.upsert({
    where: { uid: "04AABB11CC23" },
    update: { userId: student2.id },
    create: { uid: "04AABB11CC23", userId: student2.id },
  });

  await prisma.card.upsert({
    where: { uid: "04AABB11CC24" },
    update: { userId: student3.id },
    create: { uid: "04AABB11CC24", userId: student3.id },
  });
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
