"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, MapPin, Briefcase, CalendarCheck } from "lucide-react";
import type { Teacher } from "@/lib/teachers";
import Avatar from "./Avatar";
import { TrustBadgeRow, VerifiedShield } from "./TrustBadges";

export default function TeacherCard({ teacher, index = 0 }: { teacher: Teacher; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="card-premium flex flex-col overflow-hidden"
    >
      <div className="relative">
        <div className="relative h-44 w-full overflow-hidden">
          {teacher.photo ? (
            <Image
              src={teacher.photo}
              alt={teacher.name}
              fill
              unoptimized={teacher.photo.startsWith("data:")}
              className="object-cover transition-transform duration-500 hover:scale-105"
              sizes="(max-width: 768px) 100vw, 300px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20">
              <Avatar name={teacher.name} size={88} className="rounded-full" />
            </div>
          )}
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-soft">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          {teacher.reviewsCount ? teacher.rating : "New"}
          {teacher.reviewsCount > 0 && <span className="font-normal text-slate-400">({teacher.reviewsCount})</span>}
        </div>
        {teacher.verified && (
          <div className="absolute left-3 top-3">
            <VerifiedShield />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-base font-semibold">{teacher.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{teacher.qualification}</p>
        </div>

        <TrustBadgeRow teacher={teacher} />

        <div className="flex flex-wrap gap-1.5">
          {teacher.subjects.map((s) => (
            <span
              key={s}
              className="rounded-full bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary dark:bg-primary/10"
            >
              {s}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {teacher.area}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase size={12} /> {teacher.experienceYears} yrs
          </span>
        </div>

        <p className="text-xs text-slate-400">{teacher.teachingModes.join(" • ")}</p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {teacher.feeRange}
          </span>
          <div className="flex gap-2">
            <Link
              href={`/teachers/${teacher.id}`}
              className="rounded-full border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
            >
              View Profile
            </Link>
            <Link
              href={`/teachers/${teacher.id}#book`}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
            >
              <CalendarCheck size={12} /> Book
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
