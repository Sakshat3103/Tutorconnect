export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="section-container max-w-3xl py-16 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        TutorConnect respects your privacy. We collect only the information necessary to connect
        students and parents with tuition teachers, including contact details submitted during
        registration or search. We do not sell personal data to third parties. Teacher contact
        information is shared with students only when explicitly requested via profile actions
        (WhatsApp, Call, or Email). For questions about your data, contact us at
        hello@tutorconnect.example.com.
      </p>
    </div>
  );
}
