import { NextResponse } from "next/server";
import { getDb, logActivity } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handler, bad } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// FR14: admin activates / deactivates a user account
export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const admin = await requireUser("admin");
  const id = Number((await ctx.params).id);
  if (id === admin.id) bad("You can't deactivate your own account");
  const active = (await req.json().catch(() => ({}))).active ? 1 : 0;
  const r = getDb().prepare("UPDATE users SET active = ? WHERE id = ? AND role != 'admin'").run(active, id);
  if (!r.changes) bad("User not found", 404);
  logActivity(admin.id, active ? "user_activated" : "user_deactivated", `user #${id}`);
  return NextResponse.json({ ok: true });
});
