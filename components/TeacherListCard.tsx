import Link from "next/link";
import { Star, MapPin, BadgeCheck, Clock, IndianRupee, GraduationCap } from "lucide-react";
import Avatar from "./Avatar";
import type { Teacher } from "@/lib/teachers";

export default function TeacherListCard({ teacher: t, extra }: { teacher: Teacher; extra?: React.ReactNode }) {
  return (
    <Link href={`/teachers/${t.id}`} className="card-premium group flex flex-col gap-4 p-5 transition hover:shadow-premium sm:flex-row">
      <Avatar name={t.name} photo={t.photo} size={72} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold group-hover:text-primary">{t.name}</h3>
          {t.verified && <BadgeCheck size={18} className="text-primary" aria-label="Verified" />}
          {t.reviewsCount > 0 ? (
            <span className="ml-auto flex items-center gap-1 text-sm font-medium">
              <Star size={14} className="fill-amber-400 text-amber-400" /> {t.rating}
              <span className="text-slate-400">({t.reviewsCount})</span>
            </span>
          ) : (
            <span className="ml-auto text-xs text-slate-400">No reviews yet</span>
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t.qualification}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {t.subjects.map((s) => <span key={s} className="chip chip-active">{s}</span>)}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-4">
          <span className="flex items-center gap-1.5"><GraduationCap size={14} className="text-primary" />{t.classes}</span>
          <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" />{t.area}</span>
          <span className="flex items-center gap-1.5"><IndianRupee size={14} className="text-primary" />{t.feeRange.replace("₹", "")}</span>
          <span className="flex items-center gap-1.5"><Clock size={14} className="text-primary" />{t.experienceYears} yrs exp</span>
        </div>
        <p className="mt-2 text-xs text-slate-500">{t.teachingModes.join(" · ")} · Available {t.availableDays.join(", ") || "on request"}</p>
        {extra}
      </div>
    </Link>
  );
}
