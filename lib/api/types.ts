export type Role = "ADMIN" | "STORE" | "USER";
export type TransactionType = "PURCHASE" | "TOPUP";

export interface ApiOk {
  ok: boolean;
}

export interface AuthMeResponse extends ApiOk {
  role: Role;
  userId: string;
  name?: string;
  storeId?: string;
  storeName?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse extends ApiOk {
  role: Role;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  storeId: string | null;
  storeName?: string;
  userName?: string;
  type: TransactionType;
  amount: number;
  createdAt: string;
  note?: string;
  balanceBefore?: number;
  balanceAfter?: number;
}

export interface AdminStatsStore {
  storeId: string;
  storeName: string;
  monthlyTotals: number[];
  thisMonth: number;
  lastMonth: number;
  growthPercent: number | null;
}

export interface AdminStatsResponse {
  months: string[];
  stores: AdminStatsStore[];
}

export interface TopupRequest {
  userId: string;
  amount: number;
  note?: string;
}

export interface TopupResponse extends ApiOk {
  newBalance: number;
  txId: string;
}

export interface AdminUserListItem {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export interface CardMapping {
  uid: string;
  userId: string;
  userName?: string;
}

export interface UserDetailResponse {
  id: string;
  username: string;
  name: string;
  role: Role;
  balance: number;
  recentTransactions: WalletTransaction[];
  cards: CardMapping[];
}

export interface CreateUserRequest {
  username: string;
  name: string;
  password: string;
  role?: "USER";
}

export interface UpdateUserRequest {
  username?: string;
  name?: string;
  password?: string;
}

export interface StoreItem {
  storeId: string;
  storeName: string;
  defaultChargeAmount: number;
  ownerUserId?: string;
  ownerUsername?: string;
  ownerName?: string | null;
}

export interface StoreDetailResponse extends StoreItem {
  months: string[];
  monthlyTotals: number[];
  recentTransactions: WalletTransaction[];
}

export interface UpsertStoreRequest {
  storeName: string;
  defaultChargeAmount: number;
  ownerUsername?: string;
  ownerPassword?: string;
  ownerName?: string;
}

export interface AssignCardRequest {
  uid: string;
  userId: string;
}

export type AssignCardResponse = ApiOk;

export interface AdminTransactionQuery {
  startDate?: string;
  endDate?: string;
  storeId?: string;
  userId?: string;
  type?: TransactionType;
  query?: string;
}

export interface PosMeResponse {
  storeId: string;
  storeName: string;
  defaultChargeAmount: number;
}

export interface PosChargeRequest {
  uid: string;
}

export interface PosChargeResponse extends ApiOk {
  txId: string;
  createdAt: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  user: {
    id: string;
    name: string;
  };
}

export interface UserMeResponse {
  id: string;
  name: string;
  balance: number;
}

export interface UserAnalyticsResponse {
  months: string[];
  monthlyTotals: number[];
  byStore: Array<{
    storeId: string;
    storeName: string;
    total: number;
  }>;
}

export interface UserTransactionQuery {
  startDate?: string;
  endDate?: string;
  storeId?: string;
  type?: TransactionType;
}
