import { BadgeCheck, GraduationCap, MapPin, Clock, Briefcase, BookOpen, Home } from "lucide-react";
import type { Teacher } from "@/lib/teachers";

/**
 * Compact badge row used on teacher cards.
 */
export function TrustBadgeRow({ teacher }: { teacher: Teacher }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {teacher.verified && (
        <span className="trust-badge bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <BadgeCheck size={12} /> Verified Teacher
        </span>
      )}
      {teacher.qualificationVerified && (
        <span className="trust-badge bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <GraduationCap size={12} /> Qualification Verified
        </span>
      )}
      <span className="trust-badge bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
        <Clock size={12} /> Responds within {teacher.responseTimeHours}h
      </span>
    </div>
  );
}

/**
 * Detailed trust panel used on the full profile page.
 */
export function TrustDetailsGrid({ teacher }: { teacher: Teacher }) {
  const items = [
    {
      icon: <MapPin size={16} className="text-primary" />,
      label: "Locality Served",
      value: `${teacher.area}, ${teacher.city}`,
    },
    {
      icon: <Clock size={16} className="text-primary" />,
      label: "Response Time",
      value: `Within ${teacher.responseTimeHours} hour${teacher.responseTimeHours > 1 ? "s" : ""}`,
    },
    {
      icon: <Briefcase size={16} className="text-primary" />,
      label: "Experience",
      value: `${teacher.experienceYears} years`,
    },
    {
      icon: <BookOpen size={16} className="text-primary" />,
      label: "Subjects Taught",
      value: `${teacher.subjects.length} subject${teacher.subjects.length > 1 ? "s" : ""}`,
    },
    {
      icon: <Home size={16} className="text-primary" />,
      label: "Teaching Mode",
      value: teacher.teachingModes.join(", "),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-slate-800">
            {item.icon}
          </span>
          <div className="min-w-0">
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className="truncate text-sm font-medium">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function VerifiedShield({ size = 14 }: { size?: number }) {
  return (
    <span
      title="Verified Teacher"
      className="flex items-center justify-center rounded-full bg-green-500 p-1 text-white shadow-sm"
    >
      <BadgeCheck size={size} />
    </span>
  );
}
