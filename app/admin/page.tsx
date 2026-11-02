import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, GraduationCap, CalendarCheck, Star, ShieldAlert, Activity, MapPin } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { searchTeachers, getSlots } from "@/lib/teachers";
import { recentBookings } from "@/lib/bookings";
import AdminButton from "@/components/AdminButton";
import StatusBadge from "@/components/StatusBadge";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

type Row = Record<string, string | number>;

function Panel({ title, children, count }: { title: string; children: React.ReactNode; count?: number }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        {title}
        {count !== undefined && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

const fmt = (d: string) => new Date(d + "Z").toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** FR5 + FR14: verify teachers, manage users, moderate reviews and monitor platform activity. */
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/dashboard");

  const db = getDb();
  const count = (sql: string) => (db.prepare(sql).get() as { c: number }).c;
  const teachers = searchTeachers({ includeUnapproved: true, sort: "newest" });
  const pending = teachers.filter((t) => t.status === "pending");
  const users = db.prepare("SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at DESC, id DESC").all() as Row[];
  const reviews = db.prepare(
    `SELECT r.id, r.rating, r.comment, r.hidden, r.created_at, u.name AS student, t.name AS teacher, t.id AS teacher_id
     FROM reviews r JOIN users u ON u.id = r.student_id JOIN teachers t ON t.id = r.teacher_id
     ORDER BY r.hidden DESC, r.rating ASC, r.created_at DESC LIMIT 30`
  ).all() as Row[];
  const activity = db.prepare(
    `SELECT a.action, a.detail, a.created_at, u.name FROM activity a LEFT JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC, a.id DESC LIMIT 15`
  ).all() as Row[];
  const bookings = recentBookings(10);

  const stats = [
    { icon: Users, label: "Students & parents", value: count("SELECT COUNT(*) c FROM users WHERE role IN ('student','parent')") },
    { icon: GraduationCap, label: "Verified teachers", value: count("SELECT COUNT(*) c FROM teachers WHERE status='approved'") },
    { icon: ShieldAlert, label: "Awaiting verification", value: pending.length },
    { icon: CalendarCheck, label: "Bookings", value: count("SELECT COUNT(*) c FROM bookings") },
    { icon: Star, label: "Reviews", value: count("SELECT COUNT(*) c FROM reviews") },
  ];

  return (
    <div className="section-container space-y-6 py-10">
      <div>
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <p className="text-sm text-slate-500">Verify teachers, manage users and monitor platform activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><s.icon size={18} /></span>
            <div>
              <p className="text-xl font-bold leading-tight">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Panel title="Teacher verification" count={pending.length}>
        {!pending.length && <p className="text-sm text-slate-500">No teachers waiting for verification.</p>}
        <div className="space-y-4">
          {pending.map((t) => (
            <div key={t.id} className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <Avatar name={t.name} photo={t.photo} size={52} />
              <div className="min-w-0 flex-1 text-sm">
                <Link href={`/teachers/${t.id}`} className="font-semibold hover:text-primary">{t.name}</Link>
                <p className="text-slate-500">{t.qualification} · {t.experienceYears} yrs · {t.classes}</p>
                <p className="text-slate-500">{t.subjects.join(", ")} · {t.teachingModes.join(", ")} · {t.feeRange}</p>
                <p className="flex items-center gap-1 text-slate-500"><MapPin size={12} />{t.area}, {t.city} · {t.email} · {t.phone}</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{t.bio}</p>
                <p className="mt-1 text-xs text-slate-400">{getSlots(t.id).length} time slots · registered {fmt(t.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <AdminButton url={`/api/admin/teachers/${t.id}`} body={{ status: "approved" }} label="Approve" variant="primary" />
                <AdminButton url={`/api/admin/teachers/${t.id}`} body={{ status: "rejected" }} label="Reject" variant="danger" />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="All teachers" count={teachers.length}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr><th className="py-2">Teacher</th><th>Subjects</th><th>City</th><th>Rating</th><th>Status</th><th className="text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td className="py-2.5"><Link href={`/teachers/${t.id}`} className="font-medium hover:text-primary">{t.name}</Link></td>
                  <td className="text-slate-500">{t.subjects.join(", ")}</td>
                  <td className="text-slate-500">{t.city}</td>
                  <td>{t.reviewsCount ? `${t.rating}★ (${t.reviewsCount})` : "—"}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="text-right">
                    {t.status === "approved"
                      ? <AdminButton url={`/api/admin/teachers/${t.id}`} body={{ status: "rejected" }} label="Suspend" variant="danger" />
                      : <AdminButton url={`/api/admin/teachers/${t.id}`} body={{ status: "approved" }} label="Approve" variant="primary" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Users" count={users.length}>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="capitalize text-slate-500">{u.role}</td>
                    <td className="text-right">
                      {u.role === "admin" ? <span className="text-xs text-slate-400">—</span>
                        : u.active ? <AdminButton url={`/api/admin/users/${u.id}`} body={{ active: false }} label="Deactivate" variant="danger" />
                        : <AdminButton url={`/api/admin/users/${u.id}`} body={{ active: true }} label="Activate" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Review moderation" count={reviews.length}>
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {reviews.map((r) => (
              <div key={r.id} className={`flex gap-3 rounded-xl border border-slate-100 p-3 text-sm dark:border-slate-800 ${r.hidden ? "opacity-60" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p><span className="font-medium">{r.student}</span> → <Link href={`/teachers/${r.teacher_id}`} className="font-medium hover:text-primary">{r.teacher}</Link> · {r.rating}★ {r.hidden ? <span className="text-xs text-red-600">(hidden)</span> : null}</p>
                  {r.comment && <p className="mt-0.5 text-slate-500">{r.comment}</p>}
                </div>
                <AdminButton url={`/api/admin/reviews/${r.id}`} body={{ hidden: !r.hidden }} label={r.hidden ? "Restore" : "Hide"} variant={r.hidden ? "secondary" : "danger"} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent bookings">
          {!bookings.length && <p className="text-sm text-slate-500">No bookings yet.</p>}
          <div className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center gap-2 py-2.5">
                <div className="min-w-0 flex-1">
                  <p><span className="font-medium">{b.studentName}</span> → {b.teacherName}</p>
                  <p className="text-xs text-slate-500">{b.subject} · {b.date} {b.startTime}</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Activity log">
          {!activity.length && <p className="text-sm text-slate-500">No activity yet.</p>}
          <ul className="space-y-2 text-sm">
            {activity.map((a, i) => (
              <li key={i} className="flex gap-2">
                <Activity size={14} className="mt-0.5 shrink-0 text-primary" />
                <span className="flex-1"><span className="font-medium">{a.name ?? "System"}</span> · {String(a.action).replace(/_/g, " ")} {a.detail ? <span className="text-slate-500">({a.detail})</span> : null}</span>
                <span className="shrink-0 text-xs text-slate-400">{fmt(String(a.created_at))}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
