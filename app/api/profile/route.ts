import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handler, bad, str, int, strArr } from "@/lib/api";
import { getStudentProfile, saveStudentProfile } from "@/lib/students";
import { DAYS } from "@/lib/teachers";

// FR3: student/parent learning requirements
export const GET = handler(async () => {
  const user = await requireUser("student", "parent");
  return NextResponse.json({ profile: getStudentProfile(user.id) });
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser("student", "parent");
  const b = await req.json().catch(() => ({}));
  const grade = b.grade === "" || b.grade == null ? null : int(b.grade);
  if (grade !== null && !(grade >= 1 && grade <= 12)) bad("Class must be between 1 and 12");
  const budget = b.budgetMax === "" || b.budgetMax == null ? null : int(b.budgetMax);
  if (budget !== null && !(budget > 0)) bad("Budget must be a positive number");
  const profile = {
    userId: user.id,
    studentName: str(b.studentName, 80),
    grade,
    subjects: strArr(b.subjects),
    area: str(b.area, 60),
    city: str(b.city, 60),
    mode: str(b.mode, 30),
    budgetMax: budget,
    preferredDays: strArr(b.preferredDays).filter((d) => DAYS.includes(d)),
    goals: str(b.goals, 1000),
  };
  saveStudentProfile(profile);
  return NextResponse.json({ profile });
});
