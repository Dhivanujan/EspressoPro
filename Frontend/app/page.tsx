"use client";

import { useEffect } from "react";
import { useAuth, getDefaultRoute } from "../lib/auth";
import { Coffee, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { loading, user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const target = token ? getDefaultRoute(user?.role ?? null) : "/login";
    router.replace(target);
  }, [loading, token, user, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(254,191,140,0.25),_transparent_35%),linear-gradient(180deg,_#faf8f5_0%,_#f3efe9_100%)] px-6">
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-white/70 bg-white/80 px-10 py-12 text-center shadow-2xl shadow-coffee-700/10 backdrop-blur-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-coffee-700 text-white shadow-lg shadow-coffee-700/20">
          <Coffee size={30} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-coffee-950">EspressoPro</h1>
          <p className="mt-2 text-sm text-gray-500">Loading your workspace...</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-coffee-500">
          <Loader2 className="animate-spin" size={14} />
          Preparing workflow
        </div>
      </div>
    </main>
  );
}
