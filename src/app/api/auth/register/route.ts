import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth-cookies";

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RegisterBody | null;

  if (!body?.name || !body.email || !body.password) {
    return NextResponse.json(
      { message: "Name, email and password are required" },
      { status: 400 },
    );
  }

  if (body.password.length < 8) {
    return NextResponse.json(
      { message: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const name = body.name.trim();
  const email = body.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return NextResponse.json(
      { message: "Email is already registered" },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(body.password);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  await setSessionCookie(user.id);

  return NextResponse.json(
    { user: { id: user.id, name: user.name, email: user.email } },
    { status: 201 },
  );
}
