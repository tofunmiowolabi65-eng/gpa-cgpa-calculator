"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed.");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F4E9] px-4 py-12 text-[#243B2D]">
      <div className="w-full max-w-md rounded-3xl border border-[#E5E0D2] bg-[#FFFEF9] p-8 shadow-[0_12px_40px_rgba(36,59,45,0.08)] sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#244B35] text-2xl font-bold text-[#F7F4E9]">
            G
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>

          <p className="mt-3 text-sm leading-6 text-[#788477]">
            Log in to GradeTrack and continue monitoring your academic
            performance.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-[#344C3B]"
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-[#DDDCCF] bg-[#FAF9F3] px-4 py-3 text-[#243B2D] outline-none transition placeholder:text-[#A3A99D] focus:border-[#315E40] focus:ring-2 focus:ring-[#315E40]/10"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-[#344C3B]"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-[#DDDCCF] bg-[#FAF9F3] px-4 py-3 text-[#243B2D] outline-none transition placeholder:text-[#A3A99D] focus:border-[#315E40] focus:ring-2 focus:ring-[#315E40]/10"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#244B35] py-3.5 font-semibold text-[#FFFEF9] transition hover:bg-[#315E40] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="my-7 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#E7E3D8]" />
          <span className="text-xs text-[#A0A597]">NEW TO GRADETRACK?</span>
          <div className="h-px flex-1 bg-[#E7E3D8]" />
        </div>

        <p className="text-center text-sm text-[#788477]">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-bold text-[#315E40] transition hover:text-[#183B28]"
          >
            Sign up
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-[#A0A597]">
          © 2026 GradeTrack. All rights reserved.
        </p>
      </div>
    </main>
  );
}
