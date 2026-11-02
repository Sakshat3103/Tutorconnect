"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Small button that PATCHes an admin API endpoint and refreshes the page. */
export default function AdminButton({
  url, body, label, variant = "secondary",
}: { url: string; body: Record<string, unknown>; label: string; variant?: "primary" | "secondary" | "danger" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const cls =
    variant === "primary" ? "btn-primary" :
    variant === "danger" ? "inline-flex items-center gap-1.5 rounded-full border-2 border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40" :
    "btn-secondary";
  return (
    <span className="inline-flex flex-col items-end">
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr("");
          const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
          setBusy(false);
          if (!res.ok) setErr((await res.json()).error);
          router.refresh();
        }}
        className={`${cls} btn-sm whitespace-nowrap`}
      >
        {busy && <Loader2 size={13} className="animate-spin" />}
        {label}
      </button>
      {err && <span className="mt-1 text-xs text-red-600">{err}</span>}
    </span>
  );
}
