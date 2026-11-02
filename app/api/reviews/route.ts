import { NextResponse } from "next/server";
import { getDb, logActivity } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handler, bad, str, int } from "@/lib/api";
import { getTeacher, getReviews } from "@/lib/teachers";

// FR13: rate & review a tutor after an accepted/completed class. Posting again updates your review.
export const POST = handler(async (req: Request) => {
  const user = await requireUser("student", "parent");
  const body = await req.json().catch(() => ({}));
  const teacher = getTeacher(str(body.teacherId, 100));
  if (!teacher) bad("Tutor not found", 404);
  const rating = int(body.rating);
  if (!(rating >= 1 && rating <= 5)) bad("Choose 1 to 5 stars");
  const comment = str(body.comment, 1000);
  const hadClass = getDb()
    .prepare("SELECT 1 FROM bookings WHERE student_id = ? AND teacher_id = ? AND status IN ('accepted','completed')")
    .get(user.id, teacher.id);
  if (!hadClass) bad("You can review a tutor after they accept one of your bookings", 403);
  getDb()
    .prepare(
      `INSERT INTO reviews (teacher_id, student_id, rating, comment) VALUES (?, ?, ?, ?)
       ON CONFLICT(teacher_id, student_id) DO UPDATE SET rating = excluded.rating, comment = excluded.comment, created_at = datetime('now')`
    )
    .run(teacher.id, user.id, rating, comment);
  logActivity(user.id, "review_posted", `${teacher.id}: ${rating}★`);
  return NextResponse.json({ reviews: getReviews(teacher.id) }, { status: 201 });
});
