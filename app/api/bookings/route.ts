import { NextResponse } from "next/server";
import { getDb, logActivity } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handler, bad, str, int } from "@/lib/api";
import { getTeacher, getTeacherByUser } from "@/lib/teachers";
import { bookingsForStudent, bookingsForTeacher, hasClash, weekday, todayISO, getBooking } from "@/lib/bookings";

export const GET = handler(async () => {
  const user = await requireUser("student", "parent", "teacher");
  if (user.role === "teacher") {
    const t = getTeacherByUser(user.id);
    return NextResponse.json({ bookings: t ? bookingsForTeacher(t.id) : [] });
  }
  return NextResponse.json({ bookings: bookingsForStudent(user.id) });
});

// FR10: student/parent sends a booking request for one of the teacher's slots on a given date
export const POST = handler(async (req: Request) => {
  const user = await requireUser("student", "parent");
  const body = await req.json().catch(() => ({}));
  const teacher = getTeacher(str(body.teacherId, 100));
  if (!teacher || teacher.status !== "approved") bad("This tutor is not available for booking", 404);

  const date = str(body.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) bad("Choose a date");
  const today = todayISO();
  if (date < today) bad("Choose a date in the future");
  const limit = new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10);
  if (date > limit) bad("You can book up to 60 days ahead");

  const slot = getDb()
    .prepare("SELECT day, start_time, end_time FROM slots WHERE id = ? AND teacher_id = ?")
    .get(int(body.slotId), teacher.id) as { day: string; start_time: string; end_time: string } | undefined;
  if (!slot) bad("Choose one of the tutor's available time slots");
  if (weekday(date) !== slot.day) bad(`That slot is on ${slot.day}, but ${date} is a ${weekday(date)}`);

  const subject = str(body.subject, 60);
  if (!teacher.subjects.includes(subject)) bad("Choose a subject this tutor teaches");
  const mode = str(body.mode, 30);
  if (!(teacher.teachingModes as string[]).includes(mode)) bad("Choose a teaching mode this tutor offers");

  // Risk R4: block double bookings
  if (hasClash(teacher.id, date, slot.start_time, slot.end_time)) bad("This slot is already booked on that date. Please pick another.", 409);
  const dup = getDb()
    .prepare("SELECT 1 FROM bookings WHERE student_id = ? AND date = ? AND status IN ('pending','accepted') AND start_time < ? AND end_time > ?")
    .get(user.id, date, slot.end_time, slot.start_time);
  if (dup) bad("You already have a class booked at this time", 409);

  const r = getDb()
    .prepare("INSERT INTO bookings (student_id, teacher_id, date, start_time, end_time, subject, mode, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(user.id, teacher.id, date, slot.start_time, slot.end_time, subject, mode, str(body.message, 1000));
  logActivity(user.id, "booking_requested", `${teacher.id} on ${date} ${slot.start_time}`);
  return NextResponse.json({ booking: getBooking(Number(r.lastInsertRowid)) }, { status: 201 });
});
