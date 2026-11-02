export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="section-container max-w-3xl py-16 prose prose-slate dark:prose-invert">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        By using TutorConnect, you agree to provide accurate information during registration and
        search. TutorConnect is a discovery directory only — we do not employ teachers, process
        payments, or manage classes between students and teachers. Verification badges reflect
        document checks performed by our team at the time of review and do not constitute a
        guarantee of ongoing conduct. Users are responsible for their own due diligence before
        engaging any teacher listed on the platform.
      </p>
    </div>
  );
}
