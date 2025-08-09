import { NextResponse } from 'next/server'
import { cookies as nextCookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET() {
  const cookieStore = await (nextCookies as unknown as () => Promise<any>)()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          for (const { name, value, options } of list) {
            cookieStore.set(name, value, options)
          }
        },
      },
    }
  )
  const { data: { session }, error } = await supabase.auth.getSession()
  return NextResponse.json({
    route: '/api/debug/session',
    hasSession: !!session,
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    error: error ?? null,
  })
}