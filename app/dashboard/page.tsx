import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, CalendarClock, Inbox, Star, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getTeacherByUser, getSlots } from "@/lib/teachers";
import { bookingsForStudent, bookingsForTeacher, todayISO } from "@/lib/bookings";
import { getStudentProfile } from "@/lib/students";
import { recommend } from "@/lib/recommend";
import { subjectsList } from "@/lib/data";
import BookingList from "@/components/BookingList";
import StudentProfileForm from "@/components/StudentProfileForm";
import SlotManager from "@/components/SlotManager";
import TeacherProfileEditor from "@/components/TeacherProfileEditor";
import TeacherListCard from "@/components/TeacherListCard";
import Avatar from "@/components/Avatar";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

function Panel({ title, children, action, id }: { title: string; children: React.ReactNode; action?: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="card scroll-mt-24 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={18} /></span>
      <div>
        <p className="text-xl font-bold leading-tight">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");
  if (user.role === "admin") redirect("/admin");
  const today = todayISO();

  if (user.role === "teacher") {
    const teacher = getTeacherByUser(user.id);
    if (!teacher) {
      return (
        <div className="section-container max-w-xl py-20 text-center">
          <h1 className="text-2xl font-bold">Welcome, {user.name.split(" ")[0]}!</h1>
          <p className="mt-3 text-slate-500">Finish your teacher profile so students can find and book you.</p>
          <Link href="/register" className="btn-primary mt-6 inline-flex">Complete my profile</Link>
        </div>
      );
    }
    const bookings = bookingsForTeacher(teacher.id);
    const pending = bookings.filter((b) => b.status === "pending").length;
    const upcoming = bookings.filter((b) => b.status === "accepted" && b.date >= today).length;

    return (
      <div className="section-container space-y-6 py-10">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={teacher.name} photo={teacher.photo} size={56} />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Hi, {teacher.name.split(" ")[0]}</h1>
            <p className="text-sm text-slate-500">Teacher dashboard</p>
          </div>
          <Link href={`/teachers/${teacher.id}`} className="btn-secondary btn-sm"><ExternalLink size={14} /> View public profile</Link>
        </div>

        {teacher.status !== "approved" && (
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertTriangle size={18} className="shrink-0" />
            {teacher.status === "pending"
              ? "Your profile is waiting for admin verification. It will appear in search and accept bookings once approved."
              : "Your profile was not approved. Please update your details and contact support."}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat icon={Inbox} label="New requests" value={pending} />
          <Stat icon={CalendarClock} label="Upcoming classes" value={upcoming} />
          <Stat icon={Star} label={`${teacher.reviewsCount} reviews`} value={teacher.reviewsCount ? `${teacher.rating}★` : "—"} />
          <Stat icon={Clock} label="Profile status" value={<StatusBadge status={teacher.status} />} />
        </div>

        <Panel title="Booking requests"><BookingList bookings={bookings} viewer="teacher" me={user.id} /></Panel>
        <Panel title="Weekly availability"><SlotManager initial={getSlots(teacher.id)} /></Panel>
        <Panel title="My profile"><TeacherProfileEditor teacher={teacher} subjects={subjectsList} /></Panel>
      </div>
    );
  }

  // Student / parent
  const profile = getStudentProfile(user.id);
  const bookings = bookingsForStudent(user.id);
  const picks = profile && profile.subjects.length
    ? recommend(profile, 3)
    : [];
  const initial = {
    studentName: profile?.studentName ?? (user.role === "student" ? user.name : ""),
    grade: profile?.grade ? String(profile.grade) : "",
    subjects: profile?.subjects ?? [],
    area: profile?.area ?? "",
    city: profile?.city ?? "",
    mode: profile?.mode ?? "",
    budgetMax: profile?.budgetMax ? String(profile.budgetMax) : "",
    preferredDays: profile?.preferredDays ?? [],
    goals: profile?.goals ?? "",
  };

  return (
    <div className="section-container space-y-6 py-10">
      <div>
        <h1 className="text-2xl font-bold">Hi, {user.name.split(" ")[0]}</h1>
        <p className="text-sm text-slate-500">{user.role === "parent" ? "Parent" : "Student"} dashboard</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat icon={Inbox} label="Awaiting reply" value={bookings.filter((b) => b.status === "pending").length} />
        <Stat icon={CalendarClock} label="Upcoming classes" value={bookings.filter((b) => b.status === "accepted" && b.date >= today).length} />
        <Stat icon={Star} label="Completed classes" value={bookings.filter((b) => b.status === "completed").length} />
      </div>

      <Panel title="My bookings"><BookingList bookings={bookings} viewer="student" me={user.id} /></Panel>

      <Panel title="AI picks for you" action={<Link href="/recommend" className="flex items-center gap-1 text-sm font-medium text-primary"><Sparkles size={14} /> Full AI match</Link>}>
        {picks.length ? (
          <div className="space-y-3">
            {picks.map((p) => (
              <TeacherListCard key={p.teacher.id} teacher={p.teacher}
                extra={<p className="mt-2 text-xs font-medium text-primary">{p.score}% match · {p.reasons.slice(0, 2).join(" · ")}</p>} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Save your learning needs below (at least one subject) to get personalised tutor recommendations.</p>
        )}
      </Panel>

      <Panel id="profile" title="Learning needs & preferences">
        <StudentProfileForm initial={initial} subjects={subjectsList} isParent={user.role === "parent"} />
      </Panel>
    </div>
  );
}
