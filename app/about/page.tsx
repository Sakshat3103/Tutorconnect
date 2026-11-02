import type { Metadata } from "next";
import { Target, Eye, Heart, GraduationCap, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about TutorConnect, a platform that helps students and parents find verified tuition teachers.",
};

export default function AboutPage() {
  return (
    <div className="section-container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold">About TutorConnect</h1>
        <p className="mt-4 text-slate-500 dark:text-slate-400">
          We help students and parents find a verified tuition teacher who fits their needs, using simple search and AI-based matching.
        </p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <InfoCard icon={<Target size={22} />} title="Our Mission" text="To make finding a qualified, trustworthy tuition teacher simple, transparent, and fast for every family in India." />
        <InfoCard icon={<Eye size={22} />} title="Our Vision" text="A world where every student has access to a great local teacher, verified and just a message away." />
        <InfoCard icon={<Heart size={22} />} title="Why We Started" text="Parents often depend on word-of-mouth to find tutors. TutorConnect makes it easier with verified profiles, reviews and AI matching." />
      </div>

      <div className="mt-20 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="card p-8">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap size={22} />
          </span>
          <h2 className="text-xl font-semibold">Benefits for Students &amp; Parents</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li>• Access to verified, qualified teachers near you</li>
            <li>• Compare profiles, ratings, and fees transparently</li>
            <li>• AI suggestions that explain why each tutor fits</li>
            <li>• Wide range of subjects and teaching modes</li>
          </ul>
        </div>
        <div className="card p-8">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users size={22} />
          </span>
          <h2 className="text-xl font-semibold">Benefits for Teachers</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li>• Free professional profile with verification badge</li>
            <li>• Reach students actively searching in your locality</li>
            <li>• Build credibility with ratings and reviews</li>
            <li>• Full control over your fees and availability</li>
          </ul>
        </div>
      </div>

    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="card p-8 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}
