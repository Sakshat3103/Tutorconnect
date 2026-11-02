import { NextResponse } from "next/server";
import { getDb, logActivity } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handler, bad } from "@/lib/api";
import { getTeacherByUser, getSlots } from "@/lib/teachers";
import { parseTeacherInput } from "@/lib/validate";

export const GET = handler(async () => {
  const user = await requireUser("teacher");
  const t = getTeacherByUser(user.id);
  return NextResponse.json({ teacher: t, slots: t ? getSlots(t.id) : [] });
});

// Teacher edits their own profile
export const PUT = handler(async (req: Request) => {
  const user = await requireUser("teacher");
  const t = getTeacherByUser(user.id);
  if (!t) bad("Create your profile first", 404);
  const v = parseTeacherInput(await req.json().catch(() => ({})));
  getDb().prepare(
    `UPDATE teachers SET name=?, photo=?, qualification=?, experience_years=?, subjects=?, class_min=?, class_max=?, area=?, city=?,
      teaching_modes=?, fee_min=?, fee_max=?, languages=?, bio=?, achievements=?, phone=?, whatsapp=? WHERE id=?`
  ).run(v.name, v.photo, v.qualification, v.experienceYears, JSON.stringify(v.subjects), v.classMin, v.classMax, v.area, v.city,
    JSON.stringify(v.teachingModes), v.feeMin, v.feeMax, JSON.stringify(v.languages), v.bio, JSON.stringify(v.achievements),
    v.phone, v.whatsapp || v.phone.replace(/\D/g, ""), t.id);
  logActivity(user.id, "teacher_profile_updated", t.id);
  return NextResponse.json({ ok: true });
});
