import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/env'

export async function GET(request: Request) {
  const site = getSiteUrl()
  const dest = `${site}/dashboard`

  // Prepare a redirect response we can write cookies onto
  const response = NextResponse.redirect(dest)

  // Create server client that writes cookies onto THIS response
  const supabase = await createSupabaseServer(response.cookies)

  // Exchange the code for a session; auth helper will set sb-* cookies via response.cookies
  const { data, error } = await supabase.auth.exchangeCodeForSession(new URL(request.url).toString())

  // Manual fallback: if session exists but helper didn't set cookies, write them explicitly
  const session = data?.session
  if (session?.access_token && session?.refresh_token) {
    response.cookies.set({
      name: 'sb-access-token',
      value: session.access_token,
      httpOnly: true,
      sameSite: 'lax',
      secure: site.startsWith('https://'),
      path: '/',
      maxAge: session.expires_in ?? 3600
    })
    response.cookies.set({
      name: 'sb-refresh-token',
      value: session.refresh_token,
      httpOnly: true,
      sameSite: 'lax',
      secure: site.startsWith('https://'),
      path: '/',
      maxAge: 60 * 60 * 24 * 60 // ~60 days
    })
  }

  // Optionally surface error in a header for debugging
  if (error) response.headers.set('x-exchange-error', String(error.message || error))

  return response
}