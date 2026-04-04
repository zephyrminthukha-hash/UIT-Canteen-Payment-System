"use client";

import { useAuthGuard } from "@/hooks/use-auth-guard";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { PosShell } from "@/components/layout/pos-shell";

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const { loading, session, isAllowed, authFailed } = useAuthGuard(["STORE"]);

  if (authFailed) {
    return <LoadingScreen label="Redirecting to login..." />;
  }

  if (loading || !session || !isAllowed) {
    return <LoadingScreen label="Verifying store access..." />;
  }

  return <PosShell session={session}>{children}</PosShell>;
}
