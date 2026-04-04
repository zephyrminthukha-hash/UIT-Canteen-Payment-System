"use client";

import { useAuthGuard } from "@/hooks/use-auth-guard";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { UserShell } from "@/components/layout/user-shell";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { loading, session, isAllowed, authFailed } = useAuthGuard(["USER"]);

  if (authFailed) {
    return <LoadingScreen label="Redirecting to login..." />;
  }

  if (loading || !session || !isAllowed) {
    return <LoadingScreen label="Verifying user access..." />;
  }

  return <UserShell session={session}>{children}</UserShell>;
}
