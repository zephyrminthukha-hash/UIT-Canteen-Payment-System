"use client";

import { useEffect, useMemo, useState } from "react";
import { authApi } from "@/lib/api/endpoints";
import type { AuthMeResponse, Role } from "@/lib/api/types";

function roleDefaultRoute(role: Role) {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "STORE":
      return "/pos";
    case "USER":
      return "/student/dashboard";
    default:
      return "/login";
  }
}

/**
 * Hard redirect using window.location – more reliable than Next.js router
 * when the app is in an uncertain state (e.g. no session, hydration issues).
 */
function hardRedirect(path: string) {
  if (typeof window !== "undefined") {
    window.location.href = path;
  }
}

export function useAuthGuard(allowedRoles: Role[]) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthMeResponse | null>(null);
  const [authFailed, setAuthFailed] = useState(false);
  const rolesKey = allowedRoles.join("|");
  const allowedRolesSet = useMemo(() => new Set(allowedRoles), [rolesKey]);

  useEffect(() => {
    let mounted = true;

    // Safety timeout – if auth check takes longer than 8 seconds, bail out
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        setAuthFailed(true);
        setLoading(false);
        hardRedirect("/login");
      }
    }, 8000);

    const run = async () => {
      try {
        const me = await authApi.me();
        if (!mounted) return;

        if (!allowedRolesSet.has(me.role)) {
          // Logged in but wrong role – redirect to correct dashboard
          hardRedirect(roleDefaultRoute(me.role));
          return;
        }

        setSession(me);
      } catch {
        if (!mounted) return;
        setAuthFailed(true);
        // Not authenticated – hard redirect to login
        hardRedirect("/login");
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimer);
        }
      }
    };

    run();

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, [allowedRolesSet, loading]);

  const isAllowed = useMemo(() => {
    if (!session) return false;
    return allowedRolesSet.has(session.role);
  }, [allowedRolesSet, session]);

  return { loading, session, isAllowed, authFailed };
}

export function getHomeRouteByRole(role: Role) {
  return roleDefaultRoute(role);
}
