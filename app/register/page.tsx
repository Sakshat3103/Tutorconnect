import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTeacherByUser } from "@/lib/teachers";
import { subjectsList } from "@/lib/data";
import TeacherRegisterForm from "@/components/TeacherRegisterForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Register as a Teacher" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user?.role === "teacher" && getTeacherByUser(user.id)) redirect("/dashboard");
  if (user && user.role !== "teacher") {
    return (
      <div className="section-container max-w-xl py-20 text-center">
        <h1 className="text-2xl font-bold">You&apos;re logged in as a {user.role}</h1>
        <p className="mt-3 text-slate-500">To register as a teacher, log out and create a teacher account.</p>
        <Link href="/dashboard" className="btn-secondary mt-6 inline-flex">Go to dashboard</Link>
      </div>
    );
  }
  return <TeacherRegisterForm user={user} subjects={subjectsList} />;
}
