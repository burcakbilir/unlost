import jwt from "jsonwebtoken";

function requireSessionSecret(): string {
  const value = process.env.SESSION_SECRET;

  if (!value) {
    throw new Error("SESSION_SECRET is required.");
  }

  return value;
}

const sessionSecret = requireSessionSecret();

export const sessionCookieName = "unlost_session";
export const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
};

export function createSessionToken(userId: string) {
  return jwt.sign({ userId }, sessionSecret, {
    expiresIn: sessionMaxAgeSeconds,
  });
}

export function verifySessionToken(token?: string) {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, sessionSecret) as SessionPayload;
  } catch {
    return null;
  }
}
