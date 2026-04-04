"use client";

import { useEffect, useState } from "react";
import { posApi } from "@/lib/api/endpoints";
import type { WalletTransaction } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";
import { demoTransactions } from "@/lib/demo-data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataColumn } from "@/components/shared/data-table";
import { toast } from "sonner";

export default function PosHistoryPage() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await posApi.transactions({
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setTransactions(response);
      setIsDemo(false);
    } catch (error) {
      toast.error(`${getErrorMessage(error)}. Showing demo data.`);
      setTransactions(
        demoTransactions.filter((tx) => {
          const hitSearch =
            !search ||
            tx.userId.toLowerCase().includes(search.toLowerCase()) ||
            (tx.userName ?? "").toLowerCase().includes(search.toLowerCase()) ||
            tx.id.toLowerCase().includes(search.toLowerCase());
          const txDate = new Date(tx.createdAt).getTime();
          const hitStart = !startDate || txDate >= new Date(startDate).getTime();
          const hitEnd = !endDate || txDate <= new Date(endDate).getTime() + 86_399_000;
          return hitSearch && hitStart && hitEnd;
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
  }, [search, startDate, endDate]);

  const columns: DataColumn<WalletTransaction>[] = [
    { key: "id", header: "Tx ID", render: (row) => row.id },
    { key: "time", header: "Time", render: (row) => formatDateTime(row.createdAt) },
    { key: "user", header: "User", render: (row) => row.userName ?? row.userId },
    { key: "amount", header: "Amount", render: (row) => formatCurrency(row.amount) },
    { key: "type", header: "Type", render: (row) => row.type },
  ];

  return (
    <div className="space-y-6 text-slate-900">
      <PageHeader title="Store Transaction History" description="Filter by date and search by user." isDemo={isDemo} />
      <DataTable
        title="History"
        data={transactions}
        columns={columns}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        dateStart={startDate}
        dateEnd={endDate}
        onDateStartChange={setStartDate}
        onDateEndChange={setEndDate}
      />
    </div>
  );
}
