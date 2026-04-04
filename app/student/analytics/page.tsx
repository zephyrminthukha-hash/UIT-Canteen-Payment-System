"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { userApi } from "@/lib/api/endpoints";
import type { UserAnalyticsResponse } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";
import { demoUserAnalytics } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { ChartCard } from "@/components/shared/chart-card";
import { DataTable, type DataColumn } from "@/components/shared/data-table";
import { toast } from "sonner";

const pieColors = ["#2563eb", "#7c3aed", "#ea580c", "#16a34a", "#db2777", "#0891b2"];

export default function UserAnalyticsPage() {
  const [analytics, setAnalytics] = useState<UserAnalyticsResponse | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    userApi
      .analytics(6)
      .then((res) => {
        setAnalytics(res);
        setIsDemo(false);
      })
      .catch((error) => {
        toast.error(`${getErrorMessage(error)}. Showing demo data.`);
        setAnalytics(demoUserAnalytics);
        setIsDemo(true);
      });
  }, []);

  const monthlyData = useMemo(() => {
    if (!analytics) return [];
    return analytics.months.map((month, index) => ({
      month,
      total: analytics.monthlyTotals[index] ?? 0,
    }));
  }, [analytics]);

  const columns: DataColumn<{ storeName: string; total: number }>[] = [
    { key: "store", header: "Store", render: (row) => row.storeName },
    { key: "total", header: "Spent (This Month)", render: (row) => formatCurrency(row.total) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Spending Analytics" description="Monthly and per-store spending insights." isDemo={isDemo} />

      <ChartCard title="Monthly spending (last 6 months)" isDemo={isDemo}>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <DataTable
          title="Spending by store (this month)"
          data={analytics?.byStore ?? []}
          columns={columns}
          emptyMessage="No store breakdown available."
        />

        <ChartCard title="Store share chart" isDemo={isDemo}>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics?.byStore ?? []}
                  dataKey="total"
                  nameKey="storeName"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                >
                  {(analytics?.byStore ?? []).map((entry, index) => (
                    <Cell key={entry.storeId} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
