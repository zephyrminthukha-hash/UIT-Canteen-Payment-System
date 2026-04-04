"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Search, WalletCards } from "lucide-react";
import { adminApi } from "@/lib/api/endpoints";
import type { AdminUserListItem, WalletTransaction } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";
import { demoTransactions, demoUsers } from "@/lib/demo-data";
import { safeJsonParse, formatCurrency, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataColumn } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const topupSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: z.string().optional(),
});

type TopupForm = z.infer<typeof topupSchema>;

export default function AdminTopupPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [qrPayload, setQrPayload] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const form = useForm<TopupForm>({
    resolver: zodResolver(topupSchema),
    defaultValues: {
      userId: "",
      amount: 0,
      note: "",
    },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, txRes] = await Promise.all([adminApi.getUsers(search), adminApi.getTransactions({ type: "TOPUP" })]);
      setUsers(usersRes);
      setTransactions(txRes);
      setIsDemo(false);
    } catch (error) {
      toast.error(`${getErrorMessage(error)}. Showing demo data.`);
      setUsers(
        demoUsers.filter((item) => {
          if (!search) return true;
          return item.id.includes(search) || item.username.toLowerCase().includes(search.toLowerCase());
        }),
      );
      setTransactions(demoTransactions.filter((item) => item.type === "TOPUP"));
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const onSubmit = async (values: TopupForm) => {
    try {
      const response = await adminApi.topup(values);
      toast.success(`Topup successful. Tx: ${response.txId}`);
      form.reset({ userId: values.userId, amount: 0, note: "" });
      await loadData();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const applyQrPayload = () => {
    if (!qrPayload.trim()) return;
    const parsed = safeJsonParse<{ userId?: string }>(qrPayload.trim());
    if (parsed?.userId) {
      form.setValue("userId", parsed.userId);
      toast.success("User ID populated from QR payload JSON");
      return;
    }

    form.setValue("userId", qrPayload.trim());
    toast.success("User ID populated from plain payload");
  };

  const recentTopups = useMemo(
    () =>
      transactions
        .filter((item) => item.type === "TOPUP")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
    [transactions],
  );

  const columns: DataColumn<WalletTransaction>[] = [
    {
      key: "txId",
      header: "Tx ID",
      render: (row) => row.id,
    },
    {
      key: "user",
      header: "User",
      render: (row) => row.userId,
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => formatCurrency(row.amount),
    },
    {
      key: "note",
      header: "Note",
      render: (row) => row.note ?? "-",
    },
    {
      key: "time",
      header: "Time",
      render: (row) => formatDateTime(row.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Topup Wallet"
        description="Find users, scan QR payload, and top up balances."
        isDemo={isDemo}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Topup form</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="search-user">Search user (ID / username)</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-user"
                    className="pl-9"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="u1001 or jane.doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input id="userId" {...form.register("userId")} />
                {form.formState.errors.userId ? (
                  <p className="text-xs text-destructive">{form.formState.errors.userId.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" step="0.01" {...form.register("amount")} />
                {form.formState.errors.amount ? (
                  <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note (optional)</Label>
                <Textarea id="note" rows={3} {...form.register("note")} />
              </div>

              <Button type="submit" disabled={form.formState.isSubmitting}>
                <WalletCards className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? "Processing..." : "Topup Wallet"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scan QR payload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={qrPayload}
              onChange={(event) => setQrPayload(event.target.value)}
              placeholder='Paste {"userId":"u1001"} or plain userId'
            />
            <Button type="button" variant="secondary" onClick={applyQrPayload}>
              Apply payload
            </Button>

            <div className="rounded-md border p-3">
              <p className="text-xs font-medium text-muted-foreground">Matching users</p>
              <div className="mt-2 space-y-2">
                {users.slice(0, 8).map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => form.setValue("userId", user.id)}
                  >
                    <span>{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.id}</span>
                  </button>
                ))}
                {users.length === 0 ? <p className="text-xs text-muted-foreground">No users found.</p> : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title="Recent topups"
        data={recentTopups}
        columns={columns}
        loading={loading}
        emptyMessage="No topups found."
      />
    </div>
  );
}
