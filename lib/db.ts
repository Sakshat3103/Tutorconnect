import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { seedTeachers, seedStudents, seedReviews } from "./seed";

/**
 * SQLite database (file: data/tutorconnect.db), created automatically the first time the app runs.
 * A new database contains only the admin account (ADMIN_EMAIL / ADMIN_PASSWORD in .env.local).
 * Set SEED_DEMO=1 (or run `npm run dev:demo`) to also load sample teachers, students and reviews.
 * Delete the data/ folder (or run `npm run reset-db`) to start fresh.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "tutorconnect.db");

declare global {
  // eslint-disable-next-line no-var
  var __tcdb: Database.Database | undefined;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('student','parent','teacher','admin')),
  phone         TEXT,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- FR3: learning requirements / preferences of a student or parent
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id        INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  student_name   TEXT,
  grade          INTEGER,
  subjects       TEXT NOT NULL DEFAULT '[]',
  area           TEXT,
  city           TEXT,
  mode           TEXT,
  budget_max     INTEGER,
  preferred_days TEXT NOT NULL DEFAULT '[]',
  goals          TEXT,
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- FR4: teacher profiles. status = pending until an admin verifies it (FR5)
CREATE TABLE IF NOT EXISTS teachers (
  id                     TEXT PRIMARY KEY,
  user_id                INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  photo                  TEXT NOT NULL DEFAULT '',
  qualification          TEXT NOT NULL,
  experience_years       INTEGER NOT NULL DEFAULT 0,
  subjects               TEXT NOT NULL DEFAULT '[]',
  class_min              INTEGER NOT NULL DEFAULT 1,
  class_max              INTEGER NOT NULL DEFAULT 12,
  area                   TEXT NOT NULL,
  city                   TEXT NOT NULL,
  teaching_modes         TEXT NOT NULL DEFAULT '[]',
  fee_min                INTEGER NOT NULL DEFAULT 0,
  fee_max                INTEGER NOT NULL DEFAULT 0,
  languages              TEXT NOT NULL DEFAULT '[]',
  bio                    TEXT NOT NULL DEFAULT '',
  achievements           TEXT NOT NULL DEFAULT '[]',
  available_days         TEXT NOT NULL DEFAULT '[]',
  phone                  TEXT NOT NULL DEFAULT '',
  whatsapp               TEXT NOT NULL DEFAULT '',
  email                  TEXT NOT NULL DEFAULT '',
  status                 TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  qualification_verified INTEGER NOT NULL DEFAULT 0,
  response_time_hours    INTEGER NOT NULL DEFAULT 24,
  created_at             TEXT NOT NULL DEFAULT (datetime('now'))
);

-- FR9: weekly time slots a teacher is available
CREATE TABLE IF NOT EXISTS slots (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  day        TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time   TEXT NOT NULL,
  UNIQUE (teacher_id, day, start_time)
);

-- FR10/FR11: booking requests
CREATE TABLE IF NOT EXISTS bookings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time   TEXT NOT NULL,
  subject    TEXT NOT NULL,
  mode       TEXT NOT NULL,
  message    TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled','completed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- FR12: messages between student and teacher, per booking
CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- FR13: one review per student per teacher
CREATE TABLE IF NOT EXISTS reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT NOT NULL DEFAULT '',
  hidden     INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (teacher_id, student_id)
);

-- FR14: activity log for the admin dashboard
CREATE TABLE IF NOT EXISTS activity (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER,
  action     TEXT NOT NULL,
  detail     TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_teacher ON bookings(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_student ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_teacher ON reviews(teacher_id);
`;

function seed(db: Database.Database) {
  const insertUser = db.prepare(
    "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)"
  );
  const insertTeacher = db.prepare(`
    INSERT INTO teachers (id, user_id, name, photo, qualification, experience_years, subjects, class_min, class_max,
      area, city, teaching_modes, fee_min, fee_max, languages, bio, achievements, available_days, phone, whatsapp,
      email, status, qualification_verified, response_time_hours)
    VALUES (@id, @user_id, @name, @photo, @qualification, @experience_years, @subjects, @class_min, @class_max,
      @area, @city, @teaching_modes, @fee_min, @fee_max, @languages, @bio, @achievements, @available_days, @phone,
      @whatsapp, @email, @status, @qualification_verified, @response_time_hours)`);
  const insertSlot = db.prepare(
    "INSERT OR IGNORE INTO slots (teacher_id, day, start_time, end_time) VALUES (?, ?, ?, ?)"
  );
  const insertProfile = db.prepare(`
    INSERT INTO student_profiles (user_id, student_name, grade, subjects, area, city, mode, budget_max, preferred_days, goals)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertReview = db.prepare(
    "INSERT OR IGNORE INTO reviews (teacher_id, student_id, rating, comment) VALUES (?, ?, ?, ?)"
  );

  const pw = (p: string) => bcrypt.hashSync(p, 10);
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@tutorconnect.in").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(`[db] No ADMIN_PASSWORD set - created admin ${adminEmail} with the default password. Change it before going live.`);
  }

  db.transaction(() => {
    insertUser.run("Platform Admin", adminEmail, pw(adminPassword), "admin", "");
    if (process.env.SEED_DEMO !== "1") return; // real launch: no sample data

    for (const t of seedTeachers) {
      const u = insertUser.run(t.name, t.email, pw("teacher123"), "teacher", t.phone);
      insertTeacher.run({
        ...t,
        user_id: u.lastInsertRowid,
        subjects: JSON.stringify(t.subjects),
        teaching_modes: JSON.stringify(t.teaching_modes),
        languages: JSON.stringify(t.languages),
        achievements: JSON.stringify(t.achievements),
        available_days: JSON.stringify(t.slots.map((s) => s[0]).filter((d, i, a) => a.indexOf(d) === i)),
        qualification_verified: t.status === "approved" ? 1 : 0,
      });
      for (const [day, start, end] of t.slots) insertSlot.run(t.id, day, start, end);
    }

    const studentIds: number[] = [];
    for (const s of seedStudents) {
      const u = insertUser.run(s.name, s.email, pw("student123"), s.role, "");
      studentIds.push(Number(u.lastInsertRowid));
      insertProfile.run(
        u.lastInsertRowid, s.student_name, s.grade, JSON.stringify(s.subjects), s.area, s.city,
        s.mode, s.budget_max, JSON.stringify(s.preferred_days), s.goals
      );
    }

    for (const [teacherId, studentIndex, rating, comment] of seedReviews) {
      insertReview.run(teacherId, studentIds[studentIndex], rating, comment);
    }
  })();
}

export function getDb(): Database.Database {
  if (global.__tcdb) return global.__tcdb;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const isNew = !fs.existsSync(DB_FILE);
  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  if (isNew || (db.prepare("SELECT COUNT(*) c FROM users").get() as { c: number }).c === 0) seed(db);
  global.__tcdb = db;
  return db;
}

export function logActivity(userId: number | null, action: string, detail = "") {
  getDb().prepare("INSERT INTO activity (user_id, action, detail) VALUES (?, ?, ?)").run(userId, action, detail);
}
