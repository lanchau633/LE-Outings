import "dotenv/config";
import express from "express";
import cors from "cors";
import { store } from "./store.js";
import { generatePlan } from "./ai.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8787;
const ok = (res, data) => res.json(data);
const err = (res, code, msg) => res.status(code).json({ error: msg });

// hydrate group members with their base profiles (dietary/car)
function memberProfiles(group) {
  return group.members.map((u) => store.getUser(u)).filter(Boolean);
}
function withCounts(group) {
  const submitted = Object.keys(group.eventProfiles).length;
  return { ...group, submitted, total: group.members.length };
}

app.get("/api/health", (_req, res) =>
  ok(res, { ok: true, ai: Boolean(process.env.ANTHROPIC_API_KEY), model: process.env.MODEL || "claude-sonnet-4-6" })
);

// ---- users / base profile ----
app.post("/api/users", (req, res) => {
  const { username, dietary, hasCar, carSeats } = req.body;
  if (!username) return err(res, 400, "username required");
  ok(res, store.upsertUser({ username, dietary, hasCar, carSeats }));
});
app.get("/api/users/:username", (req, res) => {
  const u = store.getUser(req.params.username);
  return u ? ok(res, u) : err(res, 404, "user not found");
});
app.get("/api/users/:username/friends", (req, res) => {
  const u = store.getUser(req.params.username);
  if (!u) return err(res, 404, "user not found");
  ok(res, u.friends.map((f) => store.getUser(f)).filter(Boolean));
});
app.post("/api/users/:username/friends", (req, res) => {
  const { friendUsername } = req.body;
  if (!store.getUser(req.params.username)) return err(res, 404, "user not found");
  if (!store.getUser(friendUsername)) return err(res, 404, "friend username not found");
  ok(res, store.addFriend(req.params.username, friendUsername));
});

// ---- groups ----
app.post("/api/groups", (req, res) => {
  const { name, leader, city, radiusMiles, note, members } = req.body;
  if (!name || !leader || !city) return err(res, 400, "name, leader, city required");
  const all = Array.from(new Set([leader, ...(members || [])]));
  ok(res, withCounts(store.createGroup({ name, leader, city, radiusMiles, note, members: all })));
});
app.get("/api/groups/:id", (req, res) => {
  const g = store.getGroup(req.params.id);
  if (!g) return err(res, 404, "group not found");
  ok(res, { ...withCounts(g), memberProfiles: memberProfiles(g) });
});
app.get("/api/users/:username/groups", (req, res) => {
  ok(res, store.groupsForUser(req.params.username).map(withCounts));
});
app.post("/api/groups/:id/members", (req, res) => {
  const { username } = req.body;
  if (!store.getUser(username)) return err(res, 404, "username not found");
  const g = store.addMember(req.params.id, username);
  return g ? ok(res, withCounts(g)) : err(res, 404, "group not found");
});

// ---- event profiles (auto-generate plan when all submitted) ----
app.post("/api/groups/:id/event-profiles", async (req, res) => {
  const { username, availability, budget, cravings, activity } = req.body;
  let g = store.getGroup(req.params.id);
  if (!g) return err(res, 404, "group not found");
  if (!g.members.map((m) => m.toLowerCase()).includes((username || "").toLowerCase()))
    return err(res, 400, "user not in group");
  g = store.submitEventProfile(req.params.id, username, { availability, budget, cravings, activity });

  const allIn = Object.keys(g.eventProfiles).length === g.members.length;
  let generating = false;
  if (allIn && !g.plan) {
    generating = true;
    generateAndStore(g.id).catch((e) => console.error("plan gen failed:", e.message));
  }
  ok(res, { ...withCounts(g), generating });
});

// ---- plan ----
app.get("/api/groups/:id/plan", (req, res) => {
  const g = store.getGroup(req.params.id);
  if (!g) return err(res, 404, "group not found");
  ok(res, { plan: g.plan, ...withCounts(g) });
});
app.post("/api/groups/:id/plan/generate", async (req, res) => {
  try {
    const g = await generateAndStore(req.params.id, req.body?.constraint);
    if (!g) return err(res, 404, "group not found");
    ok(res, { plan: g.plan });
  } catch (e) {
    err(res, 500, e.message);
  }
});
app.post("/api/groups/:id/plan/regenerate", async (req, res) => {
  try {
    const g = await generateAndStore(req.params.id, req.body?.constraint);
    if (!g) return err(res, 404, "group not found");
    ok(res, { plan: g.plan });
  } catch (e) {
    err(res, 500, e.message);
  }
});

async function generateAndStore(id, constraint) {
  const g = store.getGroup(id);
  if (!g) return null;
  const plan = await generatePlan(g, memberProfiles(g), constraint);
  return store.setPlan(id, plan);
}

app.listen(PORT, () => {
  console.log(`LE-Outings API → http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY)
    console.warn("⚠  ANTHROPIC_API_KEY not set — plan generation will fail until you add it to server/.env");
});
