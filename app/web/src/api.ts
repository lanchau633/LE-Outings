import type { Group, Plan, User } from "./types";

async function j<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const e = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error(e.error || "request failed");
  }
  return r.json();
}
const post = (url: string, body: unknown) =>
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const api = {
  health: () => fetch("/api/health").then(j<{ ok: boolean; ai: boolean; model: string }>),

  // users
  upsertUser: (u: Partial<User>) => post("/api/users", u).then(j<User>),
  getUser: (username: string) => fetch(`/api/users/${username}`).then(j<User>),
  getFriends: (username: string) => fetch(`/api/users/${username}/friends`).then(j<User[]>),
  addFriend: (username: string, friendUsername: string) =>
    post(`/api/users/${username}/friends`, { friendUsername }).then(j<string[]>),

  // groups
  createGroup: (g: {
    name: string;
    leader: string;
    city: string;
    radiusMiles: number;
    note?: string;
    members: string[];
  }) => post("/api/groups", g).then(j<Group>),
  getGroup: (id: string) => fetch(`/api/groups/${id}`).then(j<Group>),
  myGroups: (username: string) => fetch(`/api/users/${username}/groups`).then(j<Group[]>),
  addMember: (id: string, username: string) => post(`/api/groups/${id}/members`, { username }).then(j<Group>),

  submitEventProfile: (
    id: string,
    p: { username: string; availability: string[]; budget: number; cravings: string[]; activity: string }
  ) => post(`/api/groups/${id}/event-profiles`, p).then(j<Group & { generating: boolean }>),

  getPlan: (id: string) => fetch(`/api/groups/${id}/plan`).then(j<{ plan: Plan | null; submitted: number; total: number }>),
  regenerate: (id: string, constraint: string) =>
    post(`/api/groups/${id}/plan/regenerate`, { constraint }).then(j<{ plan: Plan }>),
  generate: (id: string) => post(`/api/groups/${id}/plan/generate`, {}).then(j<{ plan: Plan }>),
};
