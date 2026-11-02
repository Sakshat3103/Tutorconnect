import { getDb } from "./db";

export type TeachingMode = "Home Tuition" | "Online" | "At Tutor's Place";
export const TEACHING_MODES: TeachingMode[] = ["Home Tuition", "Online", "At Tutor's Place"];
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Same shape the original UI components use, plus the numeric fields needed for filtering. */
export interface Teacher {
  id: string;
  userId: number | null;
  name: string;
  photo: string;
  qualification: string;
  experienceYears: number;
  subjects: string[];
  classes: string;
  classMin: number;
  classMax: number;
  area: string;
  city: string;
  teachingModes: TeachingMode[];
  feeRange: string;
  feeMin: number;
  feeMax: number;
  rating: number;
  reviewsCount: number;
  languages: string[];
  bio: string;
  achievements: string[];
  availableDays: string[];
  phone: string;
  whatsapp: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  verified: boolean;
  qualificationVerified: boolean;
  responseTimeHours: number;
  createdAt: string;
}

export interface Slot {
  id: number;
  teacherId: string;
  day: string;
  startTime: string;
  endTime: string;
}

export interface Review {
  id: number;
  teacherId: string;
  studentId: number;
  studentName: string;
  rating: number;
  comment: string;
  hidden: boolean;
  createdAt: string;
}

type Row = Record<string, unknown>;

const SELECT = `
  SELECT t.*,
    COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.teacher_id = t.id AND r.hidden = 0), 0) AS rating,
    (SELECT COUNT(*) FROM reviews r WHERE r.teacher_id = t.id AND r.hidden = 0) AS reviews_count
  FROM teachers t`;

const classLabel = (min: number, max: number) => (min === max ? `Class ${min}` : `Class ${min} - ${max}`);
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function toTeacher(r: Row): Teacher {
  const j = (v: unknown) => JSON.parse(String(v ?? "[]"));
  const feeMin = Number(r.fee_min), feeMax = Number(r.fee_max);
  return {
    id: String(r.id),
    userId: r.user_id == null ? null : Number(r.user_id),
    name: String(r.name),
    photo: String(r.photo ?? ""),
    qualification: String(r.qualification),
    experienceYears: Number(r.experience_years),
    subjects: j(r.subjects),
    classes: classLabel(Number(r.class_min), Number(r.class_max)),
    classMin: Number(r.class_min),
    classMax: Number(r.class_max),
    area: String(r.area),
    city: String(r.city),
    teachingModes: j(r.teaching_modes),
    feeRange: feeMin === feeMax ? `${rupees(feeMin)}/hr` : `${rupees(feeMin)} - ${rupees(feeMax)}/hr`,
    feeMin,
    feeMax,
    rating: Number(r.rating ?? 0),
    reviewsCount: Number(r.reviews_count ?? 0),
    languages: j(r.languages),
    bio: String(r.bio ?? ""),
    achievements: j(r.achievements),
    availableDays: j(r.available_days),
    phone: String(r.phone ?? ""),
    whatsapp: String(r.whatsapp ?? ""),
    email: String(r.email ?? ""),
    status: r.status as Teacher["status"],
    verified: r.status === "approved",
    qualificationVerified: Boolean(r.qualification_verified),
    responseTimeHours: Number(r.response_time_hours),
    createdAt: String(r.created_at),
  };
}

export interface TeacherFilters {
  q?: string;
  subject?: string;
  grade?: number;
  location?: string;
  day?: string;
  mode?: string;
  minExperience?: number;
  maxFee?: number;
  minRating?: number;
  sort?: "rating" | "experience" | "fee_low" | "fee_high" | "newest";
  includeUnapproved?: boolean;
}

/** FR6 + FR7: search and filter by subject, class, location, availability, mode, experience, fees and rating. */
export function searchTeachers(f: TeacherFilters = {}): Teacher[] {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (!f.includeUnapproved) where.push("t.status = 'approved'");
  if (f.q) {
    where.push("(t.name LIKE @q OR t.bio LIKE @q OR t.qualification LIKE @q OR t.subjects LIKE @q)");
    params.q = `%${f.q}%`;
  }
  if (f.subject) {
    where.push("EXISTS (SELECT 1 FROM json_each(t.subjects) WHERE json_each.value = @subject)");
    params.subject = f.subject;
  }
  if (f.grade) {
    where.push("@grade BETWEEN t.class_min AND t.class_max");
    params.grade = f.grade;
  }
  if (f.location) {
    where.push("(t.area LIKE @loc OR t.city LIKE @loc)");
    params.loc = `%${f.location}%`;
  }
  if (f.day) {
    where.push("EXISTS (SELECT 1 FROM slots s WHERE s.teacher_id = t.id AND s.day = @day)");
    params.day = f.day;
  }
  if (f.mode) {
    where.push("EXISTS (SELECT 1 FROM json_each(t.teaching_modes) WHERE json_each.value = @mode)");
    params.mode = f.mode;
  }
  if (f.minExperience) {
    where.push("t.experience_years >= @exp");
    params.exp = f.minExperience;
  }
  if (f.maxFee) {
    where.push("t.fee_min <= @fee");
    params.fee = f.maxFee;
  }
  const order =
    f.sort === "experience" ? "t.experience_years DESC"
    : f.sort === "fee_low" ? "t.fee_min ASC"
    : f.sort === "fee_high" ? "t.fee_max DESC"
    : f.sort === "newest" ? "t.created_at DESC"
    : "rating DESC, reviews_count DESC";
  let sql = `SELECT * FROM (${SELECT}${where.length ? " WHERE " + where.join(" AND ") : ""})`;
  if (f.minRating) {
    sql += " WHERE rating >= @rating";
    params.rating = f.minRating;
  }
  sql += ` ORDER BY ${order.replace(/t\./g, "")}`;
  return (getDb().prepare(sql).all(params) as Row[]).map(toTeacher);
}

export function getTeacher(id: string): Teacher | null {
  const r = getDb().prepare(`${SELECT} WHERE t.id = ?`).get(id) as Row | undefined;
  return r ? toTeacher(r) : null;
}

export function getTeacherByUser(userId: number): Teacher | null {
  const r = getDb().prepare(`${SELECT} WHERE t.user_id = ?`).get(userId) as Row | undefined;
  return r ? toTeacher(r) : null;
}

export function getSlots(teacherId: string): Slot[] {
  const order = `CASE day ${DAYS.map((d, i) => `WHEN '${d}' THEN ${i}`).join(" ")} END, start_time`;
  return (getDb()
    .prepare(`SELECT id, teacher_id, day, start_time, end_time FROM slots WHERE teacher_id = ? ORDER BY ${order}`)
    .all(teacherId) as Row[]).map((r) => ({
    id: Number(r.id), teacherId: String(r.teacher_id), day: String(r.day),
    startTime: String(r.start_time), endTime: String(r.end_time),
  }));
}

/** Keeps teachers.available_days in sync with their slots. */
export function syncAvailableDays(teacherId: string) {
  const days = [...new Set(getSlots(teacherId).map((s) => s.day))];
  getDb().prepare("UPDATE teachers SET available_days = ? WHERE id = ?").run(JSON.stringify(days), teacherId);
}

export function getReviews(teacherId: string, includeHidden = false): Review[] {
  return (getDb()
    .prepare(
      `SELECT r.*, u.name AS student_name FROM reviews r JOIN users u ON u.id = r.student_id
       WHERE r.teacher_id = ? ${includeHidden ? "" : "AND r.hidden = 0"} ORDER BY r.created_at DESC, r.id DESC`
    )
    .all(teacherId) as Row[]).map((r) => ({
    id: Number(r.id), teacherId: String(r.teacher_id), studentId: Number(r.student_id),
    studentName: String(r.student_name), rating: Number(r.rating), comment: String(r.comment),
    hidden: Boolean(r.hidden), createdAt: String(r.created_at),
  }));
}

export function allSubjects(): string[] {
  const rows = getDb()
    .prepare("SELECT DISTINCT json_each.value AS s FROM teachers, json_each(teachers.subjects) WHERE status='approved' ORDER BY s")
    .all() as { s: string }[];
  return rows.map((r) => r.s);
}

export function slugify(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "teacher";
  const db = getDb();
  let id = base, n = 2;
  while (db.prepare("SELECT 1 FROM teachers WHERE id = ?").get(id)) id = `${base}-${n++}`;
  return id;
}
