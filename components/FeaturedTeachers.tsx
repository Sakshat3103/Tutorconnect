import Link from "next/link";
import { ArrowRight, UserPlus } from "lucide-react";
import { searchTeachers } from "@/lib/teachers";
import TeacherCard from "./TeacherCard";

export default function FeaturedTeachers() {
  // Top-rated approved teachers from the database (with a photo first)
  const teachers = searchTeachers({ sort: "rating" })
    .sort((a, b) => Number(Boolean(b.photo)) - Number(Boolean(a.photo)))
    .slice(0, 4);

  if (!teachers.length) {
    return (
      <section className="py-16">
        <div className="section-container">
          <div className="card mx-auto max-w-2xl p-8 text-center">
            <h2 className="text-2xl font-bold">Are you a tutor?</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              We&apos;re just getting started. Create your free profile and be one of the first tutors students find here.
            </p>
            <Link href="/register" className="btn-primary mt-5 inline-flex"><UserPlus size={16} /> Register as a tutor</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="featured-teachers" className="py-16">
      <div className="section-container">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Top-rated tutors</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Verified tutors with the best reviews.</p>
          </div>
          <Link href="/teachers" className="flex items-center gap-1 text-sm font-medium text-primary">
            View all teachers <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {teachers.map((teacher, i) => (
            <TeacherCard teacher={teacher} index={i} key={teacher.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
