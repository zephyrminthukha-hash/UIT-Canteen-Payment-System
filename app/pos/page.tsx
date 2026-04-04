"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { posApi } from "@/lib/api/endpoints";
import type { PosChargeResponse, PosMeResponse } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/api/client";
import { demoChargeResult, demoPosMe } from "@/lib/demo-data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PosStatus = "READY" | "PROCESSING" | "SUCCESS" | "FAILED";

export default function PosPage() {
  const [store, setStore] = useState<PosMeResponse | null>(null);
  const [uid, setUid] = useState("");
  const [status, setStatus] = useState<PosStatus>("READY");
  const [result, setResult] = useState<PosChargeResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const uidRef = useRef<HTMLInputElement>(null);
  const resetTimeoutRef = useRef<number | null>(null);

  const ensureFocus = () => {
    if (uidRef.current && document.activeElement !== uidRef.current) {
      uidRef.current.focus();
    }
  };

  useEffect(() => {
    let mounted = true;
    posApi
      .me()
      .then((data) => {
        if (!mounted) return;
        setStore(data);
        setIsDemo(false);
      })
      .catch((error) => {
        if (!mounted) return;
        toast.error(`${getErrorMessage(error)}. Showing demo data.`);
        setStore(demoPosMe);
        setIsDemo(true);
      });

    ensureFocus();
    const id = window.setInterval(ensureFocus, 350);

    return () => {
      mounted = false;
      window.clearInterval(id);
      if (resetTimeoutRef.current) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const resetAfterAttempt = () => {
    resetTimeoutRef.current = window.setTimeout(() => {
      setUid("");
      setStatus("READY");
      setErrorMessage("");
      ensureFocus();
    }, 1000);
  };

  const runCharge = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || status === "PROCESSING") return;

    setStatus("PROCESSING");
    setErrorMessage("");

    try {
      const response = await posApi.charge({ uid: trimmed });
      setResult(response);
      setStatus("SUCCESS");
      setIsDemo(false);
    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);

      if (isDemo) {
        setResult({
          ...demoChargeResult,
          txId: `tx-demo-${Math.floor(Math.random() * 100000)}`,
          createdAt: new Date().toISOString(),
          user: {
            ...demoChargeResult.user,
            id: trimmed,
          },
        });
      }
      setStatus("FAILED");
    } finally {
      resetAfterAttempt();
    }
  };

  const statusBadge = useMemo(() => {
    if (status === "READY") {
      return <Badge variant="secondary">Ready</Badge>;
    }
    if (status === "PROCESSING") {
      return (
        <Badge className="gap-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Processing
        </Badge>
      );
    }
    if (status === "SUCCESS") {
      return (
        <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Success
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="h-3.5 w-3.5" />
        Failed
      </Badge>
    );
  }, [status]);

  return (
    <div className="space-y-6">
      <PageHeader title="POS Charge Screen" description="Keep scanner input focused and charge on Enter." isDemo={isDemo} />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Card className="border-[#077D8A]/30 bg-white shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[#077D8A]">
              <span>{store?.storeName ?? "Loading store..."}</span>
              {statusBadge}
            </CardTitle>
            <p className="text-sm text-[#077D8A]/80">
              Fixed charge per tap: <span className="font-semibold">{formatCurrency(store?.defaultChargeAmount ?? 0)}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#077D8A]">Tap card (UID)</Label>
              <Input
                ref={uidRef}
                value={uid}
                onChange={(event) => setUid(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    runCharge(uid);
                  }
                }}
                autoFocus
                className="h-16 border-[#077D8A]/40 bg-[#FAF3E0] text-2xl tracking-wider text-[#077D8A] placeholder:text-[#077D8A]/50"
                placeholder="Waiting for card tap..."
              />
              <p className="text-xs text-[#077D8A]/70">Input auto-refocuses after each attempt and when focus is lost.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#077D8A]/20 bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-[#077D8A]">Last result</CardTitle>
          </CardHeader>
          <CardContent>
            {status === "FAILED" ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {errorMessage || "Charge failed."}
              </div>
            ) : null}

            {result ? (
              <div className="space-y-3 text-base">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">User</span>
                  <span className="font-medium text-[#077D8A]">
                    {result.user.name} ({result.user.id})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Balance before</span>
                  <span className="font-medium">{formatCurrency(result.balanceBefore)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Charge amount</span>
                  <span className="font-medium">{formatCurrency(result.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Balance after</span>
                  <span className="font-medium">{formatCurrency(result.balanceAfter)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Time</span>
                  <span className="font-medium">{formatDateTime(result.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tx ID</span>
                  <span className="font-medium">{result.txId}</span>
                </div>
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center text-center text-muted-foreground">
                <ScanLine className="mb-2 h-8 w-8" />
                <p>No charge attempt yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#077D8A]/20 bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-[#077D8A]">Error states handled</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
          <div className="rounded-md border border-[#077D8A]/20 p-3">Unknown card UID</div>
          <div className="rounded-md border border-[#077D8A]/20 p-3">Insufficient balance</div>
          <div className="rounded-md border border-[#077D8A]/20 p-3">Duplicate tap / cooldown blocked</div>
        </CardContent>
      </Card>
    </div>
  );
}
