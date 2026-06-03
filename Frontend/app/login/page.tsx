// app/login/page.tsx

"use client";

import { useState } from "react";
import { Coffee, User as UserIcon, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "../../lib/auth";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in both fields");
      return;
    }
    setError("");
    try {
      await login(username, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid username or password. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(rgba(250,248,245,0.2), rgba(250,248,245,0.2)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuDOU8Uyr6FRBRx8UFl2Ovw83zEmQov8nQ2JCP6sR-UDXlIUoLrvNuAwECmR7HYXU0fqtP_vFSgzYrsK8ux3j6E05B_QUET4Wyu1invHNEqqI8murVilRJ2tLB-fytFnegZ6fFROZbOOOIsHqPWRy7LRn628K3_kacAUYkb-YAxjg4XGGW4OMn1Geslal7-WAEJ2zfw5frxFZwxr_3ssHxZ87vlFoRgWOcO1GckPXwKoyEHIDWCwcusGPvJOWFXVgbzgY3zeahG0ugs')",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/10"></div>

      {/* Login Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/20 bg-white/80 backdrop-blur-xl shadow-2xl p-8 flex flex-col gap-6">
        
        {/* Branding */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-coffee-700 flex items-center justify-center text-white mb-3">
            <Coffee size={30} />
          </div>

          <h1 className="text-3xl font-bold text-coffee-950">
            EspressoPro
          </h1>

          <p className="uppercase tracking-[0.25em] text-xs text-gray-500 mt-1">
            Enterprise POS System
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {/* Email / Username */}
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
              Username
            </label>

            <div className="relative">
              <UserIcon
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin or cashier"
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 outline-none transition focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                Password
              </label>

              <button
                type="button"
                onClick={() => alert("Please contact the administrator to reset your password.")}
                className="text-sm text-coffee-500 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-12 outline-none transition focus:border-coffee-500 focus:ring-4 focus:ring-coffee-500/10"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-coffee-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-coffee-500 focus:ring-coffee-500"
            />

            <label className="text-sm text-gray-600">
              Keep me signed in
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-coffee-950 py-3 font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-5 flex flex-col items-center gap-2">
          <p className="uppercase tracking-wider text-xs text-gray-500">
            System Security
          </p>

          <p className="text-xs text-gray-400 text-center">
            Authorized Personnel Only. All activities are monitored and logged.
          </p>
        </div>
      </div>

      {/* Floating Badge */}
      <div className="absolute bottom-10 right-10 hidden lg:flex items-center gap-4 rounded-2xl border border-white/30 bg-white/20 backdrop-blur-xl p-4 text-white">
        <div className="w-10 h-10 rounded-full bg-coffee-500 flex items-center justify-center shadow-lg">
          <ShieldCheck size={20} />
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider opacity-80">
            Security Status
          </p>

          <p className="font-semibold">
            Encrypted Endpoint
          </p>
        </div>
      </div>
    </div>
  );
}