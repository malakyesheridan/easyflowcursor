import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

function isProd() {
  return process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://')
}

function siteUrlFrom(requestUrl: string) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (fromEnv) return fromEnv
  const u = new URL(requestUrl)
  return `${u.protocol}//${u.host}`
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const dest = `${siteUrlFrom(request.url)}/dashboard`
  const response = NextResponse.redirect(dest)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookies().getAll(),
        setAll: (cookieList) => {
          for (const { name, value, options } of cookieList) {
            response.cookies.set({
              name,
              value,
              ...options,
              httpOnly: true,
              sameSite: 'lax',
              secure: isProd(),
              path: '/',
            })
          }
        },
      },
    }
  )

  await supabase.auth.exchangeCodeForSession(url.toString())
  return response
}