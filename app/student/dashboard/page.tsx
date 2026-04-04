"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, Wallet } from "lucide-react";
import { userApi } from "@/lib/api/endpoints";
import type { UserMeResponse, WalletTransaction } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";
import { demoTransactions, demoUserMe } from "@/lib/demo-data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function monthPrefix(date: Date) {
  return date.toISOString().slice(0, 7);
}

export default function UserDashboardPage() {
  const [me, setMe] = useState<UserMeResponse | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    Promise.all([userApi.me(), userApi.transactions({})])
      .then(([meRes, txRes]) => {
        setMe(meRes);
        setTransactions(txRes);
        setIsDemo(false);
      })
      .catch((error) => {
        toast.error(`${getErrorMessage(error)}. Showing demo data.`);
        setMe(demoUserMe);
        setTransactions(demoTransactions);
        setIsDemo(true);
      });
  }, []);

  const thisMonth = monthPrefix(new Date());
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = monthPrefix(lastMonthDate);

  const monthly = useMemo(() => {
    const spentThisMonth = transactions
      .filter((tx) => tx.type === "PURCHASE" && tx.createdAt.slice(0, 7) === thisMonth)
      .reduce((acc, tx) => acc + tx.amount, 0);
    const spentLastMonth = transactions
      .filter((tx) => tx.type === "PURCHASE" && tx.createdAt.slice(0, 7) === lastMonth)
      .reduce((acc, tx) => acc + tx.amount, 0);
    return {
      spentThisMonth,
      spentLastMonth,
      delta: spentThisMonth - spentLastMonth,
    };
  }, [transactions, thisMonth, lastMonth]);

  return (
    <div className="space-y-6">
      <PageHeader title="My Dashboard" description="Current asset and latest wallet activity." isDemo={isDemo} />

      <section className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="Current balance (asset)"
          value={formatCurrency(me?.balance ?? 0)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <KpiCard title="Spent this month" value={formatCurrency(monthly.spentThisMonth)} />
        <KpiCard
          title="Delta vs last month"
          value={formatCurrency(monthly.delta)}
          icon={<ArrowDownRight className="h-4 w-4" />}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {transactions.slice(0, 8).map((tx) => (
            <div key={tx.id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span>{tx.storeName ?? tx.type}</span>
                <span className="font-medium">{formatCurrency(tx.amount)}</span>
              </div>
              <div className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</div>
            </div>
          ))}
          {transactions.length === 0 ? <p className="text-sm text-muted-foreground">No transactions yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
