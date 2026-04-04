import { downloadFile, requestJson } from "@/lib/api/client";
import type {
  AdminStatsResponse,
  AdminTransactionQuery,
  AdminUserListItem,
  ApiOk,
  AssignCardRequest,
  AssignCardResponse,
  AuthMeResponse,
  CardMapping,
  CreateUserRequest,
  LoginRequest,
  LoginResponse,
  PosChargeRequest,
  PosChargeResponse,
  PosMeResponse,
  StoreDetailResponse,
  StoreItem,
  UpsertStoreRequest,
  TopupRequest,
  TopupResponse,
  UpdateUserRequest,
  UserAnalyticsResponse,
  UserDetailResponse,
  UserMeResponse,
  UserTransactionQuery,
  WalletTransaction,
} from "@/lib/api/types";

export const authApi = {
  me: () => requestJson<AuthMeResponse>("/api/auth/me"),
  login: (payload: LoginRequest) => requestJson<LoginResponse>("/api/auth/login", { method: "POST", body: payload }),
  logout: () => requestJson<ApiOk>("/api/auth/logout", { method: "POST" }),
};

export const adminApi = {
  getStats: (months = 6) => requestJson<AdminStatsResponse>("/api/admin/stats", { query: { months } }),
  topup: (payload: TopupRequest) => requestJson<TopupResponse>("/api/admin/topup", { method: "POST", body: payload }),
  getUsers: (query = "") => requestJson<AdminUserListItem[]>("/api/admin/users", { query: { query } }),
  getUserDetail: (id: string) => requestJson<UserDetailResponse>(`/api/admin/users/${id}`),
  createUser: (payload: CreateUserRequest) => requestJson<AdminUserListItem>("/api/admin/users", { method: "POST", body: payload }),
  updateUser: (id: string, payload: UpdateUserRequest) =>
    requestJson<AdminUserListItem>(`/api/admin/users/${id}`, { method: "PUT", body: payload }),
  deleteUser: (id: string) => requestJson<ApiOk>(`/api/admin/users/${id}`, { method: "DELETE" }),
  getStores: () => requestJson<StoreItem[]>("/api/admin/stores"),
  createStore: (payload: UpsertStoreRequest) =>
    requestJson<StoreItem>("/api/admin/stores", { method: "POST", body: payload }),
  updateStore: (id: string, payload: { storeName: string; defaultChargeAmount: number }) =>
    requestJson<StoreItem>(`/api/admin/stores/${id}`, { method: "PUT", body: payload }),
  deleteStore: (id: string) => requestJson<ApiOk>(`/api/admin/stores/${id}`, { method: "DELETE" }),
  getStoreDetail: (id: string) => requestJson<StoreDetailResponse>(`/api/admin/stores/${id}`),
  assignCard: (payload: AssignCardRequest) =>
    requestJson<AssignCardResponse>("/api/admin/cards/assign", { method: "POST", body: payload }),
  getCardMappings: () => requestJson<CardMapping[]>("/api/admin/cards"),
  getTransactions: (query: AdminTransactionQuery) =>
    requestJson<WalletTransaction[]>("/api/admin/transactions", { query }),
  exportCsv: () => downloadFile("/api/admin/export/csv", "admin-transactions.csv"),
  exportXlsx: () => downloadFile("/api/admin/export/xlsx", "admin-transactions.xlsx"),
};

export const posApi = {
  me: () => requestJson<PosMeResponse>("/api/pos/me"),
  charge: (payload: PosChargeRequest) => requestJson<PosChargeResponse>("/api/pos/charge", { method: "POST", body: payload }),
  transactions: (query?: { startDate?: string; endDate?: string; search?: string }) =>
    requestJson<WalletTransaction[]>("/api/pos/transactions", { query }),
};

export const userApi = {
  me: () => requestJson<UserMeResponse>("/api/user/me"),
  analytics: (months = 6) => requestJson<UserAnalyticsResponse>("/api/user/analytics", { query: { months } }),
  transactions: (query: UserTransactionQuery & { search?: string }) =>
    requestJson<WalletTransaction[]>("/api/user/transactions", { query }),
};
