import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const cookieStore = await (nextCookies as unknown as () => Promise<any>)();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookieList) => cookieList.forEach(({ name, value, options }) => cookieStore.set(name, value, options as any)),
      },
    }
  );

  await supabase.auth.exchangeCodeForSession(request.url);
  return redirect("/dashboard");
}