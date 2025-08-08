import { cookies as nextCookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

type CookiePair = { name: string; value: string };
interface ReadonlyRequestCookiesCompat {
  getAll(): CookiePair[];
  set: (opts: { name: string; value: string; [key: string]: unknown }) => void;
}

export function createSupabaseServerClient() {
  const getCookieStore = (): ReadonlyRequestCookiesCompat => {
    const store = (nextCookies as unknown as () => ReadonlyRequestCookiesCompat)();
    return store;
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const store = getCookieStore();
        return store.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookiesToSet) {
        const store = getCookieStore();
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            store.set({ name, value, ...options });
          });
        } catch {
          // ignore cookies set on server actions during rendering
        }
      },
    },
  });
}