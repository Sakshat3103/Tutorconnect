import Link from "next/link";
import { Sparkles, ListChecks, FileText, MessageSquareText, ArrowRight } from "lucide-react";

export const AI_FACTORS = [
  { label: "Subject match", points: 25, text: "Does the tutor teach the subjects you need?" },
  { label: "Class fit", points: 15, text: "Does the tutor teach your class?" },
  { label: "Mode & location", points: 15, text: "Home tuition near you, at the tutor's place, or online" },
  { label: "Rating & trust", points: 12, text: "Average rating, number of reviews and verification" },
  { label: "Budget", points: 10, text: "Is the fee within what you can pay?" },
  { label: "Availability", points: 10, text: "Is the tutor free on the days that suit you?" },
  { label: "Matches your goals", points: 10, text: "How closely the tutor's profile matches what you wrote" },
  { label: "Experience", points: 3, text: "Years of teaching experience" },
];

/** Short version for the home page. */
export function AiExplainerShort() {
  return (
    <section className="bg-slate-50 py-16 dark:bg-slate-900/40">
      <div className="section-container grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles size={13} /> AI tutor matching
          </span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">How our AI picks tutors for you</h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Tell us the subject, class, area, budget and what you need help with. Our matching system scores every
            verified tutor out of 100 and shows you why each one was suggested.
          </p>
          <Link href="/recommend#how-ai-works" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
            Read how it works <ArrowRight size={14} />
          </Link>
        </div>
        <ul className="space-y-3">
          <Point icon={ListChecks} title="Scores 8 things that matter">Subject, class, location and mode, budget, availability, ratings, experience and your goals.</Point>
          <Point icon={FileText} title="Understands what you write">It compares your goals (e.g. &quot;weak in organic chemistry&quot;) with each tutor&apos;s profile.</Point>
          <Point icon={MessageSquareText} title="Explains every match">You see the reasons and any drawbacks, so you decide, not a black box.</Point>
        </ul>
      </div>
    </section>
  );
}

function Point({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <li className="card flex gap-3 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={18} /></span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>
      </div>
    </li>
  );
}

/** Full explanation for the AI Match page. */
export function AiExplainerFull() {
  return (
    <section id="how-ai-works" className="card mt-12 scroll-mt-24 p-6 sm:p-8">
      <h2 className="flex items-center gap-2 text-xl font-bold"><Sparkles size={18} className="text-primary" /> How our AI matching works</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        TutorConnect uses a <strong>content-based recommendation system</strong>. It does not guess or use paid
        placements: every verified tutor is compared with your needs in the same way, and the reasons are shown to you.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="font-semibold">1. Scoring each tutor (out of 100)</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Each factor adds points. Tutors who don&apos;t teach any of your subjects are left out.</p>
          <table className="mt-3 w-full text-sm">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {AI_FACTORS.map((f) => (
                <tr key={f.label}>
                  <td className="py-2 pr-3 font-medium">{f.label}</td>
                  <td className="py-2 pr-3 text-slate-500 dark:text-slate-400">{f.text}</td>
                  <td className="py-2 text-right font-semibold text-primary">{f.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-5 text-sm">
          <div>
            <h3 className="font-semibold">2. Understanding your goals</h3>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              The text you write (for example &quot;NEET preparation, weak in organic chemistry&quot;) is compared with each
              tutor&apos;s bio and achievements using <strong>TF-IDF</strong> and <strong>cosine similarity</strong>.
              Important, less common words like &quot;NEET&quot; or &quot;organic&quot; count more than everyday words, so tutors
              who describe exactly what you need score higher.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">3. Ranking and explaining</h3>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              Tutors are sorted by total score. For each one you see the reasons it matched (✓) and anything that
              doesn&apos;t fit (!), plus a breakdown of the points.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">4. Optional AI summary</h3>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              When enabled, a large language model reads the top matches and writes a short summary of which tutor to
              try first. It only uses the facts shown on this page.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
