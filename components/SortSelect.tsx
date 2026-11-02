"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <select
      value={params.get("sort") ?? "rating"}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString());
        next.set("sort", e.target.value);
        router.replace(`/teachers?${next.toString()}`, { scroll: false });
      }}
      className="rounded-lg border border-slate-200 bg-transparent px-2 py-1 text-sm dark:border-slate-700"
    >
      <option value="rating">Top rated</option>
      <option value="experience">Most experienced</option>
      <option value="fee_low">Fee: low to high</option>
      <option value="fee_high">Fee: high to low</option>
      <option value="newest">Newest</option>
    </select>
  );
}
