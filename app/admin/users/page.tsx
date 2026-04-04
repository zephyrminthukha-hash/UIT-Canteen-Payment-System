"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Edit3, Plus, Trash2, UserRound } from "lucide-react";
import { adminApi } from "@/lib/api/endpoints";
import type { AdminUserListItem, UserDetailResponse } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";
import { demoCardMappings, demoTransactions, demoUsers } from "@/lib/demo-data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataColumn } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const createUserSchema = z.object({
  username: z.string().min(3, "Min 3 chars"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Min 6 chars"),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

const editUserSchema = z.object({
  username: z.string().min(3, "Min 3 chars"),
  name: z.string().min(1, "Name is required"),
  password: z.string().optional(),
});

type EditUserForm = z.infer<typeof editUserSchema>;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetailResponse | null>(null);

  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { username: "", name: "", password: "" },
  });

  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { username: "", name: "", password: "" },
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUsers(query);
      setUsers(data.filter((item) => item.role === "USER"));
      setIsDemo(false);
    } catch (error) {
      toast.error(`${getErrorMessage(error)}. Showing demo data.`);
      setUsers(
        demoUsers.filter((item) => item.role === "USER").filter((item) => {
          if (!query) return true;
          return item.id.includes(query) || item.username.toLowerCase().includes(query.toLowerCase());
        }),
      );
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const openDetail = async (userId: string) => {
    try {
      const detail = await adminApi.getUserDetail(userId);
      setSelectedUser(detail);
      editForm.reset({
        username: detail.username,
        name: detail.name,
        password: "",
      });
      setDetailOpen(true);
    } catch (error) {
      const fallback = users.find((u) => u.id === userId);
      if (!fallback) return;
      setSelectedUser({
        id: fallback.id,
        username: fallback.username,
        name: fallback.name,
        role: "USER",
        balance: 17.5,
        recentTransactions: demoTransactions.slice(0, 5),
        cards: demoCardMappings.filter((card) => card.userId === fallback.id),
      });
      editForm.reset({
        username: fallback.username,
        name: fallback.name,
        password: "",
      });
      setDetailOpen(true);
      setIsDemo(true);
      toast.error(`${getErrorMessage(error)}. Showing demo detail.`);
    }
  };

  const createUser = async (values: CreateUserForm) => {
    try {
      await adminApi.createUser({ ...values, role: "USER" });
      toast.success("User created");
      createForm.reset();
      await loadUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const updateUser = async (values: EditUserForm) => {
    if (!selectedUser) return;
    try {
      await adminApi.updateUser(selectedUser.id, values);
      toast.success("User updated");
      setDetailOpen(false);
      await loadUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await adminApi.deleteUser(id);
      toast.success("User deleted");
      if (selectedUser?.id === id) {
        setDetailOpen(false);
      }
      await loadUsers();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const userColumns: DataColumn<AdminUserListItem>[] = [
    { key: "id", header: "User ID", render: (row) => row.id },
    { key: "name", header: "Name", render: (row) => row.name },
    { key: "username", header: "Username", render: (row) => row.username },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openDetail(row.id)}>
            <Edit3 className="mr-1 h-3.5 w-3.5" />
            Detail
          </Button>
          <Button size="sm" variant="destructive" onClick={() => deleteUser(row.id)}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const transactionsPreview = useMemo(() => selectedUser?.recentTransactions.slice(0, 5) ?? [], [selectedUser]);

  return (
    <div className="space-y-6">
      <PageHeader title="Users Management" description="CRUD for USER accounts and wallet details." isDemo={isDemo} />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <DataTable
          title="Users"
          data={users}
          columns={userColumns}
          loading={loading}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search by user ID or username..."
        />

        <Card>
          <CardHeader>
            <CardTitle>Create user</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={createForm.handleSubmit(createUser)}>
              <div className="space-y-1.5">
                <Label>Username</Label>
                <Input {...createForm.register("username")} />
                {createForm.formState.errors.username ? (
                  <p className="text-xs text-destructive">{createForm.formState.errors.username.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input {...createForm.register("name")} />
                {createForm.formState.errors.name ? (
                  <p className="text-xs text-destructive">{createForm.formState.errors.name.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" {...createForm.register("password")} />
                {createForm.formState.errors.password ? (
                  <p className="text-xs text-destructive">{createForm.formState.errors.password.message}</p>
                ) : null}
              </div>
              <Button type="submit" disabled={createForm.formState.isSubmitting}>
                <Plus className="mr-2 h-4 w-4" />
                {createForm.formState.isSubmitting ? "Creating..." : "Create user"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {detailOpen && selectedUser ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <div className="mx-auto mt-8 max-h-[85vh] w-full max-w-3xl overflow-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <UserRound className="h-5 w-5" />
                <h2 className="text-lg font-semibold">User detail: {selectedUser.id}</h2>
              </div>
              <Button variant="ghost" onClick={() => setDetailOpen(false)}>
                Close
              </Button>
            </div>
            <div className="space-y-6 p-4">
              <Card>
                <CardHeader>
                  <CardTitle>Edit user</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-3 md:grid-cols-2" onSubmit={editForm.handleSubmit(updateUser)}>
                    <div className="space-y-1.5">
                      <Label>Username</Label>
                      <Input {...editForm.register("username")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input {...editForm.register("name")} />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>New password (optional)</Label>
                      <Input type="password" {...editForm.register("password")} />
                    </div>
                    <div className="md:col-span-2">
                      <Button type="submit" disabled={editForm.formState.isSubmitting}>
                        Save changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">User ID</CardTitle>
                  </CardHeader>
                  <CardContent>{selectedUser.id}</CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Name</CardTitle>
                  </CardHeader>
                  <CardContent>{selectedUser.name}</CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Wallet balance</CardTitle>
                  </CardHeader>
                  <CardContent>{formatCurrency(selectedUser.balance)}</CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Assigned cards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedUser.cards.length ? (
                    selectedUser.cards.map((card) => (
                      <div key={card.uid} className="rounded-md border p-2 text-sm">
                        <span className="font-medium">{card.uid}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No cards assigned.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent transactions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {transactionsPreview.length ? (
                    transactionsPreview.map((tx) => (
                      <div key={tx.id} className="rounded-md border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span>{tx.type}</span>
                          <span className="font-medium">{formatCurrency(tx.amount)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{formatDateTime(tx.createdAt)}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent transactions.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
