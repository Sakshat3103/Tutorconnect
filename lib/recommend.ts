import { searchTeachers, getSlots, type Teacher } from "./teachers";

/**
 * FR8 / FR15 — AI tutor recommendation.
 *
 * Content-based recommender: every approved tutor is scored 0-100 against the
 * student's needs using weighted features, plus TF-IDF text similarity between
 * the student's learning goals and the tutor's bio / achievements.
 *
 *   Subject match 25 · Class fit 15 · Mode & location 15 · Budget 10
 *   Availability 10 · Quality (rating, reviews, verified) 12 · Experience 3
 *   Goal-text similarity 10
 */

export interface Needs {
  subjects: string[];
  grade: number | null;
  area: string;
  city: string;
  mode: string;
  budgetMax: number | null;
  preferredDays: string[];
  goals: string;
}

export interface Recommendation {
  teacher: Teacher;
  score: number;
  breakdown: { label: string; points: number; max: number }[];
  reasons: string[];
  caveats: string[];
}

const STOP = new Set(
  "a an the and or but if to of in on for with at by from is are was were be been am i my me we our you your he she it its they them this that these those so very really need needs want wants help also can could would should will just not no more most some any into about than then there their his her do does did have has had who whom which what when where why how all each other such only own same too s t ll".split(" ")
);

const tokens = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => w.replace(/(ing|ed|es|s)$/, "")) // light stemming
    .filter((w) => w.length > 2);

function tfidfSimilarity(query: string, docs: string[]): number[] {
  const docTokens = docs.map(tokens);
  const q = tokens(query);
  if (!q.length) return docs.map(() => 0);
  const df = new Map<string, number>();
  for (const toks of docTokens) for (const w of new Set(toks)) df.set(w, (df.get(w) ?? 0) + 1);
  const idf = (w: string) => Math.log((docs.length + 1) / ((df.get(w) ?? 0) + 1)) + 1;
  const vec = (toks: string[]) => {
    const tf = new Map<string, number>();
    for (const w of toks) tf.set(w, (tf.get(w) ?? 0) + 1);
    const v = new Map<string, number>();
    for (const [w, c] of tf) v.set(w, (c / toks.length) * idf(w));
    return v;
  };
  const norm = (v: Map<string, number>) => Math.sqrt([...v.values()].reduce((s, x) => s + x * x, 0)) || 1;
  const qv = vec(q);
  const qn = norm(qv);
  return docTokens.map((toks) => {
    if (!toks.length) return 0;
    const dv = vec(toks);
    let dot = 0;
    for (const [w, x] of qv) dot += x * (dv.get(w) ?? 0);
    return dot / (qn * norm(dv));
  });
}

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim() !== "";

export function recommend(needs: Needs, limit = 6): Recommendation[] {
  let candidates = searchTeachers({});
  if (needs.subjects.length) candidates = candidates.filter((t) => t.subjects.some((s) => needs.subjects.includes(s)));
  if (!candidates.length) return [];

  const docs = candidates.map((t) => `${t.subjects.join(" ")} ${t.bio} ${t.achievements.join(" ")} ${t.qualification}`);
  const sims = tfidfSimilarity(needs.goals, docs);
  const maxSim = Math.max(...sims, 0);

  const recs = candidates.map((t, i) => {
    const reasons: string[] = [];
    const caveats: string[] = [];
    const breakdown: Recommendation["breakdown"] = [];
    const add = (label: string, points: number, max: number) => breakdown.push({ label, points: Math.round(points * 10) / 10, max });

    // Subject (25)
    const matched = needs.subjects.filter((s) => t.subjects.includes(s));
    const subjectPts = needs.subjects.length ? (25 * matched.length) / needs.subjects.length : 12.5;
    add("Subject match", subjectPts, 25);
    if (matched.length) reasons.push(`Teaches ${matched.join(" & ")}`);
    const missing = needs.subjects.filter((s) => !t.subjects.includes(s));
    if (missing.length && matched.length) caveats.push(`Doesn't teach ${missing.join(", ")}`);

    // Class (15)
    let classPts = 7.5;
    if (needs.grade) {
      if (needs.grade >= t.classMin && needs.grade <= t.classMax) {
        classPts = 15;
        reasons.push(`Teaches Class ${needs.grade} (${t.classes.replace("Class ", "")})`);
      } else if (needs.grade >= t.classMin - 1 && needs.grade <= t.classMax + 1) {
        classPts = 6;
        caveats.push(`Usually teaches ${t.classes}`);
      } else {
        classPts = 0;
        caveats.push(`Teaches ${t.classes}, not Class ${needs.grade}`);
      }
    }
    add("Class fit", classPts, 15);

    // Mode & location (15)
    let modePts = 7.5;
    if (needs.mode === "Online") {
      modePts = t.teachingModes.includes("Online") ? 15 : 0;
      if (modePts) reasons.push("Offers online classes");
      else caveats.push("No online classes");
    } else if (needs.mode) {
      const offersMode = t.teachingModes.includes(needs.mode as Teacher["teachingModes"][number]);
      if (offersMode && sameText(t.area, needs.area)) {
        modePts = 15;
        reasons.push(`${needs.mode} in ${t.area}`);
      } else if (offersMode && sameText(t.city, needs.city)) {
        modePts = 9;
        reasons.push(`${needs.mode} available (${t.area}, ${t.city})`);
      } else if (t.teachingModes.includes("Online")) {
        modePts = 5;
        caveats.push(`${needs.mode} not available nearby, but teaches online`);
      } else {
        modePts = 0;
        caveats.push(`Based in ${t.area}, ${t.city}`);
      }
    } else if (needs.area && sameText(t.area, needs.area)) {
      modePts = 12;
      reasons.push(`Based in your area (${t.area})`);
    }
    add("Mode & location", modePts, 15);

    // Budget (10)
    let budgetPts = 5;
    if (needs.budgetMax) {
      if (t.feeMax <= needs.budgetMax) {
        budgetPts = 10;
        reasons.push(`Within your budget (${t.feeRange})`);
      } else if (t.feeMin <= needs.budgetMax) {
        budgetPts = 7;
        reasons.push(`Starts within budget (${t.feeRange})`);
      } else if (t.feeMin <= needs.budgetMax * 1.25) {
        budgetPts = 3;
        caveats.push(`Slightly above budget (${t.feeRange})`);
      } else {
        budgetPts = 0;
        caveats.push(`Above budget (${t.feeRange})`);
      }
    }
    add("Budget", budgetPts, 10);

    // Availability (10)
    let availPts = 5;
    if (needs.preferredDays.length) {
      const teacherDays = new Set(getSlots(t.id).map((s) => s.day));
      const overlap = needs.preferredDays.filter((d) => teacherDays.has(d));
      availPts = (10 * overlap.length) / needs.preferredDays.length;
      if (overlap.length) reasons.push(`Free on ${overlap.join(", ")}`);
      else caveats.push(`Not available on ${needs.preferredDays.join(", ")}`);
    }
    add("Availability", availPts, 10);

    // Quality (12)
    const qualityPts = (t.rating / 5) * 8 + (Math.min(t.reviewsCount, 10) / 10) * 2 + (t.verified ? 2 : 0);
    add("Rating & trust", qualityPts, 12);
    if (t.rating >= 4.5 && t.reviewsCount >= 2) reasons.push(`Rated ${t.rating}★ by ${t.reviewsCount} students`);

    // Experience (3)
    add("Experience", (Math.min(t.experienceYears, 10) / 10) * 3, 3);
    if (t.experienceYears >= 8) reasons.push(`${t.experienceYears} years of experience`);

    // Goal text similarity (10)
    const goalPts = needs.goals.trim() ? (maxSim > 0 ? (10 * sims[i]) / maxSim : 0) : 5;
    add("Matches your goals", goalPts, 10);
    if (needs.goals.trim() && sims[i] > 0 && sims[i] >= maxSim * 0.6) {
      const goalWords = new Set(tokens(needs.goals));
      const hits = [...new Set(tokens(docs[i]))].filter((w) => goalWords.has(w)).slice(0, 3);
      if (hits.length) reasons.push(`Profile mentions what you need (${hits.join(", ")})`);
    }

    const score = Math.round(breakdown.reduce((s, b) => s + b.points, 0));
    return { teacher: t, score, breakdown, reasons, caveats };
  });

  return recs.sort((a, b) => b.score - a.score || b.teacher.rating - a.teacher.rating).slice(0, limit);
}
