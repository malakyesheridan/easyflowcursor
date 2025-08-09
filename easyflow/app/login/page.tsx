'use client'

import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import { getSiteUrl } from '@/lib/env'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const supabase = createSupabaseBrowser()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` }
    })
    if (error) {
      console.error(error)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold mb-4">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full border rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full rounded bg-black text-white py-2 disabled:opacity-50"
        >
          {status === 'sending' ? 'Sending…' : 'Send magic link'}
        </button>
      </form>
      {status === 'sent' && (
        <p className="mt-3 text-sm">Check your email for the sign-in link.</p>
      )}
      {status === 'error' && (
        <p className="mt-3 text-sm text-red-600">Failed to send link. Try again.</p>
      )}
    </div>
  )
}