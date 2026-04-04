"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/layout/logout-button";
import { cn } from "@/lib/utils";
import type { AuthMeResponse } from "@/lib/api/types";
import { History, LayoutDashboard, ReceiptText } from "lucide-react";

const navItems = [
  { href: "/pos", label: "POS", icon: LayoutDashboard },
  { href: "/pos/history", label: "History", icon: History },
  { href: "/pos/summary", label: "Summary", icon: ReceiptText },
];

interface PosShellProps {
  session: AuthMeResponse;
  children: React.ReactNode;
}

export function PosShell({ session, children }: PosShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#FAF3E0] text-[#077D8A]">
      <header className="border-b border-[#077D8A]/30 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <p className="font-semibold text-[#077D8A]">POS Console</p>
            <Badge variant="secondary" className="bg-[#077D8A]/20 text-[#077D8A]">
              STORE
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#077D8A]/80">
            <span>{session.storeName ?? "Store"}</span>
            <span className="text-[#077D8A]/50">|</span>
            <span>{session.name ?? session.userId}</span>
          </div>
        </div>
        <nav className="mx-auto mt-3 flex max-w-6xl gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center rounded-md border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-[#077D8A] bg-[#077D8A] text-white"
                    : "border-[#077D8A]/40 text-[#077D8A] hover:bg-[#077D8A]/10",
                )}
              >
                <Icon className="mr-1 h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="ml-auto">
            <LogoutButton />
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 p-6">{children}</main>
    </div>
  );
}
