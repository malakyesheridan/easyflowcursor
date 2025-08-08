"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  const linkCls = (href: string) =>
    `px-3 py-2 rounded-md ${pathname === href ? "bg-gray-900 text-white" : "text-gray-200 hover:bg-gray-700 hover:text-white"}`;

  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="text-white font-semibold">
              EasyFlow
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/dashboard" className={linkCls("/dashboard")}>Dashboard</Link>
              <Link href="/calls" className={linkCls("/calls")}>Calls</Link>
              <Link href="/settings" className={linkCls("/settings")}>Settings</Link>
              <Link href="/notifications" className={linkCls("/notifications")}>Notifications</Link>
            </div>
          </div>
          <div>
            <button onClick={onLogout} disabled={loading} className="text-gray-200 hover:text-white px-3 py-2 rounded-md border border-gray-700 hover:border-gray-500">
              {loading ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}