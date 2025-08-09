import { cookies as nextCookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function createSupabaseServer(responseCookies?: { set: (name:string, value:string, options?: any) => void }) {
  const cookieStore = await (nextCookies as unknown as () => Promise<any>)()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        // If a Response cookie setter is passed (e.g., from route handler), write to that.
        // Otherwise write to the request cookie store (server components).
        setAll: (cookieList) => {
          for (const { name, value, options } of cookieList) {
            if (responseCookies) {
              responseCookies.set(name, value, { ...options, path: '/' })
            } else {
              cookieStore.set(name, value, options)
            }
          }
        },
      },
    }
  )
}