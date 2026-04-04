"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/layout/logout-button";
import type { AuthMeResponse } from "@/lib/api/types";
import {
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  Store,
  Users,
  Wallet,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/topup", label: "Topup", icon: Wallet },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/stores", label: "Stores", icon: Store },
  { href: "/admin/cards", label: "Cards", icon: CreditCard },
  { href: "/admin/transactions", label: "Transactions", icon: ReceiptText },
];

interface AdminShellProps {
  session: AuthMeResponse;
  children: React.ReactNode;
}

export function AdminShell({ session, children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#FAF3E0]">
      <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="border-r bg-white p-4">
          <div className="mb-6 px-2">
            <p className="text-sm font-semibold">UIT Canteen Payment System</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex flex-col">
          <header className="flex items-center justify-between border-b bg-white px-6 py-4">
            <div>
              <p className="text-sm font-medium">{session.name ?? session.userId}</p>
              <p className="text-xs text-muted-foreground">{session.userId}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge>ADMIN</Badge>
              <LogoutButton />
            </div>
          </header>
          <div className="space-y-6 p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
