"use client";

import { cn } from "@/lib/utils";
import { Field } from "./AuthForm";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const MODES = ["Home Tuition", "Online", "At Tutor's Place"];

export type NeedsState = {
  studentName?: string;
  grade: string;
  subjects: string[];
  area: string;
  city: string;
  mode: string;
  budgetMax: string;
  preferredDays: string[];
  goals: string;
};

/** Shared form for a student's learning needs (used by the AI match page and the student profile — FR3). */
export default function NeedsForm({
  value, onChange, subjects, showName,
}: { value: NeedsState; onChange: (v: NeedsState) => void; subjects: string[]; showName?: boolean }) {
  const set = <K extends keyof NeedsState>(k: K, v: NeedsState[K]) => onChange({ ...value, [k]: v });
  const toggle = (k: "subjects" | "preferredDays", item: string) =>
    set(k, value[k].includes(item) ? value[k].filter((x) => x !== item) : [...value[k], item]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showName && (
        <Field label="Student's name" className="sm:col-span-2">
          <input value={value.studentName ?? ""} onChange={(e) => set("studentName", e.target.value)} className="input" />
        </Field>
      )}
      <Field label="Subjects needed" className="sm:col-span-2">
        <div className="flex flex-wrap gap-1.5">
          {subjects.map((s) => (
            <button type="button" key={s} onClick={() => toggle("subjects", s)} className={cn("chip", value.subjects.includes(s) && "chip-active")}>{s}</button>
          ))}
        </div>
      </Field>
      <Field label="Class">
        <select value={value.grade} onChange={(e) => set("grade", e.target.value)} className="input">
          <option value="">Select class</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => <option key={g} value={g}>Class {g}</option>)}
        </select>
      </Field>
      <Field label="Preferred mode">
        <select value={value.mode} onChange={(e) => set("mode", e.target.value)} className="input">
          <option value="">No preference</option>
          {MODES.map((m) => <option key={m}>{m}</option>)}
        </select>
      </Field>
      <Field label="Area"><input value={value.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Koramangala" className="input" /></Field>
      <Field label="City"><input value={value.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Bengaluru" className="input" /></Field>
      <Field label="Budget per hour (₹)">
        <input type="number" min={0} step={50} value={value.budgetMax} onChange={(e) => set("budgetMax", e.target.value)} placeholder="e.g. 1000" className="input" />
      </Field>
      <Field label="Days that suit you">
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d) => (
            <button type="button" key={d} onClick={() => toggle("preferredDays", d)} className={cn("chip", value.preferredDays.includes(d) && "chip-active")}>{d}</button>
          ))}
        </div>
      </Field>
      <Field label="What do you need help with?" className="sm:col-span-2">
        <textarea rows={3} value={value.goals} onChange={(e) => set("goals", e.target.value)} className="input"
          placeholder="e.g. Preparing for JEE, weak in mechanics numericals, need weekly tests" />
      </Field>
    </div>
  );
}
