import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export default async function DebugSession() {
  const cookieStore = cookies()
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

  return (
    <pre style={{ padding: 16 }}>
      {JSON.stringify(
        {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          error: error ?? null,
        },
        null,
        2
      )}
    </pre>
  )
}