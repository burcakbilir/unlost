// Checked once when Next loads next.config.ts (dev server start, build, typegen),
// so a missing or malformed variable fails the deploy instead of the first
// request that happens to need it. Plain checks, no imports: next.config.ts
// loads this before the app's module aliases exist.

type Check = { name: string; required: boolean; valid: (value: string) => boolean; hint: string };

function isUrl(value: string, protocols: string[]): boolean {
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const checks: Check[] = [
  {
    name: "DATABASE_URL",
    required: true,
    valid: (value) => isUrl(value, ["postgres:", "postgresql:"]),
    hint: "a postgresql:// connection string",
  },
  {
    name: "DIRECT_URL",
    required: false,
    valid: (value) => isUrl(value, ["postgres:", "postgresql:"]),
    hint: "the unpooled postgresql:// connection string, used by migrations",
  },
  {
    name: "SESSION_SECRET",
    required: true,
    valid: (value) => value.length >= 32 && !value.startsWith("replace-with"),
    hint: "at least 32 random characters (openssl rand -base64 48)",
  },
  {
    name: "ENCRYPTION_KEY",
    required: true,
    valid: (value) => Buffer.from(value, "base64").length === 32,
    hint: "32 random bytes, base64-encoded (openssl rand -base64 32)",
  },
  {
    name: "APP_URL",
    required: false,
    valid: (value) => isUrl(value, ["http:", "https:"]),
    hint: "the site's public URL, e.g. https://unlost.vercel.app",
  },
];

// Reports names only, never values: the error ends up in build logs.
export function assertValidEnv(env: Record<string, string | undefined> = process.env): void {
  const problems = checks.flatMap(({ name, required, valid, hint }) => {
    const value = env[name];
    if (!value) return required ? [`${name} is missing — expected ${hint}`] : [];
    return valid(value) ? [] : [`${name} is invalid — expected ${hint}`];
  });

  if (problems.length > 0) {
    throw new Error(`Environment check failed:\n- ${problems.join("\n- ")}`);
  }
}
