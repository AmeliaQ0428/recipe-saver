"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push(redirectTo);
      router.refresh();
    } else {
      setConfirmationSent(true);
    }
  }

  if (confirmationSent) {
    return (
      <main className="mx-auto max-w-sm px-4 py-12">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm">
          <h1 className="font-display text-2xl font-bold text-stone-900">
            Check your email
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            We&apos;ve sent a confirmation link to <span className="font-medium">{email}</span>.
            Click it to finish setting up your account, then come back and log in.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block font-medium text-amber-700 hover:underline"
          >
            Back to log in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-stone-900">
          Create an account
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Save your favourite recipes and keep notes on the ones you&apos;ve tried.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-stone-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-stone-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-sm text-stone-500">
          Already have an account?{" "}
          <Link
            href={`/login${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
            className="font-medium text-amber-700 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
