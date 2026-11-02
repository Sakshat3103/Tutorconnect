import { NextResponse } from "next/server";
import { getDb, logActivity } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handler, bad } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// Admin hides / restores an inappropriate review
export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const admin = await requireUser("admin");
  const id = Number((await ctx.params).id);
  const hidden = (await req.json().catch(() => ({}))).hidden ? 1 : 0;
  const r = getDb().prepare("UPDATE reviews SET hidden = ? WHERE id = ?").run(hidden, id);
  if (!r.changes) bad("Review not found", 404);
  logActivity(admin.id, hidden ? "review_hidden" : "review_restored", `review #${id}`);
  return NextResponse.json({ ok: true });
});
