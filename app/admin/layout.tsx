"use client";

import { useAuthGuard } from "@/hooks/use-auth-guard";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { AdminShell } from "@/components/layout/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loading, session, isAllowed, authFailed } = useAuthGuard(["ADMIN"]);

  if (authFailed) {
    return <LoadingScreen label="Redirecting to login..." />;
  }

  if (loading || !session || !isAllowed) {
    return <LoadingScreen label="Verifying admin access..." />;
  }

  return <AdminShell session={session}>{children}</AdminShell>;
}
