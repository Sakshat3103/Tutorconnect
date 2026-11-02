"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, MapPin, Layers } from "lucide-react";
import { subjectsList } from "@/lib/data";

export default function SearchBar() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [area, setArea] = useState("");
  const [mode, setMode] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (area) params.set("location", area);
    if (mode) params.set("mode", mode);
    router.push(`/teachers?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="glass flex flex-col gap-2 rounded-2xl p-2 shadow-premium sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
        <BookOpen size={16} className="shrink-0 text-primary" />
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
        >
          <option value="">Subject</option>
          {subjectsList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-700" />

      <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
        <MapPin size={16} className="shrink-0 text-primary" />
        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Area / City"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-700" />

      <div className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5">
        <Layers size={16} className="shrink-0 text-primary" />
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
        >
          <option value="">Mode</option>
          <option value="Online">Online</option>
          <option value="Home Tuition">Home Tuition</option>
          <option value="At Tutor's Place">At Tutor's Place</option>
        </select>
      </div>

      <button type="submit" className="btn-primary w-full shrink-0 sm:w-auto">
        <Search size={16} /> Search
      </button>
    </form>
  );
}
