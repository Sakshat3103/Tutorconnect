import Link from "next/link";
import { GraduationCap } from "lucide-react";

const links = [
  { label: "Find tutors", href: "/teachers" },
  { label: "AI match", href: "/recommend" },
  { label: "Become a tutor", href: "/register" },
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-100 dark:border-slate-800">
      <div className="section-container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <GraduationCap size={18} />
          </span>
          Tutor<span className="-ml-2 text-primary">Connect</span>
        </Link>
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-primary">{l.label}</Link>
          ))}
        </nav>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} TutorConnect</p>
      </div>
    </footer>
  );
}
