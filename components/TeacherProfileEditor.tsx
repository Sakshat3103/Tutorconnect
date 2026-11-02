"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import type { Teacher } from "@/lib/teachers";
import { cn } from "@/lib/utils";
import { Field } from "./AuthForm";

const MODES = ["Home Tuition", "Online", "At Tutor's Place"];

/** FR4: tutors manage their own profile after registering. */
export default function TeacherProfileEditor({ teacher, subjects }: { teacher: Teacher; subjects: string[] }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: teacher.name, phone: teacher.phone, qualification: teacher.qualification,
    experienceYears: String(teacher.experienceYears), subjects: teacher.subjects,
    classMin: String(teacher.classMin), classMax: String(teacher.classMax), area: teacher.area, city: teacher.city,
    teachingModes: teacher.teachingModes as string[], feeMin: String(teacher.feeMin), feeMax: String(teacher.feeMax),
    languages: teacher.languages.join(", "), bio: teacher.bio, achievements: teacher.achievements.join("\n"),
  });
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });
  const toggle = (k: "subjects" | "teachingModes", v: string) =>
    setF({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    setError("");
    const res = await fetch("/api/teachers/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...f, photo: teacher.photo, whatsapp: teacher.whatsapp,
        experienceYears: Number(f.experienceYears), classMin: Number(f.classMin), classMax: Number(f.classMax),
        feeMin: Number(f.feeMin), feeMax: Number(f.feeMax),
        languages: f.languages.split(",").map((x) => x.trim()).filter(Boolean),
        achievements: f.achievements.split("\n").map((x) => x.trim()).filter(Boolean),
      }),
    });
    if (!res.ok) {
      setState("idle");
      return setError((await res.json()).error);
    }
    setState("saved");
    router.refresh();
    setTimeout(() => setState("idle"), 2000);
  }

  const grades = Array.from({ length: 12 }, (_, i) => i + 1);
  return (
    <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
      <Field label="Name"><input value={f.name} onChange={set("name")} className="input" /></Field>
      <Field label="Phone"><input value={f.phone} onChange={set("phone")} className="input" /></Field>
      <Field label="Qualification"><input value={f.qualification} onChange={set("qualification")} className="input" /></Field>
      <Field label="Experience (years)"><input type="number" min={0} value={f.experienceYears} onChange={set("experienceYears")} className="input" /></Field>
      <Field label="Subjects" className="sm:col-span-2">
        <div className="flex flex-wrap gap-1.5">
          {[...new Set([...subjects, ...f.subjects])].map((s) => (
            <button type="button" key={s} onClick={() => toggle("subjects", s)} className={cn("chip", f.subjects.includes(s) && "chip-active")}>{s}</button>
          ))}
        </div>
      </Field>
      <Field label="Classes">
        <div className="flex items-center gap-2">
          <select value={f.classMin} onChange={set("classMin")} className="input">{grades.map((g) => <option key={g} value={g}>Class {g}</option>)}</select>
          <span className="text-slate-400">to</span>
          <select value={f.classMax} onChange={set("classMax")} className="input">{grades.map((g) => <option key={g} value={g}>Class {g}</option>)}</select>
        </div>
      </Field>
      <Field label="Fee per hour (₹)">
        <div className="flex items-center gap-2">
          <input type="number" value={f.feeMin} onChange={set("feeMin")} className="input" />
          <span className="text-slate-400">to</span>
          <input type="number" value={f.feeMax} onChange={set("feeMax")} className="input" />
        </div>
      </Field>
      <Field label="Teaching mode" className="sm:col-span-2">
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button type="button" key={m} onClick={() => toggle("teachingModes", m)} className={cn("chip", f.teachingModes.includes(m) && "chip-active")}>{m}</button>
          ))}
        </div>
      </Field>
      <Field label="Area"><input value={f.area} onChange={set("area")} className="input" /></Field>
      <Field label="City"><input value={f.city} onChange={set("city")} className="input" /></Field>
      <Field label="Languages (comma separated)" className="sm:col-span-2"><input value={f.languages} onChange={set("languages")} className="input" /></Field>
      <Field label="Bio" className="sm:col-span-2"><textarea rows={3} value={f.bio} onChange={set("bio")} className="input" /></Field>
      <Field label="Achievements (one per line)" className="sm:col-span-2"><textarea rows={3} value={f.achievements} onChange={set("achievements")} className="input" /></Field>
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button disabled={state === "saving"} className="btn-primary btn-sm">
          {state === "saving" ? <Loader2 size={14} className="animate-spin" /> : state === "saved" ? <Check size={14} /> : null}
          {state === "saved" ? "Saved" : "Save profile"}
        </button>
      </div>
    </form>
  );
}
