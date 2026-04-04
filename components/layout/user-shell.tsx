"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/layout/logout-button";
import { cn } from "@/lib/utils";
import type { AuthMeResponse } from "@/lib/api/types";

const tabs = [
  { href: "/student/dashboard", label: "Dashboard" },
  { href: "/student/analytics", label: "Analytics" },
  { href: "/student/transactions", label: "Transactions" },
];

interface UserShellProps {
  session: AuthMeResponse;
  children: React.ReactNode;
}

export function UserShell({ session, children }: UserShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#FAF3E0]">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Student Wallet</p>
            <p className="text-xs text-muted-foreground">
              {session.name ?? "User"} ({session.userId})
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge>USER</Badge>
            <LogoutButton />
          </div>
        </div>
        <nav className="mx-auto mt-4 flex w-full max-w-5xl flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                pathname === tab.href ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl space-y-6 p-6">{children}</main>
    </div>
  );
}
