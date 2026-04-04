import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookieName, verifySessionToken } from "@/lib/server/auth/session";

function mapRoleToHome(role: "ADMIN" | "STORE" | "USER") {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "STORE") return "/pos";
  if (role === "USER") return "/student/dashboard";
  return "/login";
}

function isRoleAllowed(pathname: string, role: "ADMIN" | "STORE" | "USER") {
  if (pathname.startsWith("/admin")) return role === "ADMIN";
  if (pathname.startsWith("/pos")) return role === "STORE";
  if (pathname.startsWith("/student")) return role === "USER";
  return true;
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    const isProtected =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/pos") ||
      pathname.startsWith("/student");

    if (!isProtected) {
      return NextResponse.next();
    }

    const sessionToken = request.cookies.get(getSessionCookieName())?.value;
    if (!sessionToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    const session = await verifySessionToken(sessionToken);
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      const response = NextResponse.redirect(url);
      response.cookies.set(getSessionCookieName(), "", { maxAge: 0, path: "/" });
      return response;
    }

    if (!isRoleAllowed(pathname, session.role)) {
      const url = request.nextUrl.clone();
      url.pathname = mapRoleToHome(session.role);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    // If middleware fails for any reason, redirect to login as a safe fallback
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/admin/:path*", "/pos/:path*", "/student/:path*"],
};
