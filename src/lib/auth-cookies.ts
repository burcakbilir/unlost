import { cookies } from "next/headers";
import {
  createSessionToken,
  sessionCookieName,
  sessionMaxAgeSeconds,
} from "@/lib/session";

export async function setSessionCookie(userId: string) {
  const token = createSessionToken(userId);
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionMaxAgeSeconds,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}
