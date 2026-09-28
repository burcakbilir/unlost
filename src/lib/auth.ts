import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { sessionCookieName, verifySessionToken } from "@/lib/session";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export async function getRequestUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  const session = verifySessionToken(token);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
