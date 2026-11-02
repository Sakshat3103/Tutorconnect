import { NextResponse } from "next/server";
import { getDb, logActivity } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handler, bad, str } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// FR5: admin approves / rejects a teacher profile
export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const admin = await requireUser("admin");
  const id = (await ctx.params).id;
  const status = str((await req.json().catch(() => ({}))).status, 20);
  if (!["approved", "rejected", "pending"].includes(status)) bad("Invalid status");
  const r = getDb()
    .prepare("UPDATE teachers SET status = ?, qualification_verified = ? WHERE id = ?")
    .run(status, status === "approved" ? 1 : 0, id);
  if (!r.changes) bad("Teacher not found", 404);
  logActivity(admin.id, `teacher_${status}`, id);
  return NextResponse.json({ ok: true });
});
