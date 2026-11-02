// Teachers now live in the SQLite database (see lib/db.ts, lib/seed.ts and lib/teachers.ts).
export type { Teacher, TeachingMode } from "./teachers";

export const subjectsList = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Coding",
  "Commerce",
  "Accountancy",
  "Business Studies",
  "Hindi",
  "Social Studies",
  "Science",
  "Economics",
  "Computer Science",
  "Music",
  "Art",
  "Sports Coaching",
];

export const stats = [
  { label: "Registered Teachers", value: 8500, suffix: "+" },
  { label: "Localities Covered", value: 120, suffix: "+" },
  { label: "Subjects", value: 50, suffix: "+" },
  { label: "Successful Student Connections", value: 15000, suffix: "+" },
];
