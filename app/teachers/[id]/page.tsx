import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Award,
  Languages,
  CalendarDays,
  GraduationCap,
} from "lucide-react";
import { TrustBadgeRow, TrustDetailsGrid, VerifiedShield } from "@/components/TrustBadges";
import Avatar from "@/components/Avatar";
import BookingWidget from "@/components/BookingWidget";
import ReviewForm from "@/components/ReviewForm";
import { getTeacher, getSlots, getReviews } from "@/lib/teachers";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const teacher = getTeacher(id);
  if (!teacher) return {};
  return {
    title: `${teacher.name} - ${teacher.subjects.join(", ")} Tutor in ${teacher.area}`,
    description: teacher.bio,
  };
}

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teacher = getTeacher(id);
  const user = await getCurrentUser();
  // Unverified profiles are only visible to their owner and admins (FR5)
  if (!teacher || (teacher.status !== "approved" && user?.role !== "admin" && user?.id !== teacher.userId)) notFound();

  const slots = getSlots(teacher.id);
  const reviews = getReviews(teacher.id);
  const db = getDb();
  const taken = (db
    .prepare("SELECT date || ' ' || start_time AS k FROM bookings WHERE teacher_id = ? AND status IN ('pending','accepted') AND date >= date('now')")
    .all(teacher.id) as { k: string }[]).map((r) => r.k);
  const isStudent = user?.role === "student" || user?.role === "parent";
  const canReview = isStudent && Boolean(db
    .prepare("SELECT 1 FROM bookings WHERE student_id = ? AND teacher_id = ? AND status IN ('accepted','completed')")
    .get(user!.id, teacher.id));
  const myReview = isStudent ? reviews.find((r) => r.studentId === user!.id) : undefined;

  return (
    <div className="section-container py-12">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="card p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl shadow-soft">
                {teacher.photo ? (
                  <Image src={teacher.photo} alt={teacher.name} fill unoptimized={teacher.photo.startsWith("data:")} className="object-cover" />
                ) : (
                  <Avatar name={teacher.name} size={112} />
                )}
                {teacher.verified && (
                  <div className="absolute -bottom-2 -right-2">
                    <VerifiedShield size={16} />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold">{teacher.name}</h1>
                  {teacher.status !== "approved" && (
                    <span className="status bg-amber-100 text-amber-700">{teacher.status === "pending" ? "Awaiting verification" : "Rejected"}</span>
                  )}
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <GraduationCap size={14} /> {teacher.qualification}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin size={14} /> {teacher.area}, {teacher.city}
                </p>
                <div className="mt-2 flex items-center gap-1 text-sm">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{teacher.reviewsCount ? teacher.rating : "New"}</span>
                  <span className="text-slate-400">({teacher.reviewsCount} review{teacher.reviewsCount === 1 ? "" : "s"})</span>
                </div>
                <div className="mt-3">
                  <TrustBadgeRow teacher={teacher} />
                </div>
              </div>
            </div>

            <hr className="my-6 border-slate-100 dark:border-slate-800" />

            <h2 className="mb-3 text-lg font-semibold">About</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {teacher.bio}
            </p>

            <h2 className="mb-3 mt-8 text-lg font-semibold">Trust &amp; Credentials</h2>
            <TrustDetailsGrid teacher={teacher} />

            <h2 className="mb-3 mt-8 text-lg font-semibold">Subjects &amp; Classes</h2>
            <div className="flex flex-wrap gap-2">
              {teacher.subjects.map((s) => (
                <span
                  key={s}
                  className="rounded-full bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary dark:bg-primary/10"
                >
                  {s}
                </span>
              ))}
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {teacher.classes}
              </span>
            </div>

            <h2 className="mb-3 mt-8 text-lg font-semibold">Languages</h2>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Languages size={16} className="text-primary" />
              {teacher.languages.join(", ")}
            </div>

            <h2 className="mb-3 mt-8 text-lg font-semibold">Weekly Availability</h2>
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <span
                  key={s.id}
                  className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  <CalendarDays size={12} /> {s.day} {s.startTime}–{s.endTime}
                </span>
              ))}
              {!slots.length && <span className="text-sm text-slate-400">No time slots added yet.</span>}
            </div>

            <h2 className="mb-3 mt-8 text-lg font-semibold">Achievements</h2>
            <ul className="space-y-2">
              {!teacher.achievements.length && <li className="text-sm text-slate-400">None listed yet.</li>}
              {teacher.achievements.map((a) => (
                <li key={a} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Award size={16} className="mt-0.5 shrink-0 text-primary" />
                  {a}
                </li>
              ))}
            </ul>

            <h2 id="reviews" className="mb-3 mt-8 text-lg font-semibold">Reviews</h2>
            {canReview && <div className="mb-4"><ReviewForm teacherId={teacher.id} existing={myReview} /></div>}
            {isStudent && !canReview && (
              <p className="mb-4 text-xs text-slate-400">You can review this tutor after they accept one of your bookings.</p>
            )}
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-slate-100 pb-4 last:border-0 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{r.studentName}</span>
                    <span className="flex">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={12} className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                      ))}
                    </span>
                    <span className="ml-auto text-xs text-slate-400">{new Date(r.createdAt + "Z").toLocaleDateString("en-IN")}</span>
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>}
                </div>
              ))}
              {!reviews.length && <p className="text-sm text-slate-400">No reviews yet.</p>}
            </div>
          </div>
        </div>

        {/* Sticky booking + contact card */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <div className="card p-6">
              <p className="text-xs text-slate-400">Fee Range</p>
              <p className="text-2xl font-bold text-primary">{teacher.feeRange}</p>

              <hr className="my-5 border-slate-100 dark:border-slate-800" />

              <p id="book" className="mb-3 scroll-mt-28 text-sm font-semibold">Book a class</p>
              <BookingWidget
                teacherId={teacher.id}
                teacherName={teacher.name}
                slots={slots}
                subjects={teacher.subjects}
                modes={teacher.teachingModes}
                taken={taken}
                role={user?.role ?? null}
              />

              <hr className="my-5 border-slate-100 dark:border-slate-800" />

              <p className="mb-3 text-sm font-semibold">Contact {teacher.name.split(" ")[0]}</p>
              <div className="flex flex-col gap-3">
                <a
                  href={`https://wa.me/${teacher.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full justify-center"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
                <a href={`tel:${teacher.phone}`} className="btn-secondary w-full justify-center">
                  <Phone size={16} /> Call Now
                </a>
                <a href={`mailto:${teacher.email}`} className="btn-secondary w-full justify-center">
                  <Mail size={16} /> Email
                </a>
              </div>

              <hr className="my-5 border-slate-100 dark:border-slate-800" />
              <p className="text-xs text-slate-400">
                🕒 Typically responds within{" "}
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {teacher.responseTimeHours} hour{teacher.responseTimeHours > 1 ? "s" : ""}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
