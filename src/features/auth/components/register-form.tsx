"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/api-client";
import { PasswordInput } from "@/features/auth/components/password-input";
import { registerFormSchema } from "@/features/auth/schema";
import { z } from "@/lib/zod";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Invite links look like /register?invite=CODE, so the field arrives filled in.
  const [inviteCode, setInviteCode] = useState(searchParams.get("invite") ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldsError, setFieldsError] = useState<{
    name?: string;
    email?: string;
    password?: string;
    passwordConfirm?: string;
    inviteCode?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldsError({});

    const parsed = registerFormSchema.safeParse({
      name,
      email,
      password,
      passwordConfirm,
      inviteCode,
    });
    if (!parsed.success) {
      const errors = z.flattenError(parsed.error).fieldErrors;
      setFieldsError({
        name: errors.name?.[0],
        email: errors.email?.[0],
        password: errors.password?.[0],
        passwordConfirm: errors.passwordConfirm?.[0],
        inviteCode: errors.inviteCode?.[0],
      });
      return;
    }
    setIsSubmitting(true);

    try {
      await apiPost("/api/auth/register", {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        inviteCode: parsed.data.inviteCode,
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-5 py-10">
      <Link
        href="/"
        aria-label="Unlost home"
        className="font-display text-xl"
      >
        unlost.
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-border p-8">
        <h1 className="font-display text-3xl">Create your account</h1>
        <p className="mt-2 text-sm text-muted">
          Unlost is invite-only for now. Enter the code you were given.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4" noValidate>
          <label className="grid gap-1.5 text-sm font-medium">
            Invite code
            <input
              name="inviteCode"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              required
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(fieldsError.inviteCode)}
              className="min-h-12 rounded-xl border border-border px-4 font-mono focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
            {fieldsError.inviteCode ? (
              <span className="text-sm font-normal text-red-600">
                {fieldsError.inviteCode}
              </span>
            ) : null}
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Name
            <input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoComplete="name"
              className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
            {fieldsError.name ? (
              <span className="text-sm font-normal text-red-600">
                {fieldsError.name}
              </span>
            ) : null}
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Email
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
              className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
            {fieldsError.email ? (
              <span className="text-sm font-normal text-red-600">
                {fieldsError.email}
              </span>
            ) : null}
          </label>

          <label className="grid gap-1.5 text-sm font-medium">
            Password
            <PasswordInput
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
            {fieldsError.password ? (
              <span className="text-sm font-normal text-red-600">
                {fieldsError.password}
              </span>
            ) : null}
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Password Confirm
            <PasswordInput
              name="passwordConfirm"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              required
              autoComplete="new-password"
              placeholder="Repeat your password"
              className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
            {fieldsError.passwordConfirm ? (
              <span className="text-sm font-normal text-red-600">
                {fieldsError.passwordConfirm}
              </span>
            ) : null}
          </label>

          {error ? (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 bg-foreground px-6 py-3 text-background disabled:opacity-60 rounded-xl"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-xs leading-5 text-muted">
          By creating an account you agree to how we handle your data, described
          in our{" "}
          <Link href="/privacy" className="underline">
            privacy notice
          </Link>
          .
        </p>

        <p className="mt-3 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
