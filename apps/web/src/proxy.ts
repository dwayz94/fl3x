import { NextResponse, type NextRequest } from "next/server";

/**
 * The team page lives at a secret address: with ADMIN_PATH set (server env,
 * never sent to the browser), /<ADMIN_PATH> shows it and /admin is a plain 404.
 * Without it, /admin works as before (local dev).
 */
export function proxy(request: NextRequest) {
  const secret = process.env.ADMIN_PATH?.replace(/^\/+|\/+$/g, "");
  if (!secret) return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (pathname === `/${secret}`) return NextResponse.rewrite(new URL("/admin", request.url));
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
  return NextResponse.next();
}

export const config = {
  // Pages only: no static files, no API routes.
  matcher: "/((?!_next/|api/|.*\\..*).*)",
};
