"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ASSETS, AUTH_CONTENT } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("No user session found.");

      // Check role & approval status using role column
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        throw new Error("Profile record not found. Please contact administration.");
      }

      if (profile.role === "admin") {
        router.push("/admin");
        return;
      }

      if (profile.status === "pending_approval") {
        throw new Error("Your Senapati registration is pending approval.");
      }

      if (profile.status === "rejected" || profile.status === "cancelled") {
        throw new Error("Your registration is not approved. Please contact temple admin.");
      }

      router.push("/senapati");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-112px)] bg-white flex items-center justify-center py-10 px-6 sm:px-12 font-['Arimo',sans-serif]">
      <div className="max-w-5xl w-full grid grid-cols-1 min-[799px]:grid-cols-2 gap-12 items-center">
        {/* Left Side: ISKCON Logo */}
        <div className="hidden min-[799px]:flex justify-center items-center">
          <div className="w-[300px] h-[300px] lg:w-[340px] lg:h-[340px] relative">
            <Image
              src={ASSETS.iskconLogo}
              alt="ISKCON Damodardesh Logo"
              fill
              priority
              className="object-contain"
              sizes="340px"
            />
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full max-w-md mx-auto">
          <h1 className="text-[32px] sm:text-[36px] font-bold text-[#A89F91] text-center mb-8">
            {AUTH_CONTENT.loginHeading}
          </h1>

          {errorMsg && (
            <div className="p-3 mb-6 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <div className="relative">
                <input
                  type="email"
                  required
                  maxLength={50}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-4 py-3.5 border border-black rounded-lg text-base outline-none focus:ring-1 focus:ring-black placeholder-slate-700 font-medium"
                />
              </div>
              <div className="text-right text-xs text-slate-500 mt-1 font-medium">
                {email.length}/50
              </div>
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  maxLength={40}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your Password"
                  className="w-full pl-4 pr-12 py-3.5 border border-black rounded-lg text-base outline-none focus:ring-1 focus:ring-black placeholder-slate-700 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.75}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.75}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <div className="text-right text-xs text-slate-500 mt-1 font-medium">
                {password.length}/40
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#84C341] hover:bg-[#77B336] text-white font-bold text-sm tracking-wider rounded-lg shadow-md transition disabled:opacity-50 uppercase cursor-pointer"
            >
              {loading ? "Verifying..." : AUTH_CONTENT.loginButton}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-600 font-medium">
            Not registered as a Senapati yet?{" "}
            <Link
              href="/senapati-registration"
              className="text-sky-700 font-bold hover:underline"
            >
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}