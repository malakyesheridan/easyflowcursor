import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSiteUrl } from '@/lib/env';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookieStore = await (cookies as unknown as () => Promise<any>)();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, { ...options, secure: true } as any);
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(url.toString());
  // console.error('exchangeCodeForSession error', error);

  const dest = `${getSiteUrl()}/dashboard`;
  return NextResponse.redirect(dest);
}