import { Suspense } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import FilterPanel from "@/components/FilterPanel";
import TeacherListCard from "@/components/TeacherListCard";
import SortSelect from "@/components/SortSelect";
import { searchTeachers, allSubjects, type TeacherFilters } from "@/lib/teachers";
import { subjectsList } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Find Tutors | TutorConnect" };

type SP = Promise<Record<string, string | undefined>>;

export default async function TeachersPage({ searchParams }: { searchParams: SP }) {
  const p = await searchParams;
  const num = (v?: string) => (v ? Number(v) || undefined : undefined);
  const teachers = searchTeachers({
    q: p.q, subject: p.subject, grade: num(p.grade), location: p.location ?? p.area, day: p.day, mode: p.mode,
    minExperience: num(p.minExperience), maxFee: num(p.maxFee), minRating: num(p.minRating),
    sort: p.sort as TeacherFilters["sort"],
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Find a tutor</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Filter verified tutors by what matters to you.</p>
        </div>
        <Link href="/recommend" className="btn-primary"><Sparkles size={16} /> Get AI recommendations</Link>
      </div>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <Suspense><FilterPanel subjects={allSubjects().length ? allSubjects() : subjectsList} /></Suspense>
        <div>
          <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
            <span>{teachers.length} tutor{teachers.length === 1 ? "" : "s"} found</span>
            <Suspense><SortSelect /></Suspense>
          </div>
          <div className="space-y-4">
            {teachers.map((t) => <TeacherListCard key={t.id} teacher={t} />)}
            {!teachers.length && (
              <div className="card p-10 text-center">
                {Object.values(p).some(Boolean) ? (
                  <>
                    <p className="font-medium">No tutors match all these filters.</p>
                    <p className="mt-1 text-sm text-slate-500">Try removing a filter, or let the AI suggest the closest matches.</p>
                    <Link href="/recommend" className="btn-secondary mt-4 inline-flex">Try AI match</Link>
                  </>
                ) : (
                  <>
                    <p className="font-medium">No tutors have joined yet.</p>
                    <p className="mt-1 text-sm text-slate-500">Verified tutors will appear here as they sign up.</p>
                    <Link href="/register" className="btn-secondary mt-4 inline-flex">Register as a tutor</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
