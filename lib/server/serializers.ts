import type { Transaction, User, Store } from "@prisma/client";

type TxWithRelations = Transaction & {
  user?: Pick<User, "name"> | null;
  store?: Pick<Store, "name"> | null;
};

export function serializeTransaction(tx: TxWithRelations) {
  return {
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    userId: tx.userId,
    userName: tx.user?.name ?? null,
    storeId: tx.storeId,
    storeName: tx.store?.name ?? null,
    createdAt: tx.createdAt.toISOString(),
    note: tx.note ?? null,
    balanceBefore: tx.balanceBefore ?? null,
    balanceAfter: tx.balanceAfter ?? null,
  };
}
