import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import SearchBar from "./SearchBar";

export default function Hero() {
  return (
    <section className="border-b border-slate-100 bg-gradient-to-b from-primary/5 to-transparent dark:border-slate-800">
      <div className="section-container mx-auto max-w-3xl py-20 text-center lg:py-24">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Find the right <span className="text-primary">tuition teacher</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-500 dark:text-slate-400 sm:text-lg">
          Search verified tutors by subject, class and area, or let our AI suggest the best match for you.
          Book a class in a few clicks.
        </p>

        <div id="search" className="mt-8 text-left">
          <SearchBar />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/teachers" className="btn-primary">
            Browse tutors <ArrowRight size={16} />
          </Link>
          <Link href="/recommend" className="btn-secondary">
            <Sparkles size={16} /> Try AI match
          </Link>
        </div>
      </div>
    </section>
  );
}
