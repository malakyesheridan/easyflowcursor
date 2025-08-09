import { createSupabaseServer } from '@/lib/supabase/server'

export default async function DebugSession() {
  const supabase = await createSupabaseServer()
  const { data: { session }, error } = await supabase.auth.getSession()
  return (
    <pre style={{padding:16}}>
      {JSON.stringify({ hasSession: !!session, user: session?.user, error: error ?? null }, null, 2)}
    </pre>
  )
}