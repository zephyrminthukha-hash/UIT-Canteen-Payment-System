"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Edit3, Plus, Store, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/api/endpoints";
import type { StoreDetailResponse, StoreItem } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";
import { demoStores, demoTransactions } from "@/lib/demo-data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataColumn } from "@/components/shared/data-table";
import { ChartCard } from "@/components/shared/chart-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const storeSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  defaultChargeAmount: z.coerce.number().int().positive("Amount must be a positive whole number"),
  ownerUsername: z.string().trim().optional(),
  ownerPassword: z.string().optional(),
  ownerName: z.string().trim().optional(),
});

type StoreForm = z.infer<typeof storeSchema>;

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreDetailResponse | null>(null);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);

  const form = useForm<StoreForm>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      storeName: "",
      defaultChargeAmount: 0,
      ownerUsername: "",
      ownerPassword: "",
      ownerName: "",
    },
  });

  const loadStores = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getStores();
      setStores(response);
      setIsDemo(false);
    } catch (error) {
      toast.error(`${getErrorMessage(error)}. Showing demo data.`);
      setStores(demoStores);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreDetail = async (storeId: string) => {
    try {
      const detail = await adminApi.getStoreDetail(storeId);
      setSelectedStore(detail);
      setIsDemo(false);
    } catch (error) {
      const fallback = stores.find((store) => store.storeId === storeId);
      if (!fallback) return;
      setSelectedStore({
        ...fallback,
        months: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"],
        monthlyTotals: [800, 910, 1040, 1120, 1080, 1190],
        recentTransactions: demoTransactions.filter((tx) => tx.storeId === storeId).slice(0, 8),
      });
      setIsDemo(true);
      toast.error(`${getErrorMessage(error)}. Showing demo detail.`);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (stores.length && !selectedStore) {
      loadStoreDetail(stores[0].storeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores]);

  const onSubmit = async (values: StoreForm) => {
    try {
      if (editingStoreId) {
        await adminApi.updateStore(editingStoreId, {
          storeName: values.storeName,
          defaultChargeAmount: values.defaultChargeAmount,
        });
        toast.success("Store updated");
      } else {
        form.clearErrors(["ownerUsername", "ownerPassword"]);
        const ownerUsername = values.ownerUsername?.trim() ?? "";
        const ownerPassword = values.ownerPassword ?? "";
        const ownerName = values.ownerName?.trim() ?? "";

        if (ownerUsername.length < 3) {
          form.setError("ownerUsername", {
            type: "manual",
            message: "Username must be at least 3 characters",
          });
          return;
        }
        if (ownerPassword.length < 6) {
          form.setError("ownerPassword", {
            type: "manual",
            message: "Password must be at least 6 characters",
          });
          return;
        }

        await adminApi.createStore({
          storeName: values.storeName,
          defaultChargeAmount: values.defaultChargeAmount,
          ownerUsername,
          ownerPassword,
          ownerName: ownerName || undefined,
        });
        toast.success(`Store created. Login username: ${ownerUsername}`);
      }
      form.reset({
        storeName: "",
        defaultChargeAmount: 0,
        ownerUsername: "",
        ownerPassword: "",
        ownerName: "",
      });
      setEditingStoreId(null);
      await loadStores();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onEdit = (store: StoreItem) => {
    setEditingStoreId(store.storeId);
    form.reset({
      storeName: store.storeName,
      defaultChargeAmount: store.defaultChargeAmount,
      ownerUsername: "",
      ownerPassword: "",
      ownerName: "",
    });
  };

  const onDelete = async (storeId: string) => {
    if (!window.confirm("Delete this store?")) return;
    try {
      await adminApi.deleteStore(storeId);
      toast.success("Store deleted");
      if (selectedStore?.storeId === storeId) {
        setSelectedStore(null);
      }
      await loadStores();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const storeColumns: DataColumn<StoreItem>[] = [
    {
      key: "storeId",
      header: "Store ID",
      render: (row) => row.storeId,
    },
    {
      key: "name",
      header: "Store Name",
      render: (row) => row.storeName,
    },
    {
      key: "amount",
      header: "Default Charge",
      render: (row) => formatCurrency(row.defaultChargeAmount),
    },
    {
      key: "ownerUsername",
      header: "Store Login",
      render: (row) => row.ownerUsername ?? "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="relative z-10 flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => onEdit(row)}>
            <Edit3 className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); loadStoreDetail(row.storeId); }}>
            <Store className="mr-1 h-3.5 w-3.5" />
            Detail
          </Button>
          <Button type="button" size="sm" variant="destructive" onClick={() => onDelete(row.storeId)}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const chartData = useMemo(() => {
    if (!selectedStore) return [];
    return selectedStore.months.map((month, index) => ({
      month,
      total: selectedStore.monthlyTotals[index] ?? 0,
    }));
  }, [selectedStore]);

  return (
    <div className="space-y-6">
      <PageHeader title="Stores Management" description="Manage store fixed tap charges and track store performance." isDemo={isDemo} />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="min-w-0">
          <DataTable
            title="Stores"
            data={stores}
            columns={storeColumns}
            loading={loading}
            emptyMessage="No stores found."
            rowKey={(row) => row.storeId}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{editingStoreId ? "Edit store" : "Create store"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-1.5">
                <Label>Store name</Label>
                <Input {...form.register("storeName")} />
                {form.formState.errors.storeName ? (
                  <p className="text-xs text-destructive">{form.formState.errors.storeName.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label>Fixed tap charge (MMK)</Label>
                <Input type="number" step="1" min="1" {...form.register("defaultChargeAmount")} />
                {form.formState.errors.defaultChargeAmount ? (
                  <p className="text-xs text-destructive">{form.formState.errors.defaultChargeAmount.message}</p>
                ) : null}
              </div>
              {!editingStoreId ? (
                <>
                  <div className="space-y-1.5">
                    <Label>Store login username</Label>
                    <Input autoComplete="username" {...form.register("ownerUsername")} placeholder="store2" />
                    {form.formState.errors.ownerUsername ? (
                      <p className="text-xs text-destructive">{form.formState.errors.ownerUsername.message}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Store login password</Label>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...form.register("ownerPassword")}
                      placeholder="At least 6 characters"
                    />
                    {form.formState.errors.ownerPassword ? (
                      <p className="text-xs text-destructive">{form.formState.errors.ownerPassword.message}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Operator name (optional)</Label>
                    <Input {...form.register("ownerName")} placeholder="Store 2 Operator" />
                  </div>
                </>
              ) : null}
              <div className="flex gap-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  <Plus className="mr-2 h-4 w-4" />
                  {editingStoreId ? "Save" : "Create"}
                </Button>
                {editingStoreId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingStoreId(null);
                      form.reset({
                        storeName: "",
                        defaultChargeAmount: 0,
                        ownerUsername: "",
                        ownerPassword: "",
                        ownerName: "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {selectedStore ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartCard title={`${selectedStore.storeName} monthly sales`} isDemo={isDemo}>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <Card>
            <CardHeader>
              <CardTitle>Recent transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedStore.recentTransactions.length ? (
                selectedStore.recentTransactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>{tx.userName ?? tx.userId}</span>
                      <span className="font-medium">{formatCurrency(tx.amount)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No transactions for this store.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
