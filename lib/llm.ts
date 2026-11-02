import type { Needs, Recommendation } from "./recommend";

/**
 * Optional: if ANTHROPIC_API_KEY is set (in .env.local), an LLM writes a short
 * personalised summary of the top matches. Without a key the app works the same,
 * just without this summary.
 */
export async function llmSummary(needs: Needs, recs: Recommendation[]): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !recs.length) return null;
  const top = recs.slice(0, 3).map((r) => ({
    name: r.teacher.name, score: r.score, subjects: r.teacher.subjects, classes: r.teacher.classes,
    fee: r.teacher.feeRange, modes: r.teacher.teachingModes, area: r.teacher.area, rating: r.teacher.rating,
    bio: r.teacher.bio, reasons: r.reasons, caveats: r.caveats,
  }));
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `A student/parent is looking for a tuition teacher. Their needs: ${JSON.stringify(needs)}.
Our matching system ranked these tutors: ${JSON.stringify(top)}.
In 3-4 friendly sentences, explain which tutor is the best first choice and why, and when one of the others would be better. Use only the facts given. No headings or lists.`,
        }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.content?.[0]?.text ?? null;
  } catch {
    return null;
  }
}
