import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthEnabled, sessionCookieName, verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api/v1") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  if (pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(sessionCookieName())?.value;
  if (!(await verifySessionToken(token))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
