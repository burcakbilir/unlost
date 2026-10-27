import jwt from "jsonwebtoken";

function requireSessionSecret(): string {
  const value = process.env.SESSION_SECRET;

  // Anyone who knows this secret can sign a session for any user, so refuse
  // to start with a missing, placeholder or guessably short one.
  if (!value || value.startsWith("replace-with") || value.length < 32) {
    throw new Error(
      "SESSION_SECRET must be a random string of at least 32 characters (openssl rand -base64 48).",
    );
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
