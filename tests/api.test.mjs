/**
 * EduBridge / TutorConnect — integration, system, boundary-value, security and performance tests (Phase 4).
 * Start a fresh server with sample data first:  rm -rf data && npm run build && SEED_DEMO=1 npx next start -p 3200
 * Then run:                    node tests/api.test.mjs
 */
import fs from "fs";
import Database from "better-sqlite3";

const B = process.env.BASE_URL ?? "http://localhost:3200";
const OUT = process.env.API_OUT ?? "/tmp/api-results.json";
const results = [];
const perf = [];

class Client {
  constructor() { this.cookie = ""; }
  async req(method, path, body, raw = false) {
    const res = await fetch(B + path, {
      method, redirect: "manual",
      headers: { "Content-Type": "application/json", ...(this.cookie ? { Cookie: this.cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const sc = res.headers.get("set-cookie");
    if (sc) { this.lastSetCookie = sc; this.cookie = sc.split(";")[0]; }
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch {}
    return { status: res.status, json, text, headers: res.headers };
  }
  get(p) { return this.req("GET", p); }
  post(p, b) { return this.req("POST", p, b ?? {}); }
  put(p, b) { return this.req("PUT", p, b ?? {}); }
  patch(p, b) { return this.req("PATCH", p, b ?? {}); }
  del(p) { return this.req("DELETE", p); }
  async login(email, password) { return this.post("/api/auth/login", { email, password }); }
}

async function tc(id, name, fn) {
  try {
    const actual = await fn();
    results.push({ id, name, ok: true, actual: String(actual) });
    console.log(`PASS ${id} ${name} — ${actual}`);
  } catch (e) {
    results.push({ id, name, ok: false, actual: e.message });
    console.log(`FAIL ${id} ${name} — ${e.message}`);
  }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const err = (r) => `${r.status} "${r.json?.error ?? ""}"`;

// IST-based dates (the app uses IST for "today")
const ist = () => new Date(Date.now() + 5.5 * 3600e3);
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (n) => iso(new Date(ist().getTime() + n * 864e5));
const nextDow = (dow, after = 1) => { for (let i = after; ; i++) { const d = new Date(ist().getTime() + i * 864e5); if (d.getUTCDay() === dow) return iso(d); } };

const anon = new Client(), stu = new Client(), stu2 = new Client(), tea = new Client(), adm = new Client(), newT = new Client();
let bookingId, monSlot;

// ======================= INTEGRATION (IT) =======================
await tc("IT-01", "Student sign-up creates account and session", async () => {
  const r = await stu.post("/api/auth/signup", { name: "Riya Test", email: "riya@test.com", password: "secret12", role: "student" });
  expect(r.status === 201 && r.json.user.role === "student", err(r));
  const me = await stu.get("/api/auth/me");
  expect(me.json.user?.email === "riya@test.com", "session missing");
  return `201 Created; session for riya@test.com`;
});
await tc("IT-02", "Duplicate e-mail rejected at sign-up", async () => {
  const r = await anon.post("/api/auth/signup", { name: "X", email: "riya@test.com", password: "secret12", role: "student" });
  expect(r.status === 409, err(r)); return err(r);
});
await tc("IT-03", "Login with wrong password rejected", async () => {
  const r = await new Client().login("riya@test.com", "wrongpass"); expect(r.status === 401, err(r)); return err(r);
});
await tc("IT-04", "Login and logout", async () => {
  const c = new Client();
  const r = await c.login("riya@test.com", "secret12"); expect(r.status === 200, err(r));
  await c.post("/api/auth/logout");
  c.cookie = c.lastSetCookie?.split(";")[0] ?? "";
  const me = await c.get("/api/auth/me");
  expect(me.json.user === null, "still logged in");
  return "200 OK; /me returns null after logout";
});
await tc("IT-05", "Student saves learning profile (FR3)", async () => {
  const r = await stu.put("/api/profile", { grade: "11", subjects: ["Physics", "Mathematics"], area: "Koramangala", city: "Bengaluru", mode: "Home Tuition", budgetMax: "1200", preferredDays: ["Mon", "Wed"], goals: "JEE mechanics" });
  expect(r.status === 200 && r.json.profile.grade === 11, err(r));
  const g = await stu.get("/api/profile"); expect(g.json.profile.subjects.length === 2, "not persisted");
  return "200 OK; profile persisted";
});
await tc("IT-06", "Search API with filters (FR6/FR7)", async () => {
  const r = await anon.get("/api/teachers?subject=Mathematics&grade=11&mode=Home%20Tuition&location=Koramangala");
  expect(r.status === 200 && r.json.teachers.length === 1, err(r));
  return `200 OK; 1 tutor (${r.json.teachers[0].name})`;
});
await tc("IT-07", "Recommendation API returns ranked list (FR8/FR15)", async () => {
  const r = await anon.post("/api/recommend", { subjects: ["Physics", "Mathematics"], grade: 11, area: "Koramangala", city: "Bengaluru", mode: "Home Tuition", budgetMax: 1200, preferredDays: ["Mon", "Wed"], goals: "JEE mechanics numericals" });
  expect(r.status === 200 && r.json.results[0].teacher.id === "priya-sharma", err(r));
  return `200 OK; top = ${r.json.results[0].teacher.name} (${r.json.results[0].score}), ${r.json.results.length} results`;
});
await tc("IT-08", "Student sends booking request (FR10)", async () => {
  const slots = (await anon.get("/api/slots?teacherId=priya-sharma")).json.slots;
  monSlot = slots.find((s) => s.day === "Mon");
  const r = await stu.post("/api/bookings", { teacherId: "priya-sharma", slotId: monSlot.id, date: nextDow(1), subject: "Physics", mode: "Online", message: "Mechanics help" });
  expect(r.status === 201 && r.json.booking.status === "pending", err(r));
  bookingId = r.json.booking.id;
  return `201 Created; booking #${bookingId} pending on ${nextDow(1)}`;
});
await tc("IT-09", "Second request for same slot/date blocked (Risk R4)", async () => {
  await stu2.post("/api/auth/signup", { name: "Second Student", email: "s2@test.com", password: "secret12", role: "student" });
  const r = await stu2.post("/api/bookings", { teacherId: "priya-sharma", slotId: monSlot.id, date: nextDow(1), subject: "Physics", mode: "Online" });
  expect(r.status === 409, err(r)); return err(r);
});
await tc("IT-10", "Booking on a date that doesn't match the slot's weekday rejected", async () => {
  const r = await stu2.post("/api/bookings", { teacherId: "priya-sharma", slotId: monSlot.id, date: nextDow(2), subject: "Physics", mode: "Online" });
  expect(r.status === 400, err(r)); return err(r);
});
await tc("IT-11", "Booking a subject the tutor doesn't teach rejected", async () => {
  const r = await stu2.post("/api/bookings", { teacherId: "priya-sharma", slotId: monSlot.id, date: nextDow(1, 8), subject: "Biology", mode: "Online" });
  expect(r.status === 400, err(r)); return err(r);
});
await tc("IT-12", "Student cannot accept own booking", async () => {
  const r = await stu.patch(`/api/bookings/${bookingId}`, { action: "accept" }); expect(r.status === 403, err(r)); return err(r);
});
await tc("IT-13", "Review blocked before tutor accepts (FR13)", async () => {
  const r = await stu.post("/api/reviews", { teacherId: "priya-sharma", rating: 5, comment: "Great" }); expect(r.status === 403, err(r)); return err(r);
});
await tc("IT-14", "Tutor accepts booking request (FR11)", async () => {
  await tea.login("priya.sharma@tutorconnect.in", "teacher123");
  const list = await tea.get("/api/bookings");
  expect(list.json.bookings.some((b) => b.id === bookingId), "request not visible to tutor");
  const r = await tea.patch(`/api/bookings/${bookingId}`, { action: "accept" });
  expect(r.status === 200 && r.json.booking.status === "accepted", err(r));
  return "Request visible to tutor; status → accepted";
});
await tc("IT-15", "Student and tutor exchange messages (FR12)", async () => {
  await stu.post(`/api/bookings/${bookingId}/messages`, { body: "Hello ma'am" });
  const r = await tea.post(`/api/bookings/${bookingId}/messages`, { body: "See you Monday" });
  expect(r.status === 201 && r.json.messages.length === 2, err(r));
  return `2 messages in thread`;
});
await tc("IT-16", "Third party cannot read the conversation", async () => {
  const r = await stu2.get(`/api/bookings/${bookingId}/messages`); expect(r.status === 403, err(r)); return err(r);
});
await tc("IT-17", "Review accepted after booking accepted; rating updates (FR13)", async () => {
  const before = (await anon.get("/api/teachers?q=Priya")).json.teachers[0];
  const r = await stu.post("/api/reviews", { teacherId: "priya-sharma", rating: 3, comment: "Good class" });
  expect(r.status === 201, err(r));
  const after = (await anon.get("/api/teachers?q=Priya")).json.teachers[0];
  expect(after.reviewsCount === before.reviewsCount + 1, "count not updated");
  return `201; rating ${before.rating}→${after.rating}, reviews ${before.reviewsCount}→${after.reviewsCount}`;
});
await tc("IT-18", "Tutor marks class completed; student cancels pending booking", async () => {
  const r = await tea.patch(`/api/bookings/${bookingId}`, { action: "complete" });
  expect(r.json?.booking?.status === "completed", err(r));
  const b2 = await stu.post("/api/bookings", { teacherId: "priya-sharma", slotId: monSlot.id, date: nextDow(1, 8), subject: "Physics", mode: "Online" });
  const c = await stu.patch(`/api/bookings/${b2.json.booking.id}`, { action: "cancel" });
  expect(c.json?.booking?.status === "cancelled", err(c));
  return "completed; cancelled";
});
await tc("IT-19", "Tutor adds and removes availability slot (FR9)", async () => {
  const a = await tea.post("/api/slots", { day: "Sun", start: "15:00", end: "16:00" });
  expect(a.status === 201, err(a));
  const id = a.json.slots.find((s) => s.day === "Sun").id;
  const ov = await tea.post("/api/slots", { day: "Sun", start: "15:30", end: "16:30" });
  expect(ov.status === 409, "overlap allowed");
  const d = await tea.del(`/api/slots?id=${id}`);
  expect(!d.json.slots.some((s) => s.id === id), "not removed");
  return "added (201), overlap rejected (409), removed";
});
await tc("IT-20", "Teacher registration creates pending profile (FR1/FR4/FR5)", async () => {
  await newT.post("/api/auth/signup", { name: "Kavya Rao", email: "kavya@test.com", password: "secret12", role: "teacher" });
  const r = await newT.post("/api/teachers", { name: "Kavya Rao", phone: "9876500000", qualification: "M.Sc Chemistry", experienceYears: 3, subjects: ["Chemistry"], classMin: 9, classMax: 12, area: "Hebbal", city: "Bengaluru", teachingModes: ["Online"], feeMin: 500, feeMax: 800, bio: "Chemistry with experiments", slots: [{ day: "Tue", start: "18:00", end: "19:00" }] });
  expect(r.status === 201, err(r));
  const s = await anon.get("/api/teachers?q=Kavya");
  expect(s.json.teachers.length === 0, "visible before approval");
  return `201; id=${r.json.id}; hidden from search`;
});
await tc("IT-21", "Admin approves teacher; profile becomes searchable (FR5)", async () => {
  await adm.login("admin@tutorconnect.in", "admin123");
  const r = await adm.patch("/api/admin/teachers/kavya-rao", { status: "approved" });
  expect(r.status === 200, err(r));
  const s = await anon.get("/api/teachers?q=Kavya");
  expect(s.json.teachers.length === 1, "not visible");
  return "200; now appears in search";
});
await tc("IT-22", "Admin hides inappropriate review (FR14)", async () => {
  const db = new Database("data/tutorconnect.db", { readonly: true });
  const rid = db.prepare("SELECT id FROM reviews WHERE comment='Good class'").get().id; db.close();
  const before = (await anon.get("/api/teachers?q=Priya")).json.teachers[0].reviewsCount;
  const r = await adm.patch(`/api/admin/reviews/${rid}`, { hidden: true });
  const after = (await anon.get("/api/teachers?q=Priya")).json.teachers[0].reviewsCount;
  expect(r.status === 200 && after === before - 1, err(r));
  return `review hidden; public count ${before}→${after}`;
});
await tc("IT-23", "Admin deactivates user; session and login blocked (FR14)", async () => {
  const db = new Database("data/tutorconnect.db", { readonly: true });
  const uid = db.prepare("SELECT id FROM users WHERE email='s2@test.com'").get().id; db.close();
  await adm.patch(`/api/admin/users/${uid}`, { active: false });
  const me = await stu2.get("/api/auth/me");
  const l = await new Client().login("s2@test.com", "secret12");
  expect(me.json.user === null && l.status === 403, err(l));
  await adm.patch(`/api/admin/users/${uid}`, { active: true });
  return `existing session ended; login ${err(l)}`;
});

// ======================= BOUNDARY VALUE ANALYSIS (BV) =======================
const bva = async (id, name, cases) => tc(id, name, async () => {
  const out = [];
  for (const [label, fn, expectOk] of cases) {
    const r = await fn();
    const ok = r.status < 300;
    out.push(`${label}→${r.status}`);
    expect(ok === expectOk, `${label}: expected ${expectOk ? "accept" : "reject"}, got ${err(r)}`);
  }
  return out.join(", ");
});
const pw = (p) => () => new Client().post("/api/auth/signup", { name: "P", email: `pw${p.length}_${Math.random()}@t.com`, password: p, role: "student" });
await bva("BV-01", "Password length (min 6)", [["5 chars", pw("12345"), false], ["6 chars", pw("123456"), true], ["7 chars", pw("1234567"), true]]);
const rev = (n) => () => stu.post("/api/reviews", { teacherId: "priya-sharma", rating: n, comment: "" });
await bva("BV-02", "Review rating (1–5)", [["0", rev(0), false], ["1", rev(1), true], ["5", rev(5), true], ["6", rev(6), false]]);
const grade = (g) => () => stu.put("/api/profile", { grade: g, subjects: ["Physics"] });
await bva("BV-03", "Student class (1–12)", [["0", grade(0), false], ["1", grade(1), true], ["12", grade(12), true], ["13", grade(13), false]]);
const exp = (e) => () => new Client().post("/api/auth/signup", { name: "E", email: `e${e}_${Math.random()}@t.com`, password: "secret12", role: "teacher" }).then(async () => ({ status: 0 }));
const tProfile = async (over) => {
  const c = new Client();
  await c.post("/api/auth/signup", { name: "Edge", email: `edge_${Math.random()}@t.com`, password: "secret12", role: "teacher" });
  return c.post("/api/teachers", { name: "Edge Case", phone: "9", qualification: "B.Ed", experienceYears: 1, subjects: ["English"], classMin: 1, classMax: 12, area: "A", city: "B", teachingModes: ["Online"], feeMin: 100, feeMax: 200, bio: "x", ...over });
};
await bva("BV-04", "Teacher experience (0–60 years)", [["-1", () => tProfile({ experienceYears: -1 }), false], ["0", () => tProfile({ experienceYears: 0 }), true], ["60", () => tProfile({ experienceYears: 60 }), true], ["61", () => tProfile({ experienceYears: 61 }), false]]);
await bva("BV-05", "Teacher class range (1–12)", [["0–5", () => tProfile({ classMin: 0, classMax: 5 }), false], ["1–1", () => tProfile({ classMin: 1, classMax: 1 }), true], ["12–12", () => tProfile({ classMin: 12, classMax: 12 }), true], ["5–13", () => tProfile({ classMin: 5, classMax: 13 }), false]]);
await bva("BV-06", "Fee range (min > 0, max ≥ min)", [["0–100", () => tProfile({ feeMin: 0, feeMax: 100 }), false], ["1–1", () => tProfile({ feeMin: 1, feeMax: 1 }), true], ["500–499", () => tProfile({ feeMin: 500, feeMax: 499 }), false]]);
// Booking date window: tomorrow..+60 days on a Saturday slot (Sat 10:00)
const satSlot = (await anon.get("/api/slots?teacherId=priya-sharma")).json.slots.find((s) => s.day === "Sat");
const book = (date) => () => stu.post("/api/bookings", { teacherId: "priya-sharma", slotId: satSlot.id, date, subject: "Physics", mode: "Online" });
const lastSat = (() => { for (let i = 60; ; i--) { const d = new Date(ist().getTime() + i * 864e5); if (d.getUTCDay() === 6) return [iso(d), i]; } })();
const firstSatAfter60 = (() => { for (let i = 61; ; i++) { const d = new Date(ist().getTime() + i * 864e5); if (d.getUTCDay() === 6) return [iso(d), i]; } })();
const pastSat = (() => { for (let i = -1; ; i--) { const d = new Date(ist().getTime() + i * 864e5); if (d.getUTCDay() === 6) return iso(d); } })();
await bva("BV-07", "Booking date window (future, ≤ 60 days)", [
  ["past Sat", book(pastSat), false],
  [`next Sat`, book(nextDow(6)), true],
  [`day +${lastSat[1]}`, book(lastSat[0]), true],
  [`day +${firstSatAfter60[1]}`, book(firstSatAfter60[0]), false],
]);

// ======================= SYSTEM / UI (ST) =======================
const page = async (c, p) => (await c.get(p));
await tc("ST-01", "All public pages load", async () => {
  const pages = ["/", "/teachers", "/teachers?subject=Physics&grade=11", "/teachers/priya-sharma", "/recommend", "/login", "/signup", "/register", "/about", "/contact"];
  const bad = [];
  for (const p of pages) { const r = await page(anon, p); if (r.status !== 200) bad.push(`${p}:${r.status}`); }
  expect(!bad.length, bad.join(" ")); return `${pages.length}/${pages.length} pages returned 200`;
});
await tc("ST-02", "Unknown teacher profile returns 404", async () => {
  const r = await page(anon, "/teachers/does-not-exist"); expect(r.status === 404, r.status); return "404 Not Found";
});
await tc("ST-03", "Unverified profile hidden from public", async () => {
  const r = await page(anon, "/teachers/rohan-mehta"); expect(r.status === 404, r.status); return "404 for anonymous visitor";
});
await tc("ST-04", "Role-based access to dashboards", async () => {
  const s = async (c, p) => (await c.get(p)).status;
  const res = { anonDash: await s(anon, "/dashboard"), anonAdmin: await s(anon, "/admin"), stuDash: await s(stu, "/dashboard"), stuAdmin: await s(stu, "/admin"), teaDash: await s(tea, "/dashboard"), admAdmin: await s(adm, "/admin") };
  expect(res.anonDash === 307 && res.anonAdmin === 307 && res.stuDash === 200 && res.stuAdmin === 307 && res.teaDash === 200 && res.admAdmin === 200, JSON.stringify(res));
  return "Guest→login redirect; student/teacher→dashboard; only admin→/admin";
});
await tc("ST-05", "Search page renders filtered results", async () => {
  const r = await page(anon, "/teachers?subject=Physics");
  expect(/2(<!-- -->)? tutor(<!-- -->)?s(<!-- -->)? found/.test(r.text) && r.text.includes("Priya Sharma") && !r.text.includes("Anjali Nair"), "wrong results");
  return '"2 tutors found" with matching tutors only';
});
await tc("ST-06", "Teacher dashboard shows booking requests and slots", async () => {
  const r = await page(tea, "/dashboard");
  expect(r.text.includes("Booking requests") && r.text.includes("Weekly availability") && r.text.includes("Riya Test"), "missing sections");
  return "Requests (incl. Riya Test), availability and profile sections present";
});
await tc("ST-07", "Admin dashboard lists pending teachers and activity", async () => {
  const r = await page(adm, "/admin");
  expect(r.text.includes("Teacher verification") && r.text.includes("Rohan Mehta") && r.text.includes("Activity log"), "missing sections");
  return "Verification queue (Rohan Mehta), users, reviews, activity log present";
});

// ======================= SECURITY (SEC) =======================
await tc("SEC-01", "Protected APIs reject unauthenticated requests", async () => {
  const codes = [(await anon.get("/api/bookings")).status, (await anon.post("/api/reviews", {})).status, (await anon.put("/api/profile", {})).status, (await anon.patch("/api/admin/teachers/priya-sharma", { status: "rejected" })).status];
  expect(codes.every((c) => c === 401), codes.join(",")); return `401 on all 4 endpoints`;
});
await tc("SEC-02", "Non-admin cannot call admin APIs", async () => {
  const codes = [(await stu.patch("/api/admin/teachers/priya-sharma", { status: "rejected" })).status, (await tea.patch("/api/admin/users/1", { active: false })).status];
  expect(codes.every((c) => c === 403), codes.join(",")); return "403 Forbidden for student and teacher";
});
await tc("SEC-03", "Passwords stored as bcrypt hashes", async () => {
  const db = new Database("data/tutorconnect.db", { readonly: true });
  const rows = db.prepare("SELECT password_hash FROM users").all(); db.close();
  expect(rows.every((r) => /^\$2[aby]\$10\$/.test(r.password_hash)), "plaintext found");
  return `${rows.length}/${rows.length} hashes are bcrypt (cost 10)`;
});
await tc("SEC-04", "Session cookie is HttpOnly and SameSite", async () => {
  const c = new Client(); await c.login("riya@test.com", "secret12");
  const sc = c.lastSetCookie.toLowerCase();
  expect(sc.includes("httponly") && sc.includes("samesite=lax"), sc); return "HttpOnly; SameSite=Lax; 7-day expiry";
});
await tc("SEC-05", "Forged session token (payload edited to admin) rejected", async () => {
  const [h, p, sig] = stu.cookie.split("=")[1].split(".");
  const payload = JSON.parse(Buffer.from(p, "base64url").toString());
  const forged = Buffer.from(JSON.stringify({ ...payload, sub: "1", role: "admin" })).toString("base64url");
  const c = new Client(); c.cookie = `tc_session=${h}.${forged}.${sig}`;
  const me = await c.get("/api/auth/me");
  const a = await c.patch("/api/admin/teachers/priya-sharma", { status: "rejected" });
  expect(me.json.user === null && a.status === 401, `me=${JSON.stringify(me.json.user)} admin=${a.status}`);
  return "Signature mismatch → logged out; admin API 401";
});
await tc("SEC-06", "SQL injection in search parameters", async () => {
  const r = await anon.get("/api/teachers?q=%27%20OR%201%3D1%20--&location=%27%3B%20DROP%20TABLE%20users%3B--");
  const after = await anon.get("/api/teachers");
  expect(r.status === 200 && r.json.teachers.length === 0 && after.json.teachers.length > 0, err(r));
  return "0 results; database unaffected (parameterised queries)";
});
await tc("SEC-07", "Script injection in reviews is escaped (XSS)", async () => {
  await stu.post("/api/reviews", { teacherId: "priya-sharma", rating: 4, comment: "<script>alert('x')</script>" });
  // this student's review was hidden in IT-22 — restore it so it is rendered on the page
  const db = new Database("data/tutorconnect.db", { readonly: true });
  const rid = db.prepare("SELECT r.id FROM reviews r JOIN users u ON u.id=r.student_id WHERE u.email='riya@test.com'").get().id; db.close();
  await adm.patch(`/api/admin/reviews/${rid}`, { hidden: false });
  const html = (await anon.get("/teachers/priya-sharma")).text;
  expect(!html.includes("<script>alert('x')</script>") && html.includes("&lt;script&gt;"), "unescaped");
  return "Rendered as text (&lt;script&gt;), not executed";
});
await tc("SEC-08", "Student cannot book on behalf of another / edit others' bookings", async () => {
  const r = await stu2.patch(`/api/bookings/${bookingId}`, { action: "cancel" }); expect(r.status === 403, err(r)); return err(r);
});

// ======================= PERFORMANCE (PERF) =======================
async function timeIt(label, fn, n = 50) {
  const t = [];
  for (let i = 0; i < 3; i++) await fn(); // warm-up
  for (let i = 0; i < n; i++) { const s = performance.now(); await fn(); t.push(performance.now() - s); }
  t.sort((a, b) => a - b);
  const avg = t.reduce((a, b) => a + b, 0) / n;
  const p95 = t[Math.floor(n * 0.95) - 1];
  perf.push({ label, avg: +avg.toFixed(1), p95: +p95.toFixed(1), n });
  return { avg, p95 };
}
await tc("PERF-01", "Search API response time (target < 500 ms)", async () => {
  const { avg, p95 } = await timeIt("Search API (3 filters)", () => anon.get("/api/teachers?subject=Mathematics&grade=11&mode=Online"));
  expect(p95 < 500, `p95 ${p95}`); return `avg ${avg.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms (50 requests)`;
});
await tc("PERF-02", "AI recommendation response time (target < 1 s)", async () => {
  const { avg, p95 } = await timeIt("AI recommendation API", () => anon.post("/api/recommend", { subjects: ["Physics", "Mathematics"], grade: 11, city: "Bengaluru", mode: "Online", budgetMax: 1000, preferredDays: ["Mon"], goals: "JEE numericals" }));
  expect(p95 < 1000, `p95 ${p95}`); return `avg ${avg.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms`;
});
await tc("PERF-03", "Teacher profile page render time (target < 1 s)", async () => {
  const { avg, p95 } = await timeIt("Teacher profile page (SSR)", () => anon.get("/teachers/priya-sharma"));
  expect(p95 < 1000, `p95 ${p95}`); return `avg ${avg.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms`;
});
await tc("PERF-04", "Login (bcrypt) response time", async () => {
  const { avg, p95 } = await timeIt("Login API (bcrypt verify)", () => new Client().login("riya@test.com", "secret12"), 20);
  expect(p95 < 1000, `p95 ${p95}`); return `avg ${avg.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms (20 requests)`;
});
await tc("PERF-05", "50 concurrent search requests", async () => {
  const s = performance.now();
  const rs = await Promise.all(Array.from({ length: 50 }, () => anon.get("/api/teachers?subject=Physics")));
  const total = performance.now() - s;
  perf.push({ label: "50 concurrent searches (total)", avg: +total.toFixed(1), p95: null, n: 50 });
  expect(rs.every((r) => r.status === 200), "errors"); return `50/50 succeeded in ${total.toFixed(0)} ms total`;
});
await tc("PERF-06", "Search scales to 1,000 teachers", async () => {
  // insert 1,000 synthetic approved teachers directly
  const db = new Database("data/tutorconnect.db");
  const ins = db.prepare(`INSERT INTO teachers (id, name, qualification, experience_years, subjects, class_min, class_max, area, city, teaching_modes, fee_min, fee_max, status) VALUES (?, ?, 'B.Sc', ?, ?, ?, ?, 'Area', ?, ?, ?, ?, 'approved')`);
  const subj = ["Mathematics", "Physics", "Chemistry", "English", "Biology"], cities = ["Bengaluru", "Mumbai", "Delhi", "Chennai", "Pune"];
  db.transaction(() => { for (let i = 0; i < 1000; i++) ins.run(`load-${i}`, `Load Tutor ${i}`, i % 20, JSON.stringify([subj[i % 5]]), 1 + (i % 6), 7 + (i % 6), cities[i % 5], JSON.stringify(["Online"]), 300 + (i % 10) * 100, 600 + (i % 10) * 100); })();
  db.close();
  const { avg, p95 } = await timeIt("Search API with 1,000+ teachers", () => anon.get("/api/teachers?subject=Physics&grade=8&maxFee=800"));
  const r = await timeIt("AI recommendation with 1,000+ teachers", () => anon.post("/api/recommend", { subjects: ["Physics"], grade: 8, city: "Bengaluru", mode: "Online", budgetMax: 800, preferredDays: ["Mon"], goals: "concepts" }), 20);
  expect(p95 < 500 && r.p95 < 1500, `search p95 ${p95}, rec p95 ${r.p95}`);
  return `search avg ${avg.toFixed(1)} ms (p95 ${p95.toFixed(1)}); recommend avg ${r.avg.toFixed(1)} ms (p95 ${r.p95.toFixed(1)})`;
});

// ======================= DEFECT PROBES (DP) — expected behaviour per SRS =======================
await tc("DP-01", "Teacher registration should reject overlapping time slots", async () => {
  const c = new Client();
  await c.post("/api/auth/signup", { name: "Overlap", email: "ov@test.com", password: "secret12", role: "teacher" });
  const r = await c.post("/api/teachers", { name: "Overlap Tutor", phone: "9", qualification: "B.Ed", experienceYears: 1, subjects: ["English"], classMin: 1, classMax: 5, area: "A", city: "B", teachingModes: ["Online"], feeMin: 100, feeMax: 200, bio: "x", slots: [{ day: "Mon", start: "17:00", end: "18:00" }, { day: "Mon", start: "17:30", end: "18:30" }] });
  const slots = (await anon.get(`/api/slots?teacherId=${r.json.id}`)).json.slots;
  expect(slots.length === 1, `API saved ${slots.length} overlapping slots (17:00–18:00 and 17:30–18:30)`); return "rejected";
});
await tc("DP-02", "Phone number format should be validated", async () => {
  const r = await tProfile({ phone: "abc" });
  expect(r.status === 400, `Accepted phone "abc" (${r.status})`); return "rejected";
});
await tc("DP-03", "Repeated failed logins should be throttled", async () => {
  const codes = [];
  for (let i = 0; i < 15; i++) codes.push((await new Client().login("admin@tutorconnect.in", "guess" + i)).status);
  expect(codes.some((c) => c === 429), `15 wrong attempts all returned ${[...new Set(codes)].join("/")}; no lockout or rate limit`); return "throttled";
});
await tc("DP-04", "Edited teacher profile should return to verification", async () => {
  const r = await tea.put("/api/teachers/me", { name: "Priya Sharma", phone: "+919800000001", qualification: "PhD (unverified edit)", experienceYears: 8, subjects: ["Mathematics", "Physics"], classMin: 9, classMax: 12, area: "Koramangala", city: "Bengaluru", teachingModes: ["Home Tuition", "Online"], feeMin: 800, feeMax: 1200, bio: "edited bio" });
  const t = (await anon.get("/api/teachers?q=Priya")).json.teachers[0];
  expect(t.status !== "approved", `Qualification changed to "${t.qualification}" and profile stayed "approved"/verified`); return "re-verification";
});
await tc("DP-05", "Messages should be blocked on rejected/cancelled bookings", async () => {
  const b = await stu.post("/api/bookings", { teacherId: "priya-sharma", slotId: monSlot.id, date: nextDow(1, 15), subject: "Physics", mode: "Online" });
  await tea.patch(`/api/bookings/${b.json.booking.id}`, { action: "reject" });
  const m = await stu.post(`/api/bookings/${b.json.booking.id}/messages`, { body: "Why rejected?" });
  expect(m.status >= 400, `Message accepted on rejected booking (${m.status})`); return "blocked";
});
await tc("DP-06", "Booking list should hide past pending requests / allow only future cancellation", async () => {
  const db = new Database("data/tutorconnect.db");
  const uid = db.prepare("SELECT id FROM users WHERE email='riya@test.com'").get().id;
  const id = db.prepare("INSERT INTO bookings (student_id, teacher_id, date, start_time, end_time, subject, mode, status) VALUES (?, 'priya-sharma', ?, '17:00', '18:00', 'Physics', 'Online', 'accepted')").run(uid, addDays(-7)).lastInsertRowid;
  db.close();
  const r = await stu.patch(`/api/bookings/${id}`, { action: "cancel" });
  expect(r.status >= 400, `Class from 7 days ago could still be cancelled (${r.status})`); return "blocked";
});

fs.writeFileSync(OUT, JSON.stringify({ results, perf }, null, 2));
const f = results.filter((r) => !r.ok);
console.log(`\n${results.length - f.length}/${results.length} passed`);
