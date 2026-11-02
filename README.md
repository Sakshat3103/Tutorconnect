# TutorConnect (EduBridge)

Web platform that connects students and parents with verified tuition teachers.
Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, SQLite (better-sqlite3) and JWT authentication.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. The database (`data/tutorconnect.db`) is created automatically on first run.
A new database contains **no tutors**, only the admin account. Run `npm run reset-db` to delete the database and start fresh.

### Admin account
Copy `.env.example` to `.env.local` and set `ADMIN_EMAIL` and `ADMIN_PASSWORD` **before** the database is first created.
Without them the admin is `admin@tutorconnect.in` / `admin123` (change this before going live).

### Demo mode (sample data)
To show the project with sample tutors, students and reviews:

```bash
npm run reset-db
npm run dev:demo
```

Demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@tutorconnect.in | admin123 |
| Student | aarav@example.com | student123 |
| Parent | sunita@example.com | student123 |
| Teacher | priya.sharma@tutorconnect.in | teacher123 |

All sample teachers use the password `teacher123`. Run `npm run reset-db` then `npm run dev` to go back to an empty database.

### Optional: LLM summary on the AI match page
Create `.env.local` with `ANTHROPIC_API_KEY=...` to add a short AI-written summary above the recommendations.
Without a key, recommendations still work (they are computed by the built-in scoring engine).

## Requirement coverage

| Requirement | Where |
|---|---|
| FR1 Registration (student / parent / teacher) | `/signup`, `/register`, `POST /api/auth/signup` |
| FR2 Login / logout | `/login`, `POST /api/auth/login`, `POST /api/auth/logout` |
| FR3 Student/parent learning profile | Dashboard → "Learning needs", `PUT /api/profile` |
| FR4 Teacher profile | `/register` (create), Dashboard → "My profile" (edit), `/teachers/[id]` |
| FR5 Teacher verification | New teachers are `pending` until approved on `/admin` |
| FR6 / FR7 Search + 8 filters | `/teachers` (subject, class, location, availability, mode, experience, fee, rating), `GET /api/teachers` |
| FR8 / FR15 AI recommendation | `/recommend`, Dashboard → "AI picks", `POST /api/recommend` (`lib/recommend.ts`) |
| FR9 Availability | Weekly time slots: registration step 4, Dashboard → "Weekly availability", `/api/slots` |
| FR10 Booking requests | Profile page booking card, `POST /api/bookings` |
| FR11 Booking management | Teacher dashboard: accept / decline / complete; students can cancel |
| FR12 Communication | Chat on every booking, `/api/bookings/[id]/messages` |
| FR13 Ratings & reviews | Profile page (after an accepted booking), `POST /api/reviews` |
| FR14 Admin management | `/admin`: verify teachers, deactivate users, hide reviews, bookings + activity log |
| NFR2/3 Security | bcrypt password hashes, signed httpOnly JWT cookie, role checks on every API route |
| Risk R4 Double bookings | `hasClash()` in `lib/bookings.ts` blocks overlapping requests |

### Tests
```bash
npx tsx --test tests/unit.test.ts                     # unit + white-box tests
rm -rf data && npm run build && SEED_DEMO=1 npx next start -p 3200   # in one terminal
node tests/api.test.mjs                               # integration, BVA, security, performance
```

### AI recommendation algorithm
Content-based scoring (0–100) of every verified tutor against the student's needs:
subject match 25 · class fit 15 · mode & location 15 · budget 10 · availability 10 · rating & trust 12 · experience 3 ·
goal-text similarity 10 (TF-IDF cosine similarity between the student's goals and the tutor's bio/achievements).
Each result shows the score breakdown, reasons and caveats.

## Folder structure

```
app/
  page.tsx                 Home
  teachers/page.tsx        Search with filters
  teachers/[id]/page.tsx   Teacher profile, booking, reviews
  recommend/page.tsx       AI tutor match
  register/page.tsx        Teacher registration (4 steps)
  login/ signup/           Authentication
  dashboard/page.tsx       Student / parent / teacher dashboard
  admin/page.tsx           Admin dashboard
  api/                     REST API routes
components/                UI components
lib/
  db.ts                    SQLite schema + connection
  seed.ts                  Sample data
  auth.ts                  Password hashing, sessions, role checks
  teachers.ts              Teacher queries + search
  bookings.ts              Bookings, clash check, messages
  students.ts              Student profiles
  recommend.ts             AI recommendation engine
  llm.ts                   Optional LLM summary
middleware.ts              Redirects logged-out users away from private pages
```
