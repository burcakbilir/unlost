import { LoginForm } from "@/features/auth/components/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — Unlost",
  description:
    "Sign in to your Unlost library to find the links, notes and images you saved.",
};

export default function LoginPage() {
  return <LoginForm />;
}
