import { getDb } from "./db";

export type BookingStatus = "pending" | "accepted" | "rejected" | "cancelled" | "completed";

export interface Booking {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  teacherId: string;
  teacherName: string;
  teacherUserId: number | null;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  mode: string;
  message: string;
  status: BookingStatus;
  createdAt: string;
  unread?: number;
}

export interface Message {
  id: number;
  bookingId: number;
  senderId: number;
  senderName: string;
  body: string;
  createdAt: string;
}

type Row = Record<string, unknown>;

const SELECT = `
  SELECT b.*, u.name AS student_name, u.email AS student_email, t.name AS teacher_name, t.user_id AS teacher_user_id,
    (SELECT COUNT(*) FROM messages m WHERE m.booking_id = b.id) AS msg_count
  FROM bookings b JOIN users u ON u.id = b.student_id JOIN teachers t ON t.id = b.teacher_id`;

function toBooking(r: Row): Booking {
  return {
    id: Number(r.id), studentId: Number(r.student_id), studentName: String(r.student_name),
    studentEmail: String(r.student_email), teacherId: String(r.teacher_id), teacherName: String(r.teacher_name),
    teacherUserId: r.teacher_user_id == null ? null : Number(r.teacher_user_id),
    date: String(r.date), startTime: String(r.start_time), endTime: String(r.end_time),
    subject: String(r.subject), mode: String(r.mode), message: String(r.message),
    status: r.status as BookingStatus, createdAt: String(r.created_at), unread: Number(r.msg_count ?? 0),
  };
}

export function getBooking(id: number): Booking | null {
  const r = getDb().prepare(`${SELECT} WHERE b.id = ?`).get(id) as Row | undefined;
  return r ? toBooking(r) : null;
}

export function bookingsForStudent(studentId: number): Booking[] {
  return (getDb().prepare(`${SELECT} WHERE b.student_id = ? ORDER BY b.date DESC, b.start_time DESC`).all(studentId) as Row[]).map(toBooking);
}

export function bookingsForTeacher(teacherId: string): Booking[] {
  return (getDb()
    .prepare(`${SELECT} WHERE b.teacher_id = ? ORDER BY CASE b.status WHEN 'pending' THEN 0 ELSE 1 END, b.date DESC, b.start_time DESC`)
    .all(teacherId) as Row[]).map(toBooking);
}

export function recentBookings(limit = 20): Booking[] {
  return (getDb().prepare(`${SELECT} ORDER BY b.created_at DESC, b.id DESC LIMIT ?`).all(limit) as Row[]).map(toBooking);
}

/** Risk R4: true if the teacher already has a pending/accepted booking overlapping this time. */
export function hasClash(teacherId: string, date: string, start: string, end: string, ignoreId?: number) {
  const r = getDb()
    .prepare(
      `SELECT id FROM bookings WHERE teacher_id = ? AND date = ? AND status IN ('pending','accepted')
       AND start_time < ? AND end_time > ? AND id != ?`
    )
    .get(teacherId, date, end, start, ignoreId ?? -1);
  return Boolean(r);
}

export function getMessages(bookingId: number): Message[] {
  return (getDb()
    .prepare(
      `SELECT m.*, u.name AS sender_name FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.booking_id = ? ORDER BY m.created_at, m.id`
    )
    .all(bookingId) as Row[]).map((r) => ({
    id: Number(r.id), bookingId: Number(r.booking_id), senderId: Number(r.sender_id),
    senderName: String(r.sender_name), body: String(r.body), createdAt: String(r.created_at),
  }));
}

/** Weekday short name ("Mon") for a YYYY-MM-DD date. */
export function weekday(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function todayISO() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 3600 * 1000);
  return ist.toISOString().slice(0, 10);
}
