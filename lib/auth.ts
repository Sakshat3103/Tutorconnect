import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getDb } from "./db";

export type Role = "student" | "parent" | "teacher" | "admin";
export type SessionUser = { id: number; name: string; email: string; role: Role };

export const SESSION_COOKIE = "tc_session";
const SESSION_DAYS = 7;

/** Secret used to sign login tokens: AUTH_SECRET env var, else a random one saved in data/.secret */
function getSecret(): Uint8Array {
  let secret = process.env.AUTH_SECRET;
  if (!secret) {
    const file = path.join(process.cwd(), "data", ".secret");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (!fs.existsSync(file)) fs.writeFileSync(file, crypto.randomBytes(32).toString("hex"));
    secret = fs.readFileSync(file, "utf8").trim();
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Returns the logged-in user, or null. Also checks the account is still active. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const row = getDb()
      .prepare("SELECT id, name, email, role, active FROM users WHERE id = ?")
      .get(Number(payload.sub)) as (SessionUser & { active: number }) | undefined;
    if (!row || !row.active) return null;
    return { id: row.id, name: row.name, email: row.email, role: row.role };
  } catch {
    return null;
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Use in API routes: throws 401/403 unless the user is logged in with one of the roles. */
export async function requireUser(...roles: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Please log in first");
  if (roles.length && !roles.includes(user.role)) throw new HttpError(403, "You don't have access to this");
  return user;
}
