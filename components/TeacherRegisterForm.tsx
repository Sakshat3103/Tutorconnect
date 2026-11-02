"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Upload, PartyPopper, Plus, X, Loader2 } from "lucide-react";
import type { SessionUser } from "@/lib/auth";

const steps = ["Basic Info", "Teaching Details", "Profile & Fees", "Availability & Review"];
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const modes = ["Home Tuition", "Online", "At Tutor's Place"];

type Slot = { day: string; start: string; end: string };

interface FormState {
  name: string;
  phone: string;
  email: string;
  password: string;
  qualification: string;
  experience: string;
  subjects: string[];
  classMin: string;
  classMax: string;
  teachingMode: string[];
  area: string;
  city: string;
  languages: string;
  photo: string;
  bio: string;
  feeMin: string;
  feeMax: string;
  achievements: string;
  demoClass: boolean;
  slots: Slot[];
  terms: boolean;
}

/** Shrinks an uploaded photo to a 320px JPEG data URL so it can be stored with the profile. */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 320;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const s = Math.min(img.width, img.height);
      canvas.getContext("2d")!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export default function TeacherRegisterForm({ user, subjects }: { user: SessionUser | null; subjects: string[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    name: user?.name ?? "", phone: "", email: user?.email ?? "", password: "", qualification: "", experience: "",
    subjects: [], classMin: "", classMax: "", teachingMode: [], area: "", city: "", languages: "", photo: "",
    bio: "", feeMin: "", feeMax: "", achievements: "", demoClass: false, slots: [], terms: false,
  });
  const [slot, setSlot] = useState<Slot>({ day: "Mon", start: "17:00", end: "18:00" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArray(key: "subjects" | "teachingMode", value: string) {
    setForm((prev) => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  }

  function addSlot() {
    if (slot.start >= slot.end) return setError("Slot end time must be after start time");
    if (form.slots.some((s) => s.day === slot.day && s.start < slot.end && s.end > slot.start))
      return setError("That slot overlaps one you already added");
    setError("");
    update("slots", [...form.slots, slot].sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day) || a.start.localeCompare(b.start)));
  }

  function validate(s: number): string {
    if (s === 0) {
      if (!form.name.trim()) return "Please enter your full name";
      if (!form.phone.trim()) return "Please enter your phone number";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email";
      if (!user && form.password.length < 6) return "Password must be at least 6 characters";
      if (!form.qualification.trim()) return "Please enter your qualification";
    }
    if (s === 1) {
      if (form.experience === "" || Number(form.experience) < 0) return "Enter your years of experience";
      if (!form.subjects.length) return "Choose at least one subject";
      if (!form.classMin || !form.classMax) return "Choose the classes you teach";
      if (Number(form.classMin) > Number(form.classMax)) return "'From' class must be lower than 'to' class";
      if (!form.teachingMode.length) return "Choose at least one teaching mode";
      if (!form.area.trim() || !form.city.trim()) return "Enter your area and city";
    }
    if (s === 2) {
      if (form.bio.trim().length < 20) return "Write a short bio (at least 20 characters)";
      if (!(Number(form.feeMin) > 0) || Number(form.feeMax) < Number(form.feeMin)) return "Enter a valid fee range";
    }
    if (s === 3) {
      if (!form.slots.length) return "Add at least one available time slot";
      if (!form.terms) return "Please accept the terms";
    }
    return "";
  }

  function next() {
    const err = validate(step);
    setError(err);
    if (!err && step < steps.length - 1) setStep(step + 1);
  }
  function back() {
    setError("");
    if (step > 0) setStep(step - 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    for (let s = 0; s < steps.length; s++) {
      const err = validate(s);
      if (err) {
        setStep(s);
        return setError(err);
      }
    }
    setSaving(true);
    setError("");
    if (!user) {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, phone: form.phone, role: "teacher" }),
      });
      if (!res.ok) {
        setSaving(false);
        setStep(0);
        return setError((await res.json()).error ?? "Could not create your account");
      }
    }
    const achievements = form.achievements.split("\n").map((a) => a.trim()).filter(Boolean);
    if (form.demoClass) achievements.push("Offers a free demo class");
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, phone: form.phone, whatsapp: form.phone, qualification: form.qualification,
        experienceYears: Number(form.experience), subjects: form.subjects,
        classMin: Number(form.classMin), classMax: Number(form.classMax), area: form.area, city: form.city,
        teachingModes: form.teachingMode, feeMin: Number(form.feeMin), feeMax: Number(form.feeMax),
        languages: form.languages.split(",").map((l) => l.trim()).filter(Boolean),
        bio: form.bio, achievements, photo: form.photo, slots: form.slots,
      }),
    });
    setSaving(false);
    if (!res.ok) return setError((await res.json()).error ?? "Could not save your profile");
    setSubmitted(true);
    router.refresh();
  }

  if (submitted) {
    return (
      <div className="section-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <PartyPopper size={32} />
        </motion.div>
        <h1 className="mt-6 text-2xl font-bold">Registration Submitted!</h1>
        <p className="mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">
          Your profile is saved and waiting for verification. An administrator will review your qualifications;
          once approved, your profile appears in search results and students can book you.
        </p>
        <Link href="/dashboard" className="btn-primary mt-6">Go to my dashboard</Link>
      </div>
    );
  }

  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
      on ? "border-primary bg-primary text-white" : "border-slate-200 text-slate-600 hover:border-primary dark:border-slate-700 dark:text-slate-300"
    }`;

  return (
    <div className="section-container max-w-3xl py-14">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">Register as a Teacher</h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          Create your teacher profile in a few minutes.{" "}
          {!user && <>Already registered? <Link href="/login?next=/register" className="font-medium text-primary">Log in</Link></>}
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-10 flex items-center justify-between">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i < step ? "bg-primary text-white" : i === step ? "border-2 border-primary text-primary" : "border-2 border-slate-200 text-slate-400 dark:border-slate-700"
                }`}
              >
                {i < step ? <Check size={16} /> : i + 1}
              </div>
              <span className="hidden text-[11px] text-slate-500 sm:block">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 transition-colors ${i < step ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"}`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate className="card p-6 sm:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            {step === 0 && (
              <>
                <Field label="Full Name">
                  <input value={form.name} onChange={(e) => update("name", e.target.value)} className="input" placeholder="e.g. Priya Sharma" />
                </Field>
                <Field label="Phone / WhatsApp Number">
                  <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="input" placeholder="+91 98765 43210" />
                </Field>
                <Field label="Email Address">
                  <input type="email" value={form.email} disabled={Boolean(user)} onChange={(e) => update("email", e.target.value)} className="input disabled:opacity-60" placeholder="you@example.com" />
                </Field>
                {!user && (
                  <Field label="Create a Password">
                    <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} className="input" placeholder="At least 6 characters" autoComplete="new-password" />
                  </Field>
                )}
                <Field label="Highest Qualification">
                  <input value={form.qualification} onChange={(e) => update("qualification", e.target.value)} className="input" placeholder="e.g. M.Sc Mathematics, B.Ed" />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Years of Teaching Experience">
                  <input type="number" min={0} value={form.experience} onChange={(e) => update("experience", e.target.value)} className="input" placeholder="e.g. 5" />
                </Field>
                <Field label="Subjects You Teach">
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((s) => (
                      <button type="button" key={s} onClick={() => toggleArray("subjects", s)} className={chip(form.subjects.includes(s))}>{s}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Classes You Teach">
                  <div className="flex items-center gap-3">
                    <select value={form.classMin} onChange={(e) => update("classMin", e.target.value)} className="input">
                      <option value="">From class</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => <option key={g} value={g}>Class {g}</option>)}
                    </select>
                    <span className="text-slate-400">to</span>
                    <select value={form.classMax} onChange={(e) => update("classMax", e.target.value)} className="input">
                      <option value="">To class</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => <option key={g} value={g}>Class {g}</option>)}
                    </select>
                  </div>
                </Field>
                <Field label="Teaching Mode">
                  <div className="flex flex-wrap gap-2">
                    {modes.map((m) => (
                      <button type="button" key={m} onClick={() => toggleArray("teachingMode", m)} className={chip(form.teachingMode.includes(m))}>{m}</button>
                    ))}
                  </div>
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Area">
                    <input value={form.area} onChange={(e) => update("area", e.target.value)} className="input" placeholder="e.g. Koramangala" />
                  </Field>
                  <Field label="City">
                    <input value={form.city} onChange={(e) => update("city", e.target.value)} className="input" placeholder="e.g. Bengaluru" />
                  </Field>
                </div>
                <Field label="Languages Known">
                  <input value={form.languages} onChange={(e) => update("languages", e.target.value)} className="input" placeholder="e.g. English, Hindi, Kannada" />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Profile Photo (optional)">
                  <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 py-6 text-sm text-slate-400 hover:border-primary hover:text-primary dark:border-slate-700">
                    {form.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.photo} alt="Preview" className="h-16 w-16 rounded-xl object-cover" />
                    ) : (
                      <Upload size={18} />
                    )}
                    {form.photo ? "Change photo" : "Click to upload a photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) update("photo", await resizeImage(f).catch(() => ""));
                      }}
                    />
                  </label>
                </Field>
                <Field label="Short Bio">
                  <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={4} className="input resize-none" placeholder="Tell students and parents about your teaching style and strengths..." />
                </Field>
                <Field label="Fee per hour (₹)">
                  <div className="flex items-center gap-3">
                    <input type="number" min={0} step={50} value={form.feeMin} onChange={(e) => update("feeMin", e.target.value)} className="input" placeholder="From, e.g. 800" />
                    <span className="text-slate-400">to</span>
                    <input type="number" min={0} step={50} value={form.feeMax} onChange={(e) => update("feeMax", e.target.value)} className="input" placeholder="To, e.g. 1200" />
                  </div>
                </Field>
                <Field label="Achievements (optional, one per line)">
                  <textarea value={form.achievements} onChange={(e) => update("achievements", e.target.value)} rows={3} className="input resize-none" placeholder={"e.g. 40+ students scored 95% in boards\nCBSE examiner since 2020"} />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.demoClass} onChange={(e) => update("demoClass", e.target.checked)} className="h-4 w-4 rounded accent-primary" />
                  I offer a free demo class
                </label>
              </>
            )}

            {step === 3 && (
              <>
                <Field label="Weekly Available Time Slots">
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={slot.day} onChange={(e) => setSlot({ ...slot, day: e.target.value })} className="input w-auto">
                      {days.map((d) => <option key={d}>{d}</option>)}
                    </select>
                    <input type="time" value={slot.start} onChange={(e) => setSlot({ ...slot, start: e.target.value })} className="input w-auto" />
                    <span className="text-slate-400">to</span>
                    <input type="time" value={slot.end} onChange={(e) => setSlot({ ...slot, end: e.target.value })} className="input w-auto" />
                    <button type="button" onClick={addSlot} className="btn-secondary px-4 py-2 text-sm"><Plus size={14} /> Add</button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.slots.map((s, i) => (
                      <span key={i} className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                        {s.day} {s.start}–{s.end}
                        <button type="button" aria-label="Remove slot" onClick={() => update("slots", form.slots.filter((_, j) => j !== i))}><X size={12} /></button>
                      </span>
                    ))}
                    {!form.slots.length && <span className="text-xs text-slate-400">No slots yet. Students book these times.</span>}
                  </div>
                </Field>

                <div className="rounded-xl bg-slate-50 p-5 text-sm dark:bg-slate-800/50">
                  <p className="mb-2 font-semibold">Review Your Details</p>
                  <ul className="space-y-1 text-slate-500 dark:text-slate-400">
                    <li>Name: {form.name || "—"}</li>
                    <li>Qualification: {form.qualification || "—"}</li>
                    <li>Subjects: {form.subjects.join(", ") || "—"}</li>
                    <li>Classes: {form.classMin && form.classMax ? `${form.classMin} – ${form.classMax}` : "—"}</li>
                    <li>Mode: {form.teachingMode.join(", ") || "—"}</li>
                    <li>Location: {[form.area, form.city].filter(Boolean).join(", ") || "—"}</li>
                    <li>Fee: {form.feeMin ? `₹${form.feeMin} – ₹${form.feeMax}/hr` : "—"}</li>
                  </ul>
                </div>

                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={form.terms} onChange={(e) => update("terms", e.target.checked)} className="mt-0.5 h-4 w-4 rounded accent-primary" />
                  I agree to the Terms of Service and Privacy Policy, and confirm the information provided is accurate.
                </label>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}

        <div className="mt-8 flex items-center justify-between">
          <button type="button" onClick={back} disabled={step === 0} className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40">
            <ChevronLeft size={16} /> Back
          </button>
          {step < steps.length - 1 ? (
            <button type="button" onClick={next} className="btn-primary">
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Submit Registration
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
