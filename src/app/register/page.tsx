import { RegisterForm } from "@/features/auth/components/register-form";
import { getRequestUser } from "@/lib/auth";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign up — Unlost",
  description:
    "Create a free Unlost account and start building your personal library.",
};

// Invite links look like /register?invite=CODE. Reading it here on the server
// means the form arrives in the first HTML with the code already filled in.
export default async function RegisterPage({
  searchParams,
}: PageProps<"/register">) {
  const { invite } = await searchParams;
  const isAuthenticated = Boolean(await getRequestUser());

  if (isAuthenticated) {
    redirect("/dashboard");
  }

  return (
    <RegisterForm
      initialInviteCode={typeof invite === "string" ? invite : ""}
    />
  );
}
