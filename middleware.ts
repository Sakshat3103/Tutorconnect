import { NextResponse, type NextRequest } from "next/server";

// Send logged-out visitors to /login for private pages (role checks happen on the page itself)
export function middleware(req: NextRequest) {
  if (!req.cookies.get("tc_session")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
