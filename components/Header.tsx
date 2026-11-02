"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Menu, X, LayoutDashboard, LogOut, Sparkles, ShieldCheck } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { label: "Find Tutors", href: "/teachers" },
  { label: "AI Match", href: "/recommend" },
  { label: "Become a Tutor", href: "/register" },
  { label: "About", href: "/about" },
];

export default function Header({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const home = user?.role === "admin" ? "/admin" : "/dashboard";
  const accountLinks = user ? (
    <>
      <Link href={home} onClick={() => setOpen(false)} className="btn-secondary text-sm px-4 py-2">
        {user.role === "admin" ? <ShieldCheck size={15} /> : <LayoutDashboard size={15} />}
        {user.role === "admin" ? "Admin" : "Dashboard"}
      </Link>
      <button onClick={logout} title={`Log out ${user.name}`} className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300">
        <LogOut size={15} /> Log out
      </button>
    </>
  ) : (
    <>
      <Link href="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300">
        Log in
      </Link>
      <Link href="/signup" onClick={() => setOpen(false)} className="btn-primary text-sm px-5 py-2.5">
        Sign up
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="section-container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
            <GraduationCap size={20} />
          </span>
          <span>
            Tutor<span className="text-primary">Connect</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-300"
            >
              {link.label === "AI Match" && <Sparkles size={13} className="text-primary" />}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <ThemeToggle />
          {accountLinks}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen(!open)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100 dark:border-slate-800 lg:hidden"
          >
            <div className="section-container flex flex-col gap-4 py-5">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-slate-600 dark:text-slate-300"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">{accountLinks}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
