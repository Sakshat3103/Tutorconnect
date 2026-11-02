import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handler, bad, str } from "@/lib/api";
import { getBooking, getMessages } from "@/lib/bookings";

type Ctx = { params: Promise<{ id: string }> };

async function load(ctx: Ctx) {
  const user = await requireUser();
  const booking = getBooking(Number((await ctx.params).id));
  if (!booking) bad("Booking not found", 404);
  const participant = booking.studentId === user.id || booking.teacherUserId === user.id;
  if (!participant && user.role !== "admin") bad("Not your conversation", 403);
  return { user, booking, participant };
}

// FR12: student <-> teacher messages for a booking
export const GET = handler(async (_req: Request, ctx: Ctx) => {
  const { booking } = await load(ctx);
  return NextResponse.json({ messages: getMessages(booking.id) });
});

export const POST = handler(async (req: Request, ctx: Ctx) => {
  const { user, booking, participant } = await load(ctx);
  if (!participant) bad("Only the student and tutor can send messages", 403);
  const body = str((await req.json().catch(() => ({}))).body, 2000);
  if (!body) bad("Message is empty");
  getDb().prepare("INSERT INTO messages (booking_id, sender_id, body) VALUES (?, ?, ?)").run(booking.id, user.id, body);
  return NextResponse.json({ messages: getMessages(booking.id) }, { status: 201 });
});
