import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/dashboard";

  const supabase = createSupabaseServerClient();
  await supabase.auth.exchangeCodeForSession(request.url);

  return NextResponse.redirect(new URL(next, url.origin));
}