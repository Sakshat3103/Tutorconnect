import { NextResponse } from "next/server";
import { handler, str, int, strArr } from "@/lib/api";
import { recommend, type Needs } from "@/lib/recommend";
import { llmSummary } from "@/lib/llm";
import { DAYS } from "@/lib/teachers";

// FR8 + FR15: POST the student's needs, get ranked tutors with match scores and reasons
export const POST = handler(async (req: Request) => {
  const b = await req.json().catch(() => ({}));
  const needs: Needs = {
    subjects: strArr(b.subjects),
    grade: b.grade ? int(b.grade) || null : null,
    area: str(b.area, 60),
    city: str(b.city, 60),
    mode: str(b.mode, 30),
    budgetMax: b.budgetMax ? int(b.budgetMax) || null : null,
    preferredDays: strArr(b.preferredDays).filter((d) => DAYS.includes(d)),
    goals: str(b.goals, 1000),
  };
  const results = recommend(needs);
  const summary = await llmSummary(needs, results);
  return NextResponse.json({ results, summary });
});
