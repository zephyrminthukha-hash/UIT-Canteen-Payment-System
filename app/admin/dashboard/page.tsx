"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DollarSign, Receipt, Store, Wallet } from "lucide-react";
import { adminApi } from "@/lib/api/endpoints";
import type { AdminStatsResponse, WalletTransaction } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";
import { demoAdminStats, demoTransactions } from "@/lib/demo-data";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartCard } from "@/components/shared/chart-card";
import { DataTable, type DataColumn } from "@/components/shared/data-table";
import { toast } from "sonner";

const palette = ["#2563eb", "#7c3aed", "#ea580c", "#059669", "#db2777", "#0891b2"];

interface StoreGrowthRow {
  storeName: string;
  thisMonthSales: number;
  lastMonthSales: number;
  growthPercent: number | null;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const [statsRes, txRes] = await Promise.all([
          adminApi.getStats(6),
          adminApi.getTransactions({
            startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          }),
        ]);

        if (!mounted) return;
        setStats(statsRes);
        setTransactions(txRes);
        setIsDemo(false);
      } catch (error) {
        if (!mounted) return;
        toast.error(`${getErrorMessage(error)}. Showing demo data.`);
        setStats(demoAdminStats);
        setTransactions(demoTransactions);
        setIsDemo(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const chartData = useMemo(() => {
    if (!stats) return [];
    return stats.months.map((month, idx) => {
      const row: Record<string, string | number> = { month };
      stats.stores.forEach((store) => {
        row[store.storeName] = store.monthlyTotals[idx] ?? 0;
      });
      return row;
    });
  }, [stats]);

  const kpis = useMemo(() => {
    const purchase = transactions.filter((item) => item.type === "PURCHASE");
    const topups = transactions.filter((item) => item.type === "TOPUP");
    const totalRevenue = purchase.reduce((acc, item) => acc + item.amount, 0);
    const topStore = stats?.stores.reduce<StoreGrowthRow | null>((prev, cur) => {
      if (!prev || cur.thisMonth > prev.thisMonthSales) {
        return {
          storeName: cur.storeName,
          thisMonthSales: cur.thisMonth,
          lastMonthSales: cur.lastMonth,
          growthPercent: cur.growthPercent,
        };
      }
      return prev;
    }, null);

    return {
      totalRevenue,
      txCount: purchase.length,
      topStore: topStore?.storeName ?? "N/A",
      topups: topups.reduce((acc, item) => acc + item.amount, 0),
    };
  }, [stats, transactions]);

  const storeRows: StoreGrowthRow[] =
    stats?.stores.map((item) => ({
      storeName: item.storeName,
      thisMonthSales: item.thisMonth,
      lastMonthSales: item.lastMonth,
      growthPercent: item.growthPercent,
    })) ?? [];

  const columns: DataColumn<StoreGrowthRow>[] = [
    {
      key: "storeName",
      header: "Store",
      render: (row) => row.storeName,
    },
    {
      key: "thisMonth",
      header: "This Month",
      render: (row) => formatCurrency(row.thisMonthSales),
    },
    {
      key: "lastMonth",
      header: "Last Month",
      render: (row) => formatCurrency(row.lastMonthSales),
    },
    {
      key: "growth",
      header: "Growth",
      render: (row) => formatPercent(row.growthPercent),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Monthly KPI overview across stores, topups, and purchases."
        isDemo={isDemo}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Revenue this month" value={formatCurrency(kpis.totalRevenue)} icon={<DollarSign className="h-4 w-4" />} />
        <KpiCard title="Transactions this month" value={String(kpis.txCount)} icon={<Receipt className="h-4 w-4" />} />
        <KpiCard title="Top store this month" value={kpis.topStore} icon={<Store className="h-4 w-4" />} />
        <KpiCard title="Topups this month" value={formatCurrency(kpis.topups)} icon={<Wallet className="h-4 w-4" />} />
      </section>

      <ChartCard title="Store monthly sales (last 6 months)" isDemo={isDemo}>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              {stats?.stores.map((store, index) => (
                <Line
                  key={store.storeId}
                  type="monotone"
                  dataKey={store.storeName}
                  stroke={palette[index % palette.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <DataTable
        title="Store growth table"
        data={storeRows}
        columns={columns}
        loading={loading}
        emptyMessage="No store stats found."
      />
    </div>
  );
}
