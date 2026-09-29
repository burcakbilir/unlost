"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiPost } from "@/lib/api-client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await apiPost("/api/auth/login", { email, password });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-surface px-5 py-10">
      <Link
        href="/"
        aria-label="Unlost home"
        className="text-xl font-semibold tracking-tight"
      >
        unlost<span className="text-primary">.</span>
      </Link>
      <div className="w-full max-w-md border border-border bg-background p-8">
        <h1 className="font-display text-3xl">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Continue to your personal library.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
              className="min-h-12 border border-border bg-white px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="min-h-12 border border-border bg-white px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 bg-foreground px-6 py-3 text-white disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-primary">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
