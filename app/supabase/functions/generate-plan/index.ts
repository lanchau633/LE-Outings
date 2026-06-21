// Supabase Edge Function — AI plan generation.
// Holds ANTHROPIC_API_KEY as a secret; the browser never sees it.
// Deploy:  supabase functions deploy generate-plan
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//          (optional) supabase secrets set MODEL=claude-sonnet-4-6 USE_WEB_SEARCH=true
import { createClient } from "jsr:@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.65.0";

const MODEL = Deno.env.get("MODEL") || "claude-sonnet-4-6";

function fmtHour(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}
const USE_WEB_SEARCH = (Deno.env.get("USE_WEB_SEARCH") || "true") === "true";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildSystem(longDistance: boolean) {
  const transport = longDistance
    ? `- TRANSPORTATION (long-distance / international trip): do NOT assign personal cars or seats. Leave "assignments" empty. In "summary"/"note", advise on getting there and around — flights/trains/rideshare/public transit, rough travel time, and whether a passport/visa may be needed. Ignore each member's hasCar/seats.`
    : `- TRANSPORTATION (local trip): build a car plan from who hasCar (+ seats). Assign drivers and who rides with whom. Flag if there aren't enough seats for the group.`;

  return `You are the planning engine for LE-Outings, an app that turns a friend group's individual constraints into ONE concrete, multi-stop hangout ITINERARY.

Rules:
- Pick the single best day inside the submitted 10-day availability window using maximum overlap. State who is free / not free.
- Build a FULL ITINERARY of 2–5 stops that flow logically and form a sensible route (e.g. activity → food → dessert/drinks), each stop near the previous one. Order them by time of day.
- TIME WINDOW is a hard constraint: every stop must start and end within the group's available time window (given in the prompt). Budget realistic durations per stop including travel. If the group's requested activities can't all fit, build the best itinerary that DOES fit and put every left-out activity/spot into "alternates", each with a "why" that says it didn't fit the time window.
- Treat each member's "specific activity" as an OPTIONAL request, not a requirement. Include the ones you reasonably can. If the group named few or no activities, propose complementary nearby things to do so the day feels full and fun (still within the time budget). Never invent a hard requirement the group didn't ask for.
- Merge budgets by AVERAGING, but if the spread is wide (min < half of max) flag it and bias toward the lower end. Never silently exclude the lowest-budget member. The itinerary total should respect the averaged budget.
- Dietary restrictions are hard constraints for any food stop. If a venue can't accommodate someone, say so explicitly. If you can't verify a menu, label the suggestion an estimate based on cuisine.
${transport}
- Prefer niche, highly-rated, lower-review-count local spots over obvious chains.
- Honor the destination city + mile radius and any regeneration constraint. The group "note" is just a label for humans — do NOT treat it as a planning instruction.
- BE CONCISE. Each stop "why" is 2–3 sentences max — no URLs, no booking steps, no price breakdowns. Each "reasoning" bullet is one short phrase. Keep "time" compact like "10:00 AM–12:00 PM" (no "approx." or duration text).

Output: after any research, end with ONE fenced json block (\`\`\`json ... \`\`\`) and nothing after it, matching:
{
  "title": "string",
  "day": "string",
  "time": "string (overall start time)",
  "itinerary": [
    { "order": number, "name": "string", "type": "string", "area": "string", "time": "compact range e.g. 10:00 AM–12:00 PM", "priceLevel": "$|$$|$$$", "why": "ONE short sentence", "travelFromPrev": "short, e.g. '5-min walk' ('' for the first)" }
  ],
  "alternates": [ { "name": "string", "why": "string" } ],
  "food": { "note": "string", "averageBudget": number },
  "transportation": { "summary": "string", "assignments": [ { "driver": "string", "riders": ["string"] } ], "note": "string" },
  "reasoning": ["string"],
  "flags": ["string"]
}`;
}

function buildPrompt(group: any, members: any[], eventProfiles: Record<string, any>, constraint?: string) {
  const lines = [
    `GROUP: ${group.name}`,
    `DESTINATION: within ${group.radius_miles} miles of ${group.city}`,
    `TIME WINDOW: the group is available from ${fmtHour(group.start_hour ?? 12)} to ${fmtHour(group.end_hour ?? 22)} (including travel). All itinerary stops must fit within this window.`,
    `TRIP MODE: ${group.long_distance ? "long-distance / international (ignore personal cars)" : "local (use cars/seats for transport)"}`,
  ];
  lines.push("", "MEMBERS + EVENT PROFILES:");
  for (const m of members) {
    const p = eventProfiles[m.id] || {};
    lines.push(
      `- ${m.username}: dietary=[${(m.dietary || []).join(", ") || "none"}], ` +
        `hasCar=${m.has_car ? `yes(${m.car_seats || 4} seats)` : "no"}, ` +
        `availableDays=[${(p.availability || []).join(", ") || "none submitted"}], ` +
        `budget=$${p.budget ?? "?"}, cravings=[${(p.cravings || []).join(", ") || "none"}], ` +
        `specificActivity=${p.activity ? `"${p.activity}" (optional)` : "none — you choose"}`
    );
  }
  if (constraint) lines.push("", `REGENERATION CONSTRAINT: "${constraint}" — revise the plan accordingly.`);
  return lines.join("\n");
}

function extractJson(text: string) {
  const candidates: string[] = [];
  // 1) ```json fenced blocks, 2) any ``` fenced blocks, 3) outermost { ... }
  candidates.push(...[...text.matchAll(/```json\s*([\s\S]*?)```/g)].map((m) => m[1]));
  candidates.push(...[...text.matchAll(/```\s*([\s\S]*?)```/g)].map((m) => m[1]));
  if (text.includes("{") && text.includes("}"))
    candidates.push(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  for (const c of candidates) {
    try {
      return JSON.parse(c.trim());
    } catch {
      /* try next candidate */
    }
  }
  return { title: "Plan", reasoning: ["Could not parse model output."], flags: ["parse_error"], raw: text.slice(0, 2000) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  let groupId: string | undefined;

  try {
    const body = await req.json();
    groupId = body.groupId;
    const constraint = body.constraint;
    if (!groupId) throw new Error("groupId required");

    const { data: group } = await supabase.from("groups").select("*").eq("id", groupId).single();
    if (!group) throw new Error("group not found");

    const { data: gm } = await supabase.from("group_members").select("user_id").eq("group_id", groupId);
    const ids = (gm || []).map((r) => r.user_id);
    const { data: members } = await supabase.from("profiles").select("*").in("id", ids);
    const { data: eps } = await supabase.from("event_profiles").select("*").eq("group_id", groupId);
    const epMap: Record<string, any> = {};
    for (const e of eps || []) epMap[e.user_id] = e;

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
    const tools = USE_WEB_SEARCH
      ? [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }]
      : undefined;
    const messages: any[] = [
      { role: "user", content: buildPrompt(group, members || [], epMap, constraint) },
    ];

    // Web search can return stop_reason "pause_turn" before finishing — resume by
    // re-sending the conversation until the model produces its final answer.
    let text = "";
    for (let turn = 0; turn < 6; turn++) {
      const resp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 8192,
        system: buildSystem(Boolean(group.long_distance)),
        tools,
        messages,
      });
      messages.push({ role: "assistant", content: resp.content });
      if (resp.stop_reason === "pause_turn") continue;
      if (resp.stop_reason === "max_tokens") {
        console.warn("[generate-plan] hit max_tokens — response truncated");
      }
      text = resp.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n");
      break;
    }

    console.log("[generate-plan] model text:", text.slice(0, 3000));
    const parsed = extractJson(text);

    // If parsing failed, don't poison the plan slot with the fallback object.
    // Release the lock (status -> idle) so it stays retryable, and surface an error.
    if (Array.isArray(parsed.flags) && parsed.flags.includes("parse_error")) {
      await supabase.from("groups").update({ plan_status: "idle" }).eq("id", groupId);
      return new Response(
        JSON.stringify({ error: "Couldn't parse the plan from the model. Please try again." }),
        { status: 502, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const plan = { ...parsed, generatedAt: Date.now(), constraint: constraint || null, model: MODEL };

    // Writing a fresh plan clears any "stale" marker and releases the generation lock.
    await supabase.from("groups").update({ plan, plan_status: "ready" }).eq("id", groupId);
    return new Response(JSON.stringify({ plan }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    // Release the lock so the group isn't stuck "generating" forever.
    if (groupId) await supabase.from("groups").update({ plan_status: "idle" }).eq("id", groupId);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
