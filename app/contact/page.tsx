"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Is TutorConnect free for parents and students?",
    a: "Yes, browsing teacher profiles and contacting teachers is completely free for students and parents.",
  },
  {
    q: "How are teachers verified?",
    a: "Our team manually reviews qualification documents and ID proof submitted during registration before granting a Verified Teacher badge.",
  },
  {
    q: "Can I request a demo class before hiring a teacher?",
    a: "Many teachers on TutorConnect offer free demo classes. Look for the 'Demo Class Available' note on their profile.",
  },
  {
    q: "How do I register as a teacher?",
    a: "Click 'Register as Teacher' in the navigation bar and complete our simple multi-step form. Your profile goes live after verification.",
  },
];

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="section-container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold">Get in Touch</h1>
        <p className="mt-4 text-slate-500 dark:text-slate-400">
          Have a question, feedback, or partnership idea? We'd love to hear from you.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="card-premium p-8">
            {submitted ? (
              <div className="py-10 text-center">
                <p className="text-lg font-semibold">Thanks for reaching out!</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Our team will get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Full Name</label>
                    <input required className="input" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Email</label>
                    <input required type="email" className="input" placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Subject</label>
                  <input required className="input" placeholder="How can we help?" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Message</label>
                  <textarea required rows={5} className="input resize-none" placeholder="Tell us more..." />
                </div>
                <button type="submit" className="btn-primary w-full justify-center sm:w-auto">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <ContactRow icon={<Mail size={18} />} label="Email" value="hello@tutorconnect.example.com" />
          <ContactRow icon={<Phone size={18} />} label="Phone" value="+91 98765 43210" />
          <ContactRow icon={<MapPin size={18} />} label="Office" value="4th Floor, Prestige Tech Park, Bengaluru, India" />

          <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-sm text-slate-400 dark:bg-slate-900">
              Google Maps Placeholder
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-2xl">
        <h2 className="mb-6 text-center text-2xl font-bold">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="card-premium overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between p-5 text-left text-sm font-medium"
              >
                {faq.q}
                <ChevronDown
                  size={16}
                  className={`shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                />
              </button>
              {openFaq === i && (
                <p className="px-5 pb-5 text-sm text-slate-500 dark:text-slate-400">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-premium flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
