"use client";

import { useEffect, useMemo, useState } from "react";
import { userApi } from "@/lib/api/endpoints";
import type { TransactionType, WalletTransaction } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";
import { demoTransactions, demoUserAnalytics } from "@/lib/demo-data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataColumn } from "@/components/shared/data-table";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";

export default function UserTransactionsPage() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [storeOptions, setStoreOptions] = useState<Array<{ storeId: string; storeName: string }>>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [storeId, setStoreId] = useState("");
  const [type, setType] = useState<"" | TransactionType>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [txRes, analyticsRes] = await Promise.all([
        userApi.transactions({
          search: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          storeId: storeId || undefined,
          type: type || undefined,
        }),
        userApi.analytics(6),
      ]);
      setTransactions(txRes);
      setStoreOptions(analyticsRes.byStore.map((item) => ({ storeId: item.storeId, storeName: item.storeName })));
      setIsDemo(false);
    } catch (error) {
      toast.error(`${getErrorMessage(error)}. Showing demo data.`);
      setStoreOptions(demoUserAnalytics.byStore.map((item) => ({ storeId: item.storeId, storeName: item.storeName })));
      setTransactions(
        demoTransactions.filter((tx) => {
          const hitSearch = !search || tx.id.includes(search) || tx.storeName?.toLowerCase().includes(search.toLowerCase());
          const hitStore = !storeId || tx.storeId === storeId;
          const hitType = !type || tx.type === type;
          const txDate = new Date(tx.createdAt).getTime();
          const hitStart = !startDate || txDate >= new Date(startDate).getTime();
          const hitEnd = !endDate || txDate <= new Date(endDate).getTime() + 86_399_000;
          return hitSearch && hitStore && hitType && hitStart && hitEnd;
        }),
      );
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, startDate, endDate, storeId, type]);

  const columns: DataColumn<WalletTransaction>[] = useMemo(
    () => [
      { key: "id", header: "Tx ID", render: (row) => row.id },
      { key: "date", header: "Date", render: (row) => formatDateTime(row.createdAt) },
      { key: "type", header: "Type", render: (row) => row.type },
      { key: "store", header: "Store", render: (row) => row.storeName ?? row.storeId ?? "-" },
      { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="My Transactions" description="Filter your full wallet history." isDemo={isDemo} />

      <DataTable
        title="Transactions"
        data={transactions}
        columns={columns}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by transaction ID or store name..."
        dateStart={startDate}
        dateEnd={endDate}
        onDateStartChange={setStartDate}
        onDateEndChange={setEndDate}
        extraFilters={
          <div className="flex flex-col gap-2 md:flex-row">
            <Select value={storeId} onChange={(event) => setStoreId(event.target.value)}>
              <option value="">All stores</option>
              {storeOptions.map((store) => (
                <option key={store.storeId} value={store.storeId}>
                  {store.storeName}
                </option>
              ))}
            </Select>
            <Select value={type} onChange={(event) => setType(event.target.value as "" | TransactionType)}>
              <option value="">All types</option>
              <option value="PURCHASE">PURCHASE</option>
              <option value="TOPUP">TOPUP</option>
            </Select>
          </div>
        }
      />
    </div>
  );
}
