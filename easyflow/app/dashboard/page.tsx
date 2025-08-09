import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = await createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  return (
    <div style={{padding: 24}}>
      <h1>Dashboard</h1>
      <p>Signed in as: <b>{session.user.email}</b></p>
    </div>
  )
}