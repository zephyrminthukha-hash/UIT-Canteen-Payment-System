"use client";

import { useEffect, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/endpoints";
import type { StoreItem, TransactionType, WalletTransaction } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";
import { demoStores, demoTransactions } from "@/lib/demo-data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataColumn } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [storeId, setStoreId] = useState("");
  const [type, setType] = useState<"" | TransactionType>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [txRes, storesRes] = await Promise.all([
        adminApi.getTransactions({
          query: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          storeId: storeId || undefined,
          type: type || undefined,
          userId: search || undefined,
        }),
        adminApi.getStores(),
      ]);

      setTransactions(txRes);
      setStores(storesRes);
      setIsDemo(false);
    } catch (error) {
      toast.error(`${getErrorMessage(error)}. Showing demo data.`);
      setStores(demoStores);
      setTransactions(
        demoTransactions.filter((tx) => {
          const hitSearch = !search || tx.userId.includes(search) || tx.id.includes(search);
          const hitType = !type || tx.type === type;
          const hitStore = !storeId || tx.storeId === storeId;
          const txDate = new Date(tx.createdAt).getTime();
          const hitStart = !startDate || txDate >= new Date(startDate).getTime();
          const hitEnd = !endDate || txDate <= new Date(endDate).getTime() + 86_399_000;
          return hitSearch && hitType && hitStore && hitStart && hitEnd;
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

  const handleExportCsv = async () => {
    try {
      await adminApi.exportCsv();
      toast.success("CSV download started");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleExportXlsx = async () => {
    try {
      await adminApi.exportXlsx();
      toast.success("XLSX download started");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const columns: DataColumn<WalletTransaction>[] = [
    { key: "id", header: "Tx ID", render: (row) => row.id },
    { key: "time", header: "Time", render: (row) => formatDateTime(row.createdAt) },
    { key: "type", header: "Type", render: (row) => row.type },
    { key: "user", header: "User", render: (row) => row.userId },
    { key: "store", header: "Store", render: (row) => row.storeName ?? row.storeId ?? "-" },
    { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Transactions"
        description="Filter, inspect, and export all topups and purchases."
        isDemo={isDemo}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleExportXlsx}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export XLSX
            </Button>
          </div>
        }
      />

      <DataTable
        title="Transactions"
        data={transactions}
        columns={columns}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by user ID or transaction ID..."
        dateStart={startDate}
        dateEnd={endDate}
        onDateStartChange={setStartDate}
        onDateEndChange={setEndDate}
        extraFilters={
          <div className="flex flex-col gap-2 md:flex-row">
            <Select value={storeId} onChange={(event) => setStoreId(event.target.value)}>
              <option value="">All stores</option>
              {stores.map((store) => (
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
