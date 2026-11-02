import { NextResponse } from "next/server";
import { getDb, logActivity } from "@/lib/db";
import { createSession, hashPassword, type Role } from "@/lib/auth";
import { handler, bad, str } from "@/lib/api";

// FR1: students, parents and teachers create accounts
export const POST = handler(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  const name = str(body.name, 80);
  const email = str(body.email, 120).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role as Role;
  const phone = str(body.phone, 20);

  if (!name) bad("Please enter your name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad("Please enter a valid email");
  if (password.length < 6) bad("Password must be at least 6 characters");
  if (!["student", "parent", "teacher"].includes(role)) bad("Choose student, parent or teacher");

  const db = getDb();
  if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) bad("An account with this email already exists", 409);

  const r = db
    .prepare("INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)")
    .run(name, email, await hashPassword(password), role, phone);
  const user = { id: Number(r.lastInsertRowid), name, email, role };
  logActivity(user.id, "signup", `${role} account created`);
  await createSession(user);
  return NextResponse.json({ user }, { status: 201 });
});
