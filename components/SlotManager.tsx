"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { Slot } from "@/lib/teachers";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** FR9: tutors add and remove weekly time slots. */
export default function SlotManager({ initial }: { initial: Slot[] }) {
  const router = useRouter();
  const [slots, setSlots] = useState(initial);
  const [form, setForm] = useState({ day: "Mon", start: "17:00", end: "18:00" });
  const [error, setError] = useState("");

  async function add() {
    setError("");
    const res = await fetch("/api/slots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) return setError(d.error);
    setSlots(d.slots);
    router.refresh();
  }
  async function remove(id: number) {
    const res = await fetch(`/api/slots?id=${id}`, { method: "DELETE" });
    if (res.ok) setSlots((await res.json()).slots);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {slots.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            {s.day} {s.startTime}–{s.endTime}
            <button onClick={() => remove(s.id)} aria-label="Remove slot" className="hover:text-red-600"><X size={12} /></button>
          </span>
        ))}
        {!slots.length && <p className="text-sm text-slate-400">No slots yet. Students can only book times you add here.</p>}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className="input w-auto py-2">
          {DAYS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="input w-auto py-2" />
        <span className="text-slate-400">to</span>
        <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="input w-auto py-2" />
        <button onClick={add} className="btn-primary btn-sm"><Plus size={14} /> Add slot</button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
