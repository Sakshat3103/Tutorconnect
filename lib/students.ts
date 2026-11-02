import { getDb } from "./db";

export interface StudentProfile {
  userId: number;
  studentName: string;
  grade: number | null;
  subjects: string[];
  area: string;
  city: string;
  mode: string;
  budgetMax: number | null;
  preferredDays: string[];
  goals: string;
}

export function getStudentProfile(userId: number): StudentProfile | null {
  const r = getDb().prepare("SELECT * FROM student_profiles WHERE user_id = ?").get(userId) as Record<string, unknown> | undefined;
  if (!r) return null;
  return {
    userId,
    studentName: String(r.student_name ?? ""),
    grade: r.grade == null ? null : Number(r.grade),
    subjects: JSON.parse(String(r.subjects ?? "[]")),
    area: String(r.area ?? ""),
    city: String(r.city ?? ""),
    mode: String(r.mode ?? ""),
    budgetMax: r.budget_max == null ? null : Number(r.budget_max),
    preferredDays: JSON.parse(String(r.preferred_days ?? "[]")),
    goals: String(r.goals ?? ""),
  };
}

export function saveStudentProfile(p: StudentProfile) {
  getDb()
    .prepare(
      `INSERT INTO student_profiles (user_id, student_name, grade, subjects, area, city, mode, budget_max, preferred_days, goals, updated_at)
       VALUES (@userId, @studentName, @grade, @subjects, @area, @city, @mode, @budgetMax, @preferredDays, @goals, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET student_name=excluded.student_name, grade=excluded.grade, subjects=excluded.subjects,
         area=excluded.area, city=excluded.city, mode=excluded.mode, budget_max=excluded.budget_max,
         preferred_days=excluded.preferred_days, goals=excluded.goals, updated_at=excluded.updated_at`
    )
    .run({ ...p, subjects: JSON.stringify(p.subjects), preferredDays: JSON.stringify(p.preferredDays) });
}
