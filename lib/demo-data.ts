import type {
  AdminStatsResponse,
  AdminUserListItem,
  CardMapping,
  PosChargeResponse,
  PosMeResponse,
  StoreItem,
  UserAnalyticsResponse,
  UserMeResponse,
  WalletTransaction,
} from "@/lib/api/types";

const now = new Date();

export const demoAdminStats: AdminStatsResponse = {
  months: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"],
  stores: [
    {
      storeId: "store-1",
      storeName: "Main Canteen",
      monthlyTotals: [1200, 1460, 1780, 1690, 1850, 2010],
      thisMonth: 2010,
      lastMonth: 1850,
      growthPercent: (2010 - 1850) / 1850,
    },
    {
      storeId: "store-2",
      storeName: "Juice Corner",
      monthlyTotals: [900, 930, 1200, 1170, 1225, 1300],
      thisMonth: 1300,
      lastMonth: 1225,
      growthPercent: (1300 - 1225) / 1225,
    },
  ],
};

export const demoUsers: AdminUserListItem[] = [
  { id: "u1001", username: "jane.doe", name: "Jane Doe", role: "USER" },
  { id: "u1002", username: "alex.lee", name: "Alex Lee", role: "USER" },
  { id: "u1003", username: "mike.khan", name: "Mike Khan", role: "USER" },
];

export const demoStores: StoreItem[] = [
  { storeId: "store-1", storeName: "Main Canteen", defaultChargeAmount: 3500 },
  { storeId: "store-2", storeName: "Juice Corner", defaultChargeAmount: 3500 },
];

export const demoCardMappings: CardMapping[] = [
  { uid: "04AABB11CC22", userId: "u1001", userName: "Jane Doe" },
  { uid: "04AABB11CC23", userId: "u1002", userName: "Alex Lee" },
  { uid: "04AABB11CC24", userId: "u1003", userName: "Mike Khan" },
];

export const demoTransactions: WalletTransaction[] = [
  {
    id: "tx-1001",
    userId: "u1001",
    userName: "Jane Doe",
    storeId: "store-1",
    storeName: "Main Canteen",
    type: "PURCHASE",
    amount: 3500,
    createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
    balanceBefore: 12500,
    balanceAfter: 9000,
  },
  {
    id: "tx-1002",
    userId: "u1002",
    userName: "Alex Lee",
    storeId: "store-2",
    storeName: "Juice Corner",
    type: "PURCHASE",
    amount: 3500,
    createdAt: new Date(now.getTime() - 1000 * 60 * 90).toISOString(),
    balanceBefore: 8250,
    balanceAfter: 4750,
  },
  {
    id: "tx-1003",
    userId: "u1001",
    userName: "Jane Doe",
    storeId: null,
    type: "TOPUP",
    amount: 20000,
    createdAt: new Date(now.getTime() - 1000 * 60 * 240).toISOString(),
    balanceBefore: 2500,
    balanceAfter: 22500,
    note: "Admin topup",
  },
];

export const demoPosMe: PosMeResponse = {
  storeId: "store-1",
  storeName: "Main Canteen",
  defaultChargeAmount: 3500,
};

export const demoChargeResult: PosChargeResponse = {
  ok: true,
  txId: "tx-demo-201",
  createdAt: new Date().toISOString(),
  amount: 3500,
  balanceBefore: 20000,
  balanceAfter: 16500,
  user: {
    id: "u1001",
    name: "Jane Doe",
  },
};

export const demoUserMe: UserMeResponse = {
  id: "u1001",
  name: "Jane Doe",
  balance: 17500,
};

export const demoUserAnalytics: UserAnalyticsResponse = {
  months: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"],
  monthlyTotals: [24000, 30000, 28000, 33000, 27000, 22000],
  byStore: [
    { storeId: "store-1", storeName: "Main Canteen", total: 15000 },
    { storeId: "store-2", storeName: "Juice Corner", total: 7000 },
  ],
};
