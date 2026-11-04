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

export type SessionPayload = {
  userId: string;
  // The user's sessionVersion when the token was issued. Tokens from before
  // this field existed have none and count as version 0.
  sessionVersion: number;
};

const algorithm = "HS256";

export function createSessionToken(userId: string, sessionVersion: number) {
  return jwt.sign({ userId, v: sessionVersion }, sessionSecret, {
    algorithm,
    expiresIn: sessionMaxAgeSeconds,
  });
}

// Checks the signature and expiry only. Whether the token was revoked by a
// sign-out needs the database; getRequestUser does that part.
export function verifySessionToken(token?: string): SessionPayload | null {
  if (!token) {
    return null;
  }

  try {
    // Pinning the algorithm means a token can't pick a weaker one for itself.
    const payload = jwt.verify(token, sessionSecret, { algorithms: [algorithm] });

    if (typeof payload !== "object" || typeof payload.userId !== "string") {
      return null;
    }

    return {
      userId: payload.userId,
      sessionVersion: typeof payload.v === "number" ? payload.v : 0,
    };
  } catch {
    return null;
  }
}
