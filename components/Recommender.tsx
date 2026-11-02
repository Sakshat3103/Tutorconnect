"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, Check, AlertCircle, Star, BadgeCheck } from "lucide-react";
import NeedsForm, { type NeedsState } from "./NeedsForm";
import Avatar from "./Avatar";
import type { Recommendation } from "@/lib/recommend";

export default function Recommender({ subjects, initial, loggedIn }: { subjects: string[]; initial: NeedsState; loggedIn: boolean }) {
  const [needs, setNeeds] = useState<NeedsState>(initial);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    const res = await fetch("/api/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(needs) });
    const data = await res.json();
    setResults(data.results ?? []);
    setSummary(data.summary ?? null);
    setLoading(false);
    setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
      <form onSubmit={run} className="card h-fit space-y-5 p-6 lg:sticky lg:top-24">
        <div>
          <h2 className="font-semibold">Tell us what you need</h2>
          <p className="text-sm text-slate-500">
            {loggedIn ? "Pre-filled from your profile. Change anything and run again." : "The more you fill in, the better the match."}
          </p>
        </div>
        <NeedsForm value={needs} onChange={setNeeds} subjects={subjects} />
        <button disabled={loading} className="btn-primary w-full justify-center">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Find my best tutors
        </button>
      </form>

      <div id="results" className="space-y-4">
        {results === null && (
          <div className="card flex flex-col items-center p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles /></div>
            <p className="mt-4 font-medium">Your matches will appear here</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Every tutor is scored out of 100 on subject, class, location, budget, availability, ratings, experience
              and your goals. <a href="#how-ai-works" className="font-medium text-primary">How it works</a>
            </p>
          </div>
        )}
        {summary && (
          <div className="card border-l-4 border-l-primary p-5 text-sm leading-relaxed">
            <p className="mb-1 flex items-center gap-1.5 font-semibold text-primary"><Sparkles size={14} /> AI summary</p>
            {summary}
          </div>
        )}
        {results?.length === 0 && (
          <div className="card p-10 text-center">
            <p className="font-medium">No tutors match yet.</p>
            <p className="mt-1 text-sm text-slate-500">No verified tutor teaches these subjects right now. Try other subjects, or check back soon.</p>
          </div>
        )}
        {results?.map((r, i) => (
          <div key={r.teacher.id} className="card p-5">
            <div className="flex gap-4">
              <Avatar name={r.teacher.name} photo={r.teacher.photo} size={64} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {i === 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">Best match</span>}
                  <Link href={`/teachers/${r.teacher.id}`} className="text-lg font-semibold hover:text-primary">{r.teacher.name}</Link>
                  {r.teacher.verified && <BadgeCheck size={16} className="text-primary" />}
                  {r.teacher.reviewsCount > 0 && (
                    <span className="flex items-center gap-1 text-sm"><Star size={13} className="fill-amber-400 text-amber-400" />{r.teacher.rating}</span>
                  )}
                </div>
                <p className="text-sm text-slate-500">{r.teacher.qualification} · {r.teacher.feeRange}</p>
              </div>
              <ScoreRing score={r.score} />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ul className="space-y-1.5 text-sm">
                {r.reasons.map((x) => <li key={x} className="flex gap-2"><Check size={15} className="mt-0.5 shrink-0 text-primary" />{x}</li>)}
                {r.caveats.map((x) => <li key={x} className="flex gap-2 text-slate-500"><AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-500" />{x}</li>)}
              </ul>
              <details className="text-sm">
                <summary className="cursor-pointer text-xs font-medium text-primary">How this score was calculated</summary>
                <div className="mt-2 space-y-1.5">
                {r.breakdown.map((b) => (
                  <div key={b.label} className="text-xs">
                    <div className="flex justify-between text-slate-500"><span>{b.label}</span><span>{Math.round(b.points)}/{b.max}</span></div>
                    <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(b.points / b.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
                </div>
              </details>
            </div>
            <div className="mt-4 flex gap-2">
              <Link href={`/teachers/${r.teacher.id}#book`} className="btn-primary">Book a class</Link>
              <Link href={`/teachers/${r.teacher.id}`} className="btn-secondary">View profile</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <div className="relative h-14 w-14 shrink-0" title="Match score">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} className="fill-none stroke-slate-100 dark:stroke-slate-800" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} className="fill-none stroke-primary" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center text-sm font-bold leading-none">
        {score}<span className="text-[9px] font-medium text-slate-400">match</span>
      </span>
    </div>
  );
}
