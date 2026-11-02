import { NextResponse } from "next/server";
import { getDb, logActivity } from "@/lib/db";
import { createSession, verifyPassword, type Role } from "@/lib/auth";
import { handler, bad, str } from "@/lib/api";

// FR2: log in
export const POST = handler(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const email = str(body.email, 120).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const row = getDb()
    .prepare("SELECT id, name, email, role, password_hash, active FROM users WHERE email = ?")
    .get(email) as { id: number; name: string; email: string; role: Role; password_hash: string; active: number } | undefined;
  if (!row || !(await verifyPassword(password, row.password_hash))) bad("Incorrect email or password", 401);
  if (!row.active) bad("This account has been deactivated by an administrator", 403);
  const user = { id: row.id, name: row.name, email: row.email, role: row.role };
  await createSession(user);
  logActivity(user.id, "login");
  return NextResponse.json({ user });
});
