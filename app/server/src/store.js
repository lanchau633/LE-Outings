// Tiny zero-dependency JSON file store. No DB server needed.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const DB_FILE = join(DATA_DIR, "db.json");

const empty = { users: {}, groups: {} };
let db = empty;

function load() {
  if (existsSync(DB_FILE)) {
    try {
      db = JSON.parse(readFileSync(DB_FILE, "utf8"));
    } catch {
      db = structuredClone(empty);
    }
  } else {
    db = structuredClone(empty);
  }
  db.users ??= {};
  db.groups ??= {};
}

function persist() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

load();

export const store = {
  raw: () => db,
  save: persist,

  // ---- users (base profile) ----
  getUser: (username) => db.users[username?.toLowerCase()] || null,
  upsertUser: (u) => {
    const key = u.username.toLowerCase();
    const existing = db.users[key] || { friends: [] };
    db.users[key] = {
      username: u.username,
      dietary: u.dietary ?? existing.dietary ?? [],
      hasCar: u.hasCar ?? existing.hasCar ?? false,
      carSeats: u.carSeats ?? existing.carSeats ?? 0,
      friends: existing.friends ?? [],
    };
    persist();
    return db.users[key];
  },
  addFriend: (username, friendUsername) => {
    const u = db.users[username.toLowerCase()];
    const f = db.users[friendUsername.toLowerCase()];
    if (!u || !f) return null;
    if (!u.friends.includes(f.username)) u.friends.push(f.username);
    persist();
    return u.friends;
  },

  // ---- groups ----
  createGroup: (g) => {
    const id = "g_" + Math.random().toString(36).slice(2, 9);
    db.groups[id] = {
      id,
      name: g.name,
      leader: g.leader,
      city: g.city,
      radiusMiles: g.radiusMiles ?? 15,
      note: g.note ?? "",
      members: g.members, // [username]
      eventProfiles: {}, // username -> profile
      plan: null,
      createdAt: Date.now(),
    };
    persist();
    return db.groups[id];
  },
  getGroup: (id) => db.groups[id] || null,
  groupsForUser: (username) =>
    Object.values(db.groups).filter((g) =>
      g.members.map((m) => m.toLowerCase()).includes(username.toLowerCase())
    ),
  addMember: (id, username) => {
    const g = db.groups[id];
    if (!g) return null;
    if (!g.members.map((m) => m.toLowerCase()).includes(username.toLowerCase()))
      g.members.push(username);
    persist();
    return g;
  },
  submitEventProfile: (id, username, profile) => {
    const g = db.groups[id];
    if (!g) return null;
    g.eventProfiles[username] = { ...profile, submittedAt: Date.now() };
    persist();
    return g;
  },
  setPlan: (id, plan) => {
    const g = db.groups[id];
    if (!g) return null;
    g.plan = plan;
    persist();
    return g;
  },
};
