"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import { PasswordInput } from "@/features/auth/components/password-input";
import { registerFormSchema } from "@/features/auth/schema";
import { z } from "@/lib/zod";

export function RegisterForm({
  initialInviteCode,
}: {
  initialInviteCode: string;
}) {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
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
    <main className="flex min-h-screen flex-col items-center gap-8 px-5 pt-16 pb-10 sm:pt-24">
      <Link href="/" aria-label="Unlost home" className="font-display text-xl">
        unlost.
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-border p-8">
        <h1 className="font-display text-3xl">Create your account</h1>
        <p className="mt-2 text-sm text-muted">
          Unlost is invite-only for now. Enter the code you were given.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4" noValidate>
          <div className="grid gap-1.5 text-sm font-medium">
            <label htmlFor="register-invite-code">Invite code</label>
            <input
              id="register-invite-code"
              name="inviteCode"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              required
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(fieldsError.inviteCode)}
              aria-describedby={
                fieldsError.inviteCode
                  ? "register-invite-code-error"
                  : undefined
              }
              className="min-h-12 rounded-xl border border-border px-4 font-mono focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
            {fieldsError.inviteCode ? (
              <span
                id="register-invite-code-error"
                className="text-sm font-normal text-red-600"
              >
                {fieldsError.inviteCode}
              </span>
            ) : null}
          </div>

          <div className="grid gap-1.5 text-sm font-medium">
            <label htmlFor="register-name">Name</label>
            <input
              id="register-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoComplete="name"
              aria-invalid={Boolean(fieldsError.name)}
              aria-describedby={
                fieldsError.name ? "register-name-error" : undefined
              }
              className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
            {fieldsError.name ? (
              <span
                id="register-name-error"
                className="text-sm font-normal text-red-600"
              >
                {fieldsError.name}
              </span>
            ) : null}
          </div>

          <div className="grid gap-1.5 text-sm font-medium">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="username"
              aria-invalid={Boolean(fieldsError.email)}
              aria-describedby={
                fieldsError.email ? "register-email-error" : undefined
              }
              className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
            {fieldsError.email ? (
              <span
                id="register-email-error"
                className="text-sm font-normal text-red-600"
              >
                {fieldsError.email}
              </span>
            ) : null}
          </div>

          <div className="grid gap-1.5 text-sm font-medium">
            <label htmlFor="register-password">Password</label>
            <PasswordInput
              id="register-password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="new-password"
              placeholder="At least 8 characters"
              aria-invalid={Boolean(fieldsError.password)}
              aria-describedby={
                fieldsError.password ? "register-password-error" : undefined
              }
              className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
            {fieldsError.password ? (
              <span
                id="register-password-error"
                className="text-sm font-normal text-red-600"
              >
                {fieldsError.password}
              </span>
            ) : null}
          </div>

          <div className="grid gap-1.5 text-sm font-medium">
            <label htmlFor="register-password-confirm">Confirm password</label>
            <PasswordInput
              id="register-password-confirm"
              name="passwordConfirm"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              required
              autoComplete="new-password"
              placeholder="Repeat your password"
              aria-invalid={Boolean(fieldsError.passwordConfirm)}
              aria-describedby={
                fieldsError.passwordConfirm
                  ? "register-password-confirm-error"
                  : undefined
              }
              className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
            {fieldsError.passwordConfirm ? (
              <span
                id="register-password-confirm-error"
                className="text-sm font-normal text-red-600"
              >
                {fieldsError.passwordConfirm}
              </span>
            ) : null}
          </div>

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
          <Link
            href="/login"
            className="font-semibold underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
