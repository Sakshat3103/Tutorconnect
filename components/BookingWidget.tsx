"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, Loader2, CheckCircle2 } from "lucide-react";
import type { Slot } from "@/lib/teachers";
import { cn } from "@/lib/utils";

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Next `count` dates (YYYY-MM-DD) that fall on the given weekday, starting tomorrow. */
function upcoming(day: string, count = 4) {
  const out: string[] = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  for (let i = 1; out.length < count && i < 70; i++) {
    const x = new Date(d.getTime() + i * 864e5);
    if (WD[x.getDay()] === day) out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`);
  }
  return out;
}

const pretty = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

/** FR10: send a booking request for a time slot on a specific date. */
export default function BookingWidget({
  teacherId, teacherName, slots, subjects, modes, taken, role,
}: {
  teacherId: string; teacherName: string; slots: Slot[]; subjects: string[]; modes: string[];
  taken: string[]; role: string | null;
}) {
  const router = useRouter();
  const [slotId, setSlotId] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [subject, setSubject] = useState(subjects[0] ?? "");
  const [mode, setMode] = useState(modes[0] ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const slot = slots.find((s) => s.id === slotId);
  const dates = useMemo(() => (slot ? upcoming(slot.day) : []), [slot]);
  const isTaken = (d: string) => Boolean(slot && taken.includes(`${d} ${slot.startTime}`));

  async function book() {
    setError("");
    if (!slot || !date) return setError("Pick a time slot and a date");
    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId, slotId, date, subject, mode, message }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto text-primary" size={36} />
        <p className="mt-3 font-semibold">Request sent!</p>
        <p className="mt-1 text-sm text-slate-500">{teacherName.split(" ")[0]} will accept or decline it. You can chat with them from your dashboard.</p>
        <Link href="/dashboard" className="btn-primary mt-4 w-full justify-center">Go to my bookings</Link>
      </div>
    );
  }

  if (!role) {
    return (
      <div>
        <p className="text-sm text-slate-500">Log in as a student or parent to book a class.</p>
        <Link href={`/login?next=/teachers/${teacherId}%23book`} className="btn-primary mt-3 w-full justify-center">Log in to book</Link>
        <Link href="/signup" className="mt-2 block text-center text-sm font-medium text-primary">Create a free account</Link>
      </div>
    );
  }
  if (role !== "student" && role !== "parent") {
    return <p className="text-sm text-slate-500">Only student and parent accounts can book classes.</p>;
  }
  if (!slots.length) return <p className="text-sm text-slate-500">This tutor hasn&apos;t added any time slots yet.</p>;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">1. Weekly slot</p>
        <div className="grid grid-cols-2 gap-2">
          {slots.map((s) => (
            <button key={s.id} type="button" onClick={() => { setSlotId(s.id); setDate(""); }}
              className={cn("rounded-xl border px-2 py-2 text-xs font-medium transition",
                slotId === s.id ? "border-primary bg-primary text-white" : "border-slate-200 hover:border-primary dark:border-slate-700")}>
              {s.day} {s.startTime}–{s.endTime}
            </button>
          ))}
        </div>
      </div>
      {slot && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">2. Date</p>
          <div className="grid grid-cols-2 gap-2">
            {dates.map((d) => (
              <button key={d} type="button" disabled={isTaken(d)} onClick={() => setDate(d)}
                className={cn("rounded-xl border px-2 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through",
                  date === d ? "border-primary bg-primary text-white" : "border-slate-200 hover:border-primary dark:border-slate-700")}>
                {pretty(d)}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="input px-3 text-xs" aria-label="Subject">
          {subjects.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={mode} onChange={(e) => setMode(e.target.value)} className="input px-3 text-xs" aria-label="Mode">
          {modes.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} className="input resize-none"
        placeholder="Message (optional): topics, exam date…" />
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}
      <button onClick={book} disabled={loading} className="btn-primary w-full justify-center">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <CalendarCheck size={16} />} Request booking
      </button>
    </div>
  );
}
