"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import NeedsForm, { type NeedsState } from "./NeedsForm";

/** FR3: student/parent saves learning requirements; these drive the AI recommendations. */
export default function StudentProfileForm({ initial, subjects, isParent }: { initial: NeedsState; subjects: string[]; isParent: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    setError("");
    const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
    if (!res.ok) {
      setState("idle");
      return setError((await res.json()).error);
    }
    setState("saved");
    router.refresh();
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <NeedsForm value={value} onChange={setValue} subjects={subjects} showName={isParent} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={state === "saving"} className="btn-primary btn-sm">
        {state === "saving" ? <Loader2 size={14} className="animate-spin" /> : state === "saved" ? <Check size={14} /> : null}
        {state === "saved" ? "Saved" : "Save preferences"}
      </button>
    </form>
  );
}
