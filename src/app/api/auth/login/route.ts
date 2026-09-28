import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth-cookies";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginBody | null;

  if (!body?.email || !body.password) {
    return NextResponse.json(
      { message: "Email and password are required" },
      { status: 400 },
    );
  }

  const email = body.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Same message whether the email is unknown or the password is wrong,
  // so a caller can't use this endpoint to discover which emails exist.
  const invalidCredentials = NextResponse.json(
    { message: "Invalid email or password" },
    { status: 401 },
  );

  if (!user) {
    return invalidCredentials;
  }

  const isPasswordValid = await verifyPassword(body.password, user.passwordHash);

  if (!isPasswordValid) {
    return invalidCredentials;
  }

  await setSessionCookie(user.id);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
}
