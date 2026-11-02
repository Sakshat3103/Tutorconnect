import { NextResponse } from "next/server";
import { getDb, logActivity } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handler, bad } from "@/lib/api";
import { parseTeacherInput } from "@/lib/validate";
import { searchTeachers, getTeacherByUser, slugify, syncAvailableDays, type TeacherFilters } from "@/lib/teachers";

// FR6 + FR7: GET /api/teachers?subject=&grade=&location=&day=&mode=&minExperience=&maxFee=&minRating=&q=&sort=
export const GET = handler(async (req: Request) => {
  const p = new URL(req.url).searchParams;
  const num = (k: string) => (p.get(k) ? Number(p.get(k)) || undefined : undefined);
  const filters: TeacherFilters = {
    q: p.get("q") || undefined,
    subject: p.get("subject") || undefined,
    grade: num("grade"),
    location: p.get("location") || undefined,
    day: p.get("day") || undefined,
    mode: p.get("mode") || undefined,
    minExperience: num("minExperience"),
    maxFee: num("maxFee"),
    minRating: num("minRating"),
    sort: (p.get("sort") as TeacherFilters["sort"]) || undefined,
  };
  return NextResponse.json({ teachers: searchTeachers(filters) });
});

// FR4: a logged-in teacher creates their profile (status = pending until admin verifies — FR5)
export const POST = handler(async (req: Request) => {
  const user = await requireUser("teacher");
  if (getTeacherByUser(user.id)) bad("You already have a profile. Edit it from your dashboard.", 409);
  const v = parseTeacherInput(await req.json().catch(() => ({})));
  const id = slugify(v.name);
  const db = getDb();
  db.transaction(() => {
    db.prepare(
      `INSERT INTO teachers (id, user_id, name, photo, qualification, experience_years, subjects, class_min, class_max, area, city,
        teaching_modes, fee_min, fee_max, languages, bio, achievements, phone, whatsapp, email, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).run(id, user.id, v.name, v.photo, v.qualification, v.experienceYears, JSON.stringify(v.subjects), v.classMin, v.classMax,
      v.area, v.city, JSON.stringify(v.teachingModes), v.feeMin, v.feeMax, JSON.stringify(v.languages), v.bio,
      JSON.stringify(v.achievements), v.phone, v.whatsapp || v.phone.replace(/\D/g, ""), user.email);
    const ins = db.prepare("INSERT OR IGNORE INTO slots (teacher_id, day, start_time, end_time) VALUES (?, ?, ?, ?)");
    for (const s of v.slots) ins.run(id, s.day, s.start, s.end);
  })();
  syncAvailableDays(id);
  logActivity(user.id, "teacher_profile_created", id);
  return NextResponse.json({ id }, { status: 201 });
});
