import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function maskToken(token?: string | null) {
  if (!token) return null
  if (token.length <= 8) return '***'
  return `${token.slice(0, 4)}...${token.slice(-4)}`
}

export default async function DebugSessionPage() {
  const cookieStore = await (cookies as unknown as () => Promise<any>)()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options as any)
          }
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const masked = session
    ? {
        ...session,
        access_token: maskToken((session as any).access_token),
        refresh_token: maskToken((session as any).refresh_token),
      }
    : null

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Debug Session</h1>
      <pre className="text-sm bg-gray-100 p-3 rounded">
        {JSON.stringify({ hasSession: !!session, session: masked }, null, 2)}
      </pre>
    </div>
  )
}