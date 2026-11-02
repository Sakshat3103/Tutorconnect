/**
 * EduBridge / TutorConnect — unit tests (Phase 4).
 * Run: npx tsx --test tests/unit.test.ts   (uses a fresh temporary database)
 */
import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "edubridge-unit-"));
process.chdir(tmp); // db.ts creates data/ relative to cwd
process.env.SEED_DEMO = "1"; // tests run against the sample data

type Mods = {
  db: typeof import("../lib/db");
  t: typeof import("../lib/teachers");
  b: typeof import("../lib/bookings");
  r: typeof import("../lib/recommend");
  v: typeof import("../lib/validate");
  a: typeof import("../lib/auth");
};
let m: Mods;
const results: { id: string; name: string; ok: boolean; actual: string }[] = [];

function tc(id: string, name: string, fn: () => unknown | Promise<unknown>) {
  test(`${id} ${name}`, async () => {
    try {
      const actual = await fn();
      results.push({ id, name, ok: true, actual: String(actual ?? "As expected") });
    } catch (e) {
      results.push({ id, name, ok: false, actual: (e as Error).message });
      throw e;
    }
  });
}

before(async () => {
  m = {
    db: await import("../lib/db"),
    t: await import("../lib/teachers"),
    b: await import("../lib/bookings"),
    r: await import("../lib/recommend"),
    v: await import("../lib/validate"),
    a: await import("../lib/auth"),
  };
  m.db.getDb();
});

process.on("exit", () => {
  fs.writeFileSync(process.env.UNIT_OUT ?? "/tmp/unit-results.json", JSON.stringify(results, null, 2));
});

const addBooking = (date: string, start: string, end: string, status = "pending") =>
  Number(m.db.getDb().prepare(
    "INSERT INTO bookings (student_id, teacher_id, date, start_time, end_time, subject, mode, status) VALUES ((SELECT id FROM users WHERE email='aarav@example.com'), 'priya-sharma', ?, ?, ?, 'Physics', 'Online', ?)"
  ).run(date, start, end, status).lastInsertRowid);

// ---- Date helper ----
tc("UT-01", "weekday() returns correct day name", () => {
  assert.equal(m.b.weekday("2026-10-19"), "Mon");
  assert.equal(m.b.weekday("2026-11-01"), "Sun");
  assert.equal(m.b.weekday("2028-02-29"), "Tue");
  return "Mon, Sun, Tue (leap day) returned correctly";
});

// ---- Booking clash detection (Risk R4) ----
tc("UT-02", "hasClash() detects identical slot already pending", () => {
  addBooking("2030-01-07", "17:00", "18:00");
  assert.equal(m.b.hasClash("priya-sharma", "2030-01-07", "17:00", "18:00"), true);
  return "true (clash detected)";
});
tc("UT-03", "hasClash() detects partial overlap", () => {
  assert.equal(m.b.hasClash("priya-sharma", "2030-01-07", "17:30", "18:30"), true);
  return "true (17:30–18:30 overlaps 17:00–18:00)";
});
tc("UT-04", "hasClash() allows back-to-back slots", () => {
  assert.equal(m.b.hasClash("priya-sharma", "2030-01-07", "18:00", "19:00"), false);
  return "false (no clash)";
});
tc("UT-05", "hasClash() ignores cancelled/rejected bookings", () => {
  addBooking("2030-01-14", "17:00", "18:00", "cancelled");
  addBooking("2030-01-14", "17:00", "18:00", "rejected");
  assert.equal(m.b.hasClash("priya-sharma", "2030-01-14", "17:00", "18:00"), false);
  return "false (inactive bookings ignored)";
});
tc("UT-06", "hasClash() excludes the booking being accepted", () => {
  const id = addBooking("2030-01-21", "17:00", "18:00");
  assert.equal(m.b.hasClash("priya-sharma", "2030-01-21", "17:00", "18:00", id), false);
  return "false (self excluded)";
});

// ---- Search & filtering (FR6/FR7) ----
tc("UT-07", "searchTeachers() subject filter", () => {
  const r = m.t.searchTeachers({ subject: "Physics" });
  assert.ok(r.length > 0 && r.every((t) => t.subjects.includes("Physics")));
  return `${r.length} tutors, all teach Physics`;
});
tc("UT-08", "searchTeachers() class filter", () => {
  const r = m.t.searchTeachers({ grade: 4 });
  assert.ok(r.length > 0 && r.every((t) => t.classMin <= 4 && t.classMax >= 4));
  return `${r.length} tutors, all cover Class 4`;
});
tc("UT-09", "searchTeachers() fee, experience and rating filters", () => {
  const fee = m.t.searchTeachers({ maxFee: 600 });
  const exp = m.t.searchTeachers({ minExperience: 10 });
  const rat = m.t.searchTeachers({ minRating: 4.8 });
  assert.ok(fee.every((t) => t.feeMin <= 600));
  assert.ok(exp.every((t) => t.experienceYears >= 10));
  assert.ok(rat.every((t) => t.rating >= 4.8));
  return `fee≤600: ${fee.length}, exp≥10: ${exp.length}, rating≥4.8: ${rat.length}`;
});
tc("UT-10", "searchTeachers() combined filters", () => {
  const r = m.t.searchTeachers({ subject: "Mathematics", grade: 11, mode: "Home Tuition", location: "Koramangala" });
  assert.deepEqual(r.map((t) => t.id), ["priya-sharma"]);
  return "1 result: Priya Sharma";
});
tc("UT-11", "searchTeachers() hides unverified teachers", () => {
  const pub = m.t.searchTeachers({}).map((t) => t.id);
  const all = m.t.searchTeachers({ includeUnapproved: true }).map((t) => t.id);
  assert.ok(!pub.includes("rohan-mehta") && all.includes("rohan-mehta"));
  return `public: ${pub.length}, admin view: ${all.length}`;
});
tc("UT-12", "searchTeachers() is safe against SQL injection in text search", () => {
  const r = m.t.searchTeachers({ q: "' OR 1=1 --" });
  assert.equal(r.length, 0);
  assert.ok(m.t.searchTeachers({}).length > 0);
  return "0 results, tables intact";
});

// ---- AI recommendation (FR8/FR15) ----
const ideal = {
  subjects: ["Physics", "Mathematics"], grade: 11, area: "Koramangala", city: "Bengaluru", mode: "Home Tuition",
  budgetMax: 1200, preferredDays: ["Mon", "Wed"], goals: "JEE mains, weak in mechanics numericals",
};
tc("UT-13", "recommend() ranks the best-fitting tutor first", () => {
  const r = m.r.recommend(ideal);
  assert.equal(r[0].teacher.id, "priya-sharma");
  assert.ok(r[0].score >= 90);
  return `Top: ${r[0].teacher.name} (${r[0].score}/100)`;
});
tc("UT-14", "recommend() scores stay within 0–100 and match breakdown", () => {
  const r = m.r.recommend(ideal, 20);
  for (const x of r) {
    const sum = x.breakdown.reduce((s, b) => s + b.points, 0);
    assert.ok(x.score >= 0 && x.score <= 100);
    assert.ok(Math.abs(sum - x.score) <= 1);
    assert.ok(x.breakdown.every((b) => b.points >= 0 && b.points <= b.max));
  }
  return `${r.length} results checked`;
});
tc("UT-15", "recommend() results sorted by score (descending)", () => {
  const s = m.r.recommend(ideal, 20).map((x) => x.score);
  assert.deepEqual(s, [...s].sort((a, b) => b - a));
  return s.join(", ");
});
tc("UT-16", "recommend() excludes tutors without any requested subject", () => {
  const r = m.r.recommend({ ...ideal, subjects: ["Chemistry"] }, 20);
  assert.ok(r.length > 0 && r.every((x) => x.teacher.subjects.includes("Chemistry")));
  return `${r.length} results, all teach Chemistry`;
});
tc("UT-17", "recommend() returns empty list for unknown subject", () => {
  assert.equal(m.r.recommend({ ...ideal, subjects: ["Astrophysics"] }).length, 0);
  return "[] returned";
});
tc("UT-18", "recommend() flags tutors above budget", () => {
  const r = m.r.recommend({ ...ideal, budgetMax: 300 }, 20);
  const p = r.find((x) => x.teacher.id === "priya-sharma")!;
  assert.equal(p.breakdown.find((b) => b.label === "Budget")!.points, 0);
  assert.ok(p.caveats.some((c) => c.includes("budget")));
  return `Budget points 0; caveat: "${p.caveats.find((c) => c.includes("budget"))}"`;
});
tc("UT-19", "recommend() goal-text similarity rewards matching bios", () => {
  const r = m.r.recommend({ subjects: ["Chemistry"], grade: null, area: "", city: "", mode: "", budgetMax: null, preferredDays: [], goals: "NEET organic chemistry reaction mechanisms" }, 20);
  assert.equal(r[0].teacher.id, "vikram-singh");
  return `Top: ${r[0].teacher.name}`;
});

// ---- Input validation ----
const validTeacher = {
  name: "Test Tutor", phone: "9999999999", qualification: "B.Sc", experienceYears: 2, subjects: ["Physics"],
  classMin: 6, classMax: 10, area: "Hebbal", city: "Bengaluru", teachingModes: ["Online"], feeMin: 400, feeMax: 600,
  bio: "Physics tutor", slots: [{ day: "Mon", start: "17:00", end: "18:00" }],
};
tc("UT-20", "parseTeacherInput() accepts a valid profile", () => {
  const v = m.v.parseTeacherInput(validTeacher);
  assert.equal(v.slots.length, 1);
  return "Parsed with 1 slot";
});
tc("UT-21", "parseTeacherInput() rejects invalid class range", () => {
  assert.throws(() => m.v.parseTeacherInput({ ...validTeacher, classMin: 10, classMax: 6 }), /class range/);
  return 'Error: "Choose a valid class range (1-12)"';
});
tc("UT-22", "parseTeacherInput() rejects fee max below fee min", () => {
  assert.throws(() => m.v.parseTeacherInput({ ...validTeacher, feeMin: 800, feeMax: 500 }), /fee range/);
  return 'Error: "Enter a valid fee range"';
});
tc("UT-23", "parseTeacherInput() drops invalid time slots", () => {
  const v = m.v.parseTeacherInput({ ...validTeacher, slots: [{ day: "Mon", start: "18:00", end: "17:00" }, { day: "Funday", start: "10:00", end: "11:00" }] });
  assert.equal(v.slots.length, 0);
  return "0 slots kept (end<start, invalid day)";
});
tc("UT-24", "slugify() creates unique profile IDs", () => {
  assert.equal(m.t.slugify("Priya Sharma"), "priya-sharma-2");
  assert.equal(m.t.slugify("New Tutor!"), "new-tutor");
  return "priya-sharma-2, new-tutor";
});
tc("UT-25", "Password hashing (bcrypt)", async () => {
  const h = await m.a.hashPassword("secret123");
  assert.ok(h.startsWith("$2") && h !== "secret123");
  assert.equal(await m.a.verifyPassword("secret123", h), true);
  assert.equal(await m.a.verifyPassword("wrong", h), false);
  return "Hash ≠ password; correct=true, wrong=false";
});

// ---- White-box: basis-path tests for recommend() scoring rules ----
const base = { subjects: ["Mathematics"], grade: null as number | null, area: "", city: "", mode: "", budgetMax: null as number | null, preferredDays: [] as string[], goals: "" };
const pts = (needs: typeof base, id: string, label: string) =>
  m.r.recommend(needs, 50).find((x) => x.teacher.id === id)!.breakdown.find((b) => b.label === label)!.points;
// Priya Sharma: Class 9–12, fee ₹800–1,200
tc("WB-01", "Class fit, path 1: no class given → 7.5", () => { assert.equal(pts(base, "priya-sharma", "Class fit"), 7.5); return "7.5"; });
tc("WB-02", "Class fit, path 2: class inside range → 15", () => { assert.equal(pts({ ...base, grade: 10 }, "priya-sharma", "Class fit"), 15); return "15"; });
tc("WB-03", "Class fit, path 3: class one outside range → 6", () => { assert.equal(pts({ ...base, grade: 8 }, "priya-sharma", "Class fit"), 6); return "6"; });
tc("WB-04", "Class fit, path 4: class far outside range → 0", () => { assert.equal(pts({ ...base, grade: 3 }, "priya-sharma", "Class fit"), 0); return "0"; });
tc("WB-05", "Budget, path 1: no budget given → 5", () => { assert.equal(pts(base, "priya-sharma", "Budget"), 5); return "5"; });
tc("WB-06", "Budget, path 2: max fee within budget → 10", () => { assert.equal(pts({ ...base, budgetMax: 1500 }, "priya-sharma", "Budget"), 10); return "10"; });
tc("WB-07", "Budget, path 3: only min fee within budget → 7", () => { assert.equal(pts({ ...base, budgetMax: 1000 }, "priya-sharma", "Budget"), 7); return "7"; });
tc("WB-08", "Budget, path 4: min fee ≤ 125% of budget → 3", () => { assert.equal(pts({ ...base, budgetMax: 700 }, "priya-sharma", "Budget"), 3); return "3"; });
tc("WB-09", "Budget, path 5: far above budget → 0", () => { assert.equal(pts({ ...base, budgetMax: 400 }, "priya-sharma", "Budget"), 0); return "0"; });
