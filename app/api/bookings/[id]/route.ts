import { NextResponse } from "next/server";
import { getDb, logActivity } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handler, bad, str } from "@/lib/api";
import { getBooking, hasClash } from "@/lib/bookings";

type Ctx = { params: Promise<{ id: string }> };

// FR11: teacher accepts / rejects / marks completed; student cancels
export const PATCH = handler(async (req: Request, ctx: Ctx) => {
  const user = await requireUser("student", "parent", "teacher");
  const booking = getBooking(Number((await ctx.params).id));
  if (!booking) bad("Booking not found", 404);
  const action = str((await req.json().catch(() => ({}))).action, 20);
  const isTeacher = user.role === "teacher" && booking.teacherUserId === user.id;
  const isStudent = booking.studentId === user.id;

  let status: string;
  if (action === "accept" || action === "reject") {
    if (!isTeacher) bad("Only the tutor can do this", 403);
    if (booking.status !== "pending") bad("This request was already handled");
    if (action === "accept" && hasClash(booking.teacherId, booking.date, booking.startTime, booking.endTime, booking.id)) {
      const otherAccepted = getDb()
        .prepare("SELECT 1 FROM bookings WHERE teacher_id=? AND date=? AND status='accepted' AND start_time < ? AND end_time > ? AND id != ?")
        .get(booking.teacherId, booking.date, booking.endTime, booking.startTime, booking.id);
      if (otherAccepted) bad("You already accepted another class at this time", 409);
    }
    status = action === "accept" ? "accepted" : "rejected";
  } else if (action === "complete") {
    if (!isTeacher) bad("Only the tutor can do this", 403);
    if (booking.status !== "accepted") bad("Only accepted classes can be completed");
    status = "completed";
  } else if (action === "cancel") {
    if (!isStudent && !isTeacher) bad("Not your booking", 403);
    if (!["pending", "accepted"].includes(booking.status)) bad("This booking can't be cancelled");
    status = "cancelled";
  } else {
    bad("Unknown action");
  }
  getDb().prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, booking.id);
  logActivity(user.id, `booking_${status}`, `#${booking.id}`);
  return NextResponse.json({ booking: getBooking(booking.id) });
});
