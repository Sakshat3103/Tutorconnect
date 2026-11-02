"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { SlidersHorizontal, X, Loader2 } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MODES = ["Home Tuition", "Online", "At Tutor's Place"];

/** FR7: the 8 required filters, kept in the URL so searches can be shared and bookmarked. */
export default function FilterPanel({ subjects }: { subjects: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const get = (k: string) => params.get(k) ?? "";

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`/teachers?${next.toString()}`, { scroll: false }));
  }

  const active = ["subject", "grade", "location", "day", "mode", "minExperience", "maxFee", "minRating", "q"].filter((k) => params.get(k)).length;

  const body = (
    <div className="space-y-5">
      <Group label="Search">
        <input
          defaultValue={get("q")}
          placeholder="Name, topic, exam…"
          className="input"
          onKeyDown={(e) => e.key === "Enter" && update("q", (e.target as HTMLInputElement).value)}
          onBlur={(e) => e.target.value !== get("q") && update("q", e.target.value)}
        />
      </Group>
      <Group label="Subject">
        <select value={get("subject")} onChange={(e) => update("subject", e.target.value)} className="input">
          <option value="">Any subject</option>
          {subjects.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Group>
      <Group label="Class">
        <select value={get("grade")} onChange={(e) => update("grade", e.target.value)} className="input">
          <option value="">Any class</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => <option key={g} value={g}>Class {g}</option>)}
        </select>
      </Group>
      <Group label="Location">
        <input
          defaultValue={get("location")}
          placeholder="Area or city"
          className="input"
          onKeyDown={(e) => e.key === "Enter" && update("location", (e.target as HTMLInputElement).value)}
          onBlur={(e) => e.target.value !== get("location") && update("location", e.target.value)}
        />
      </Group>
      <Group label="Available on">
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d) => (
            <button key={d} type="button" onClick={() => update("day", get("day") === d ? "" : d)}
              className={`chip ${get("day") === d ? "chip-active" : ""}`}>{d}</button>
          ))}
        </div>
      </Group>
      <Group label="Teaching mode">
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button key={m} type="button" onClick={() => update("mode", get("mode") === m ? "" : m)}
              className={`chip ${get("mode") === m ? "chip-active" : ""}`}>{m}</button>
          ))}
        </div>
      </Group>
      <Group label={`Experience: ${get("minExperience") || 0}+ years`}>
        <input type="range" min={0} max={15} step={1} defaultValue={get("minExperience") || 0}
          onMouseUp={(e) => update("minExperience", (e.target as HTMLInputElement).value === "0" ? "" : (e.target as HTMLInputElement).value)}
          onTouchEnd={(e) => update("minExperience", (e.target as HTMLInputElement).value === "0" ? "" : (e.target as HTMLInputElement).value)}
          onKeyUp={(e) => update("minExperience", (e.target as HTMLInputElement).value === "0" ? "" : (e.target as HTMLInputElement).value)}
          className="w-full accent-primary" />
      </Group>
      <Group label="Max fee per hour">
        <select value={get("maxFee")} onChange={(e) => update("maxFee", e.target.value)} className="input">
          <option value="">Any fee</option>
          {[500, 700, 1000, 1500, 2000].map((f) => <option key={f} value={f}>Up to ₹{f.toLocaleString("en-IN")}</option>)}
        </select>
      </Group>
      <Group label="Rating">
        <div className="flex flex-wrap gap-1.5">
          {["4.5", "4", "3"].map((r) => (
            <button key={r} type="button" onClick={() => update("minRating", get("minRating") === r ? "" : r)}
              className={`chip ${get("minRating") === r ? "chip-active" : ""}`}>{r}★ & up</button>
          ))}
        </div>
      </Group>
      {active > 0 && (
        <button type="button" onClick={() => startTransition(() => router.replace("/teachers"))} className="btn-secondary w-full justify-center">
          <X size={14} /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(!open)} className="btn-secondary mb-4 w-full justify-center lg:hidden">
        <SlidersHorizontal size={16} /> Filters {active > 0 && `(${active})`}
      </button>
      <aside className={`${open ? "block" : "hidden"} card relative p-5 lg:sticky lg:top-24 lg:block`}>
        {pending && <Loader2 size={16} className="absolute right-4 top-4 animate-spin text-primary" />}
        {body}
      </aside>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      {children}
    </div>
  );
}
