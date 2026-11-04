import { LoginForm } from "@/features/auth/components/login-form";
import { getRequestUser } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign in — Unlost",
  description:
    "Sign in to your Unlost library to find the links, notes and images you saved.",
};

export default async function LoginPage() {
  const isAuthenticated = Boolean(await getRequestUser());

  if (isAuthenticated) {
    redirect("/dashboard");
  }
  return <LoginForm />;
}
