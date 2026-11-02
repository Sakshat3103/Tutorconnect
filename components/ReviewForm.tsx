"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";

/** FR13: rate & review a tutor (only after they've accepted one of your bookings). */
export default function ReviewForm({ teacherId, existing }: { teacherId: string; existing?: { rating: number; comment: string } }) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setMsg("Choose a star rating");
    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId, rating, comment }),
    });
    setLoading(false);
    setMsg(res.ok ? "Thanks! Your review is posted." : (await res.json()).error);
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
      <p className="text-sm font-semibold">{existing ? "Update your review" : "Rate this tutor"}</p>
      <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} aria-label={`${n} stars`}>
            <Star size={22} className={(hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
          </button>
        ))}
      </div>
      <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} className="input mt-3 resize-none"
        placeholder="What was it like learning with this tutor?" />
      <div className="mt-3 flex items-center gap-3">
        <button disabled={loading} className="btn-primary btn-sm">{loading && <Loader2 size={14} className="animate-spin" />}Post review</button>
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
      </div>
    </form>
  );
}
