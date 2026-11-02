"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sigma,
  Atom,
  FlaskConical,
  Leaf,
  BookText,
  Code2,
  Landmark,
  Calculator,
  TrendingUp,
  Cpu,
  Music2,
  Palette,
  Trophy,
} from "lucide-react";

const subjects = [
  { name: "Mathematics", icon: Sigma },
  { name: "Physics", icon: Atom },
  { name: "Chemistry", icon: FlaskConical },
  { name: "Biology", icon: Leaf },
  { name: "English", icon: BookText },
  { name: "Coding", icon: Code2 },
  { name: "Commerce", icon: Landmark },
  { name: "Accountancy", icon: Calculator },
  { name: "Economics", icon: TrendingUp },
  { name: "Computer Science", icon: Cpu },
  { name: "Music", icon: Music2 },
  { name: "Art", icon: Palette },
  { name: "Sports Coaching", icon: Trophy },
];

export default function FeaturedSubjects() {
  return (
    <section id="subjects" className="py-20">
      <div className="section-container">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Explore by Subject</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Browse verified tutors across every subject your child needs help with.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {subjects.map((subject, i) => {
            const Icon = subject.icon;
            return (
              <motion.div
                key={subject.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: (i % 5) * 0.06 }}
                whileHover={{ y: -4 }}
                className="card-premium relative flex cursor-pointer flex-col items-center gap-3 p-6 text-center"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={22} />
                </span>
                <span className="text-sm font-medium">{subject.name}</span>
                <Link href={`/teachers?subject=${encodeURIComponent(subject.name)}`} className="absolute inset-0" aria-label={`Find ${subject.name} tutors`} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
