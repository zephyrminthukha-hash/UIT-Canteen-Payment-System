"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authApi } from "@/lib/api/endpoints";
import { getErrorMessage } from "@/lib/api/client";
import { getHomeRouteByRole } from "@/hooks/use-auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginForm) => {
    try {
      const result = await authApi.login(values);
      toast.success("Logged in successfully");
      // Hard redirect to the correct dashboard for the user's role
      window.location.href = getHomeRouteByRole(result.role);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF3E0] p-4">
      <Card className="w-full max-w-md border-[#077D8A]/20 bg-white">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white p-2 ring-2 ring-[#077D8A]">
            <Image src="/uit-logo.png" alt="UiT Logo" width={48} height={48} className="object-contain" priority />
          </div>
          <CardTitle className="text-[#077D8A]">UIT Canteen Payment System</CardTitle>
          <CardDescription>Login with your account role to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" autoComplete="username" {...form.register("username")} />
              {form.formState.errors.username ? (
                <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
              {form.formState.errors.password ? (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              ) : null}
            </div>

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
            </Button>

            <div className="pt-2 text-center text-xs text-muted-foreground">
              <p>Developed by Batch 13, Section A</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
