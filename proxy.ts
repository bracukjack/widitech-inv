import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "wi_session";
// The landing page, auth pages and SEO/branding assets are public.
const PUBLIC_PATHS = ["/login", "/register", "/site-asset"];

/**
 * Fast, optimistic gate: visitors without a session cookie go straight to the
 * login page. The cookie is fully validated against the database in
 * app/(app)/layout.tsx and in every server action.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/" || PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, static files and server-action/RSC assets.
  matcher: ["/((?!_next/|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"],
};
