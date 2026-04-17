import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Note: Token validation happens server-side on API calls.
// This middleware only prevents unauthenticated users from seeing the dashboard shell.
export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email");

  // ไม่มี token + เข้า dashboard → redirect ไป login
  if (isDashboard && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // มี token + เข้าหน้า auth → redirect ไป dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ],
};
