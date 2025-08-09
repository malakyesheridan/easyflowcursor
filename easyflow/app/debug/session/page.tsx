'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function DebugSession() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      setSessionInfo({ hasSession: !!data.session, user: data.session?.user || null, error: error ?? null })
    })
  }, [])

  return (
    <pre style={{padding:16}}>
      {JSON.stringify(sessionInfo, null, 2)}
    </pre>
  )
}