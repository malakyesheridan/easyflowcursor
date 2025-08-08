import { createMiddlewareClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Initialize Supabase middleware client using request/response cookies
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if needed; persists cookies on the response
  await supabase.auth.getSession();

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};