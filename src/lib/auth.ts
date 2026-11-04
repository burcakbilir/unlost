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
    select: { id: true, name: true, email: true, sessionVersion: true },
  });

  // A version mismatch means the user signed out after this token was issued.
  if (!user || user.sessionVersion !== session.sessionVersion) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
