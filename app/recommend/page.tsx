import { Sparkles } from "lucide-react";
import Recommender from "@/components/Recommender";
import { AiExplainerFull } from "@/components/AiExplainer";
import { getCurrentUser } from "@/lib/auth";
import { getStudentProfile } from "@/lib/students";
import { subjectsList } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "AI Tutor Match | TutorConnect" };

export default async function RecommendPage() {
  const user = await getCurrentUser();
  const p = user && (user.role === "student" || user.role === "parent") ? getStudentProfile(user.id) : null;
  const initial = {
    grade: p?.grade ? String(p.grade) : "",
    subjects: p?.subjects ?? [],
    area: p?.area ?? "",
    city: p?.city ?? "Bengaluru",
    mode: p?.mode ?? "",
    budgetMax: p?.budgetMax ? String(p.budgetMax) : "",
    preferredDays: p?.preferredDays ?? [],
    goals: p?.goals ?? "",
  };
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles size={13} /> AI tutor match
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Find the tutors that fit you best</h1>
        <p className="mt-1 max-w-2xl text-slate-500 dark:text-slate-400">
          Describe what you need and we&apos;ll rank every verified tutor with a match score out of 100 and the reasons behind it.
          {" "}<a href="#how-ai-works" className="font-medium text-primary">How does it work?</a>
        </p>
      </div>
      <Recommender subjects={subjectsList} initial={initial} loggedIn={Boolean(p)} />
      <AiExplainerFull />
    </div>
  );
}
