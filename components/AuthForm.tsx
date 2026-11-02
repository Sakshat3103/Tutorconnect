"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Users, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "student", label: "Student", icon: GraduationCap, hint: "Find a tutor for yourself" },
  { value: "parent", label: "Parent", icon: Users, hint: "Find a tutor for your child" },
  { value: "teacher", label: "Teacher", icon: BookOpen, hint: "Offer tuition and get students" },
];

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState(params.get("role") ?? "student");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Something went wrong");
    const next = params.get("next");
    const r = data.user.role;
    router.push(next || (mode === "signup" && r === "teacher" ? "/register" : r === "admin" ? "/admin" : "/dashboard"));
    router.refresh();
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {mode === "login" ? "Log in to manage bookings and messages." : "Join TutorConnect in under a minute."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-3 text-sm font-medium transition",
                      role === r.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-slate-200 hover:border-primary/50 dark:border-slate-700"
                    )}
                  >
                    <r.icon size={20} />
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="-mt-2 text-xs text-slate-500">{ROLES.find((r) => r.value === role)?.hint}</p>
              <Field label="Full name"><input required value={form.name} onChange={set("name")} className="input" /></Field>
              <Field label="Phone (optional)"><input value={form.phone} onChange={set("phone")} className="input" /></Field>
            </>
          )}
          <Field label="Email"><input required type="email" value={form.email} onChange={set("email")} className="input" autoComplete="email" /></Field>
          <Field label="Password">
            <input required type="password" minLength={6} value={form.password} onChange={set("password")} className="input"
              autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </Field>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}
          <button disabled={loading} className="btn-primary w-full justify-center">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === "login" ? (
            <>New here? <Link href="/signup" className="font-medium text-primary">Create an account</Link></>
          ) : (
            <>Already have an account? <Link href="/login" className="font-medium text-primary">Log in</Link></>
          )}
        </p>
      </div>

    </div>
  );
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
    </label>
  );
}
