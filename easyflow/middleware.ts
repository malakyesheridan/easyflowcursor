import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function isAllowed(pathname: string) {
  return (
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/debug') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname.startsWith('/_next')
  )
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (isAllowed(pathname)) return NextResponse.next()

  let res = NextResponse.next({ request: req })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options as any)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (pathname === '/login' && session) {
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