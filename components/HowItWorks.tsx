import { Search, CalendarCheck, Star } from "lucide-react";

const steps = [
  { icon: Search, title: "Find a tutor", description: "Use the filters, or tell our AI what you need and get a ranked list of tutors." },
  { icon: CalendarCheck, title: "Book a class", description: "Pick one of the tutor's free time slots. They accept the request and you can chat." },
  { icon: Star, title: "Learn and review", description: "After your class, rate the tutor to help other students choose." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16">
      <div className="section-container">
        <h2 className="text-center text-2xl font-bold sm:text-3xl">How it works</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon size={20} />
                </span>
                <h3 className="font-semibold">
                  {i + 1}. {step.title}
                </h3>
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
