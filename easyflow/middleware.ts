import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/ssr'

const ALLOW = ['/auth/callback', '/login', '/favicon.ico', '/robots.txt', '/debug/session']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/_next')) return NextResponse.next()
  if (ALLOW.includes(pathname)) return NextResponse.next()

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  const isLoggedIn = !!session

  if (!isLoggedIn) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (pathname === '/login' && isLoggedIn) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt).*)'],
}