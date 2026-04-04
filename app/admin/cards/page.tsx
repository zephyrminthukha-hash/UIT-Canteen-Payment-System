"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/endpoints";
import type { CardMapping } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";
import { demoCardMappings } from "@/lib/demo-data";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataColumn } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const assignSchema = z.object({
  uid: z.string().min(4, "UID required"),
  userId: z.string().min(1, "User ID required"),
});

type AssignForm = z.infer<typeof assignSchema>;

export default function AdminCardsPage() {
  const [mappings, setMappings] = useState<CardMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);
  const [scanBuffer, setScanBuffer] = useState("");

  const form = useForm<AssignForm>({
    resolver: zodResolver(assignSchema),
    defaultValues: { uid: "", userId: "" },
  });

  const ensureFocus = () => {
    const activeElement = document.activeElement;
    const isTypingInAnotherField =
      activeElement instanceof HTMLElement &&
      activeElement !== scanRef.current &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.tagName === "SELECT" ||
        activeElement.isContentEditable);

    if (isTypingInAnotherField) {
      return;
    }

    if (scanRef.current && activeElement !== scanRef.current) {
      scanRef.current.focus();
    }
  };

  useEffect(() => {
    ensureFocus();
    const id = window.setInterval(ensureFocus, 400);
    return () => window.clearInterval(id);
  }, []);

  const loadMappings = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCardMappings();
      setMappings(data);
      setIsDemo(false);
    } catch (error) {
      toast.error(`${getErrorMessage(error)}. Showing demo data.`);
      setMappings(demoCardMappings);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMappings();
  }, []);

  const submitAssign = async (values: AssignForm) => {
    try {
      await adminApi.assignCard(values);
      toast.success("Card assigned successfully");
      form.reset({ uid: "", userId: values.userId });
      setScanBuffer("");
      await loadMappings();
      ensureFocus();
    } catch (error) {
      toast.error(getErrorMessage(error));
      ensureFocus();
    }
  };

  const onScanEnter = async () => {
    const uid = scanBuffer.trim();
    if (!uid) return;
    form.setValue("uid", uid, { shouldValidate: true });
    setScanBuffer("");

    const userId = form.getValues("userId");
    if (userId) {
      await submitAssign({ uid, userId });
    } else {
      toast.success("UID captured from scanner");
      ensureFocus();
    }
  };

  const columns: DataColumn<CardMapping>[] = [
    { key: "uid", header: "Card UID", render: (row) => row.uid },
    { key: "userId", header: "User ID", render: (row) => row.userId },
    { key: "userName", header: "User Name", render: (row) => row.userName ?? "-" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Card Assignment"
        description="Scan UID from NFC reader and assign to users."
        isDemo={isDemo}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Scan card UID</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scanUid">Tap card (auto-focused input)</Label>
              <Input
                ref={scanRef}
                id="scanUid"
                value={scanBuffer}
                onChange={(event) => setScanBuffer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onScanEnter();
                  }
                }}
                className="h-14 text-xl tracking-wider"
                placeholder="Waiting for UID scan..."
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This input stays focused for keyboard-wedge scanners.
              </p>
            </div>

            <form className="space-y-3 rounded-lg border p-4" onSubmit={form.handleSubmit(submitAssign)}>
              <div className="space-y-1.5">
                <Label>UID</Label>
                <Input {...form.register("uid")} placeholder="04AABB11CC22" />
                {form.formState.errors.uid ? <p className="text-xs text-destructive">{form.formState.errors.uid.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label>User ID</Label>
                <Input {...form.register("userId")} placeholder="u1001" />
                {form.formState.errors.userId ? (
                  <p className="text-xs text-destructive">{form.formState.errors.userId.message}</p>
                ) : null}
              </div>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Assigning..." : "Confirm assignment"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <DataTable title="Card mappings" data={mappings} columns={columns} loading={loading} />
      </div>
    </div>
  );
}
