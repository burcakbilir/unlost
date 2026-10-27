import bcrypt from "bcryptjs";

const saltRounds = 10;

export function hashPassword(password: string) {
  return bcrypt.hash(password, saltRounds);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

// A real hash of a throwaway value, computed once. Comparing against it when the
// email is unknown makes that path take as long as a wrong password, so response
// time doesn't reveal which emails have accounts.
let dummyHash: Promise<string> | null = null;

export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= bcrypt.hash("unlost-timing-equalizer", saltRounds);
  await bcrypt.compare(password, await dummyHash);
}
