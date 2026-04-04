"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api/endpoints";
import { getErrorMessage } from "@/lib/api/client";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      toast.success("Logged out");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
}
