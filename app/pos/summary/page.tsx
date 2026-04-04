"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { posApi } from "@/lib/api/endpoints";
import type { WalletTransaction } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";
import { demoTransactions } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartCard } from "@/components/shared/chart-card";
import { toast } from "sonner";

function toYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function PosSummaryPage() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 14);

    posApi
      .transactions({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      })
      .then((res) => {
        setTransactions(res);
        setIsDemo(false);
      })
      .catch((error) => {
        toast.error(`${getErrorMessage(error)}. Showing demo data.`);
        setTransactions(demoTransactions.filter((item) => item.type === "PURCHASE"));
        setIsDemo(true);
      });
  }, []);

  const todayTotal = useMemo(() => {
    const today = toYmd(new Date());
    return transactions
      .filter((tx) => tx.type === "PURCHASE" && tx.createdAt.slice(0, 10) === today)
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactions]);

  const monthTotal = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    return transactions
      .filter((tx) => tx.type === "PURCHASE" && tx.createdAt.slice(0, 7) === month)
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactions]);

  const chartData = useMemo(() => {
    const points: Record<string, number> = {};
    const end = new Date();
    for (let i = 13; i >= 0; i -= 1) {
      const date = new Date(end);
      date.setDate(end.getDate() - i);
      points[toYmd(date)] = 0;
    }

    transactions
      .filter((tx) => tx.type === "PURCHASE")
      .forEach((tx) => {
        const day = tx.createdAt.slice(0, 10);
        if (day in points) {
          points[day] += tx.amount;
        }
      });

    return Object.entries(points).map(([date, total]) => ({
      date: date.slice(5),
      total,
    }));
  }, [transactions]);

  return (
    <div className="space-y-6 text-slate-900">
      <PageHeader title="Store Summary" description="Track short-term sales performance." isDemo={isDemo} />

      <section className="grid gap-4 md:grid-cols-2">
        <KpiCard title="Today sales total" value={formatCurrency(todayTotal)} />
        <KpiCard title="This month total" value={formatCurrency(monthTotal)} />
      </section>

      <ChartCard title="Daily totals (last 14 days)" isDemo={isDemo}>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="summaryFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#22c55e" fill="url(#summaryFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
}
