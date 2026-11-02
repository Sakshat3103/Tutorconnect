import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { handler, bad, str, int } from "@/lib/api";
import { getTeacherByUser, getSlots, syncAvailableDays, DAYS } from "@/lib/teachers";

// FR9: teachers add / remove weekly time slots
export const GET = handler(async (req: Request) => {
  const id = new URL(req.url).searchParams.get("teacherId") ?? "";
  return NextResponse.json({ slots: getSlots(id) });
});

export const POST = handler(async (req: Request) => {
  const user = await requireUser("teacher");
  const t = getTeacherByUser(user.id);
  if (!t) bad("Create your profile first", 404);
  const body = await req.json().catch(() => ({}));
  const day = str(body.day, 3), start = str(body.start, 5), end = str(body.end, 5);
  if (!DAYS.includes(day)) bad("Choose a day");
  if (!/^\d\d:\d\d$/.test(start) || !/^\d\d:\d\d$/.test(end) || start >= end) bad("End time must be after start time");
  const overlap = getSlots(t.id).some((s) => s.day === day && s.startTime < end && s.endTime > start);
  if (overlap) bad("This overlaps an existing slot", 409);
  getDb().prepare("INSERT INTO slots (teacher_id, day, start_time, end_time) VALUES (?, ?, ?, ?)").run(t.id, day, start, end);
  syncAvailableDays(t.id);
  return NextResponse.json({ slots: getSlots(t.id) }, { status: 201 });
});

export const DELETE = handler(async (req: Request) => {
  const user = await requireUser("teacher");
  const t = getTeacherByUser(user.id);
  if (!t) bad("Create your profile first", 404);
  const id = int(new URL(req.url).searchParams.get("id"));
  getDb().prepare("DELETE FROM slots WHERE id = ? AND teacher_id = ?").run(id, t.id);
  syncAvailableDays(t.id);
  return NextResponse.json({ slots: getSlots(t.id) });
});
