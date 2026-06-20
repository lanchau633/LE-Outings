// AI plan generation via Claude. Optional server-side web search for
// niche place discovery (Reddit/blogs/hidden-gem listicles).
import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.MODEL || "claude-sonnet-4-6";
const USE_WEB_SEARCH = (process.env.USE_WEB_SEARCH || "true") === "true";

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY)
    throw new Error("ANTHROPIC_API_KEY missing — set it in server/.env");
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const SYSTEM = `You are the planning engine for LE-Outings, an app that turns a friend group's individual constraints into ONE concrete hangout plan.

Rules:
- Pick the single best day inside the submitted 10-day availability window using maximum overlap. State who is free / not free.
- Merge budgets by AVERAGING, but if the spread is wide (e.g. min < half of max) flag it and bias suggestions toward the lower end. Never silently exclude the lowest-budget member.
- Dietary restrictions are hard constraints. If a venue can't accommodate someone, say so explicitly — never silently pick something that excludes a member. If you can't verify a menu, label the suggestion an estimate based on cuisine.
- Build a transportation plan from who hasCar (+ seats). Assign drivers and who rides with whom. Flag if there aren't enough seats.
- Prefer niche, highly-rated, lower-review-count local spots over obvious top-of-search chains.
- Honor the destination city + mile radius and any group note / regeneration constraint.
- Explain WHY for each major choice (day, venue, food, transport) in short plain sentences.

Output: after any research, end your reply with ONE fenced json block (\`\`\`json ... \`\`\`) and nothing after it, matching this shape:
{
  "title": "string — short plan name",
  "day": "string — chosen day + date if known",
  "time": "string — e.g. 6:30 PM",
  "venue": { "name": "string", "type": "string e.g. Korean BBQ", "area": "string", "priceLevel": "$|$$|$$$", "why": "string" },
  "alternates": [ { "name": "string", "why": "string" } ],
  "food": { "note": "string — dietary confirmation/estimate", "averageBudget": number },
  "transportation": { "summary": "string", "assignments": [ { "driver": "string", "riders": ["string"] } ], "note": "string" },
  "reasoning": ["string", "string"],
  "flags": ["string — conflicts/assumptions, empty array if none"]
}`;

function buildUserPrompt(group, members) {
  const lines = [];
  lines.push(`GROUP: ${group.name}`);
  lines.push(`DESTINATION: within ${group.radiusMiles} miles of ${group.city}`);
  if (group.note) lines.push(`GROUP NOTE: ${group.note}`);
  lines.push("");
  lines.push("MEMBERS + EVENT PROFILES:");
  for (const m of members) {
    const p = group.eventProfiles[m.username] || {};
    lines.push(
      `- ${m.username}: dietary=[${(m.dietary || []).join(", ") || "none"}], ` +
        `hasCar=${m.hasCar ? `yes(${m.carSeats || 4} seats)` : "no"}, ` +
        `availableDays=[${(p.availability || []).join(", ") || "none submitted"}], ` +
        `budget=$${p.budget ?? "?"}, ` +
        `cravings=[${(p.cravings || []).join(", ") || "none"}], ` +
        `activity=${p.activity || "none"}`
    );
  }
  return lines.join("\n");
}

export async function generatePlan(group, members, constraint) {
  const userPrompt =
    buildUserPrompt(group, members) +
    (constraint ? `\n\nREGENERATION CONSTRAINT: "${constraint}" — revise the plan accordingly.` : "");

  const tools = USE_WEB_SEARCH
    ? [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }]
    : undefined;

  const resp = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    tools,
    messages: [{ role: "user", content: userPrompt }],
  });

  // Concatenate all text blocks, then extract the final json fence.
  const text = resp.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const plan = extractJson(text);
  return {
    ...plan,
    generatedAt: Date.now(),
    constraint: constraint || null,
    model: MODEL,
  };
}

function extractJson(text) {
  const fence = [...text.matchAll(/```json\s*([\s\S]*?)```/g)].pop();
  const raw = fence ? fence[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  try {
    return JSON.parse(raw);
  } catch {
    return { title: "Plan", reasoning: ["Could not parse model output."], raw: text, flags: ["parse_error"] };
  }
}
