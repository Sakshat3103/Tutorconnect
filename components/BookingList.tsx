"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MessageSquare, BookOpen, Star } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ChatThread from "./ChatThread";
import type { Booking } from "@/lib/bookings";

/** FR11: booking list. Tutors accept/reject/complete; students cancel; both can chat. */
export default function BookingList({ bookings, viewer, me }: { bookings: Booking[]; viewer: "student" | "teacher"; me: number }) {
  const router = useRouter();
  const [chat, setChat] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<{ id: number; msg: string } | null>(null);

  async function act(id: number, action: string) {
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
    });
    setBusy(null);
    if (!res.ok) setError({ id, msg: (await res.json()).error });
    router.refresh();
  }

  if (!bookings.length) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        {viewer === "student" ? <>No bookings yet. <Link href="/teachers" className="font-medium text-primary">Find a tutor</Link></> : "No booking requests yet."}
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {bookings.map((b) => (
        <div key={b.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {viewer === "student" ? (
                  <Link href={`/teachers/${b.teacherId}`} className="font-semibold hover:text-primary">{b.teacherName}</Link>
                ) : (
                  <span className="font-semibold">{b.studentName}</span>
                )}
                <StatusBadge status={b.status} />
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="flex items-center gap-1"><BookOpen size={13} />{b.subject} · {b.mode}</span>
                <span className="flex items-center gap-1"><Calendar size={13} />
                  {new Date(b.date + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1"><Clock size={13} />{b.startTime}–{b.endTime}</span>
              </div>
              {b.message && <p className="mt-1.5 text-sm italic text-slate-600 dark:text-slate-300">&ldquo;{b.message}&rdquo;</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {viewer === "teacher" && b.status === "pending" && (
                <>
                  <button disabled={busy === b.id} onClick={() => act(b.id, "accept")} className="btn-primary btn-sm">Accept</button>
                  <button disabled={busy === b.id} onClick={() => act(b.id, "reject")} className="btn-secondary btn-sm">Decline</button>
                </>
              )}
              {viewer === "teacher" && b.status === "accepted" && (
                <button disabled={busy === b.id} onClick={() => act(b.id, "complete")} className="btn-secondary btn-sm">Mark completed</button>
              )}
              {viewer === "student" && ["pending", "accepted"].includes(b.status) && (
                <button disabled={busy === b.id} onClick={() => act(b.id, "cancel")} className="btn-secondary btn-sm">Cancel</button>
              )}
              {viewer === "student" && ["accepted", "completed"].includes(b.status) && (
                <Link href={`/teachers/${b.teacherId}#reviews`} className="btn-secondary btn-sm"><Star size={14} />Review</Link>
              )}
              <button onClick={() => setChat(chat === b.id ? null : b.id)} className="btn-secondary btn-sm">
                <MessageSquare size={14} /> {chat === b.id ? "Hide chat" : `Chat${b.unread ? ` (${b.unread})` : ""}`}
              </button>
            </div>
          </div>
          {error?.id === b.id && <p className="mt-2 text-sm text-red-600">{error.msg}</p>}
          {chat === b.id && <ChatThread bookingId={b.id} me={me} />}
        </div>
      ))}
    </div>
  );
}
