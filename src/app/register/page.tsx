import { RegisterForm } from "@/features/auth/components/register-form";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign up — Unlost",
  description:
    "Create a free Unlost account and start building your personal library.",
};

export default function RegisterPage() {
  // RegisterForm reads ?invite= with useSearchParams, which needs a Suspense boundary.
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
