import { supabase } from "./supabase";
import { auth, rowToUser } from "./auth";
import type { EventProfile, Group, Plan, User } from "./types";

const die = (m: string | undefined): never => {
  throw new Error(m || "request failed");
};
async function myId(): Promise<string> {
  const id = await auth.myId();
  if (!id) die("not signed in");
  return id!;
}
async function profileIdByUsername(username: string): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase().trim())
    .single();
  if (error || !data) die(`username "${username}" not found`);
  return data!.id;
}

// assemble the username-keyed Group shape the screens expect
async function hydrateGroup(g: any): Promise<Group> {
  const { data: gm } = await supabase.from("group_members").select("user_id").eq("group_id", g.id);
  const ids = (gm || []).map((r) => r.user_id);
  const { data: profs } = await supabase.from("profiles").select("*").in("id", ids.length ? ids : ["_"]);
  const { data: eps } = await supabase.from("event_profiles").select("*").eq("group_id", g.id);

  const idToName: Record<string, string> = {};
  const memberProfiles: User[] = (profs || []).map((p) => {
    idToName[p.id] = p.username;
    return rowToUser(p);
  });
  const eventProfiles: Record<string, EventProfile> = {};
  for (const e of eps || []) {
    const name = idToName[e.user_id];
    if (name)
      eventProfiles[name] = {
        availability: e.availability ?? [],
        budget: e.budget,
        cravings: e.cravings ?? [],
        activity: e.activity ?? "",
        submittedAt: new Date(e.submitted_at).getTime(),
      };
  }
  return {
    id: g.id,
    name: g.name,
    leader: idToName[g.leader_id] ?? "",
    city: g.city,
    radiusMiles: g.radius_miles,
    note: g.note ?? "",
    members: memberProfiles.map((m) => m.username),
    eventProfiles,
    plan: g.plan ?? null,
    submitted: Object.keys(eventProfiles).length,
    total: memberProfiles.length,
    memberProfiles,
  };
}

export const api = {
  // ---- users ----
  // update the signed-in user's base profile (username is fixed at signup)
  async upsertUser(u: Partial<User>): Promise<User> {
    const id = await myId();
    const { data, error } = await supabase
      .from("profiles")
      .update({ dietary: u.dietary ?? [], has_car: u.hasCar ?? false, car_seats: u.carSeats ?? 0 })
      .eq("id", id)
      .select()
      .single();
    if (error) die(error.message);
    return rowToUser(data);
  },

  async getUser(username: string): Promise<User> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username.toLowerCase().trim())
      .single();
    if (error || !data) die("user not found");
    return rowToUser(data!);
  },

  async getFriends(_username: string): Promise<User[]> {
    const id = await myId();
    const { data } = await supabase.from("friendships").select("friend_id").eq("user_id", id);
    const ids = (data || []).map((r) => r.friend_id);
    if (!ids.length) return [];
    const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
    return (profs || []).map(rowToUser);
  },

  async addFriend(_username: string, friendUsername: string): Promise<string[]> {
    const id = await myId();
    const friendId = await profileIdByUsername(friendUsername);
    if (friendId === id) die("that's you");
    const { error } = await supabase.from("friendships").upsert({ user_id: id, friend_id: friendId });
    if (error) die(error.message);
    const friends = await api.getFriends(_username);
    return friends.map((f) => f.username);
  },

  // ---- groups ----
  async createGroup(g: {
    name: string;
    leader: string;
    city: string;
    radiusMiles: number;
    note?: string;
    members: string[];
  }): Promise<Group> {
    const id = await myId();
    const { data: grp, error } = await supabase
      .from("groups")
      .insert({ name: g.name, leader_id: id, city: g.city, radius_miles: g.radiusMiles, note: g.note ?? "" })
      .select()
      .single();
    if (error) die(error.message);

    const memberIds = new Set<string>([id]);
    for (const u of g.members) {
      try {
        memberIds.add(await profileIdByUsername(u));
      } catch {
        /* skip unknown usernames */
      }
    }
    await supabase.from("group_members").upsert([...memberIds].map((uid) => ({ group_id: grp.id, user_id: uid })));
    return hydrateGroup(grp);
  },

  async getGroup(id: string): Promise<Group> {
    const { data, error } = await supabase.from("groups").select("*").eq("id", id).single();
    if (error || !data) die("group not found");
    return hydrateGroup(data);
  },

  async myGroups(_username: string): Promise<Group[]> {
    const id = await myId();
    const { data: gm } = await supabase.from("group_members").select("group_id").eq("user_id", id);
    const ids = (gm || []).map((r) => r.group_id);
    if (!ids.length) return [];
    const { data: groups } = await supabase
      .from("groups")
      .select("*")
      .in("id", ids)
      .order("created_at", { ascending: false });
    return Promise.all((groups || []).map(hydrateGroup));
  },

  async addMember(id: string, username: string): Promise<Group> {
    const uid = await profileIdByUsername(username);
    const { error } = await supabase.from("group_members").upsert({ group_id: id, user_id: uid });
    if (error) die(error.message);
    return api.getGroup(id);
  },

  // ---- event profiles (auto-generate plan when all submitted) ----
  async submitEventProfile(
    id: string,
    p: { username: string; availability: string[]; budget: number; cravings: string[]; activity: string }
  ): Promise<Group & { generating: boolean }> {
    const uid = await myId();
    const { error } = await supabase.from("event_profiles").upsert({
      group_id: id,
      user_id: uid,
      availability: p.availability,
      budget: p.budget,
      cravings: p.cravings,
      activity: p.activity,
      submitted_at: new Date().toISOString(),
    });
    if (error) die(error.message);

    const g = await api.getGroup(id);
    let generating = false;
    if (g.submitted === g.total && g.total > 0 && !g.plan) {
      generating = true;
      // fire-and-forget; GroupScreen polls getGroup until plan appears
      supabase.functions.invoke("generate-plan", { body: { groupId: id } });
    }
    return { ...g, generating };
  },

  // ---- plan ----
  async getPlan(id: string): Promise<{ plan: Plan | null; submitted: number; total: number }> {
    const g = await api.getGroup(id);
    return { plan: g.plan, submitted: g.submitted, total: g.total };
  },

  async regenerate(id: string, constraint: string): Promise<{ plan: Plan }> {
    const { data, error } = await supabase.functions.invoke("generate-plan", {
      body: { groupId: id, constraint },
    });
    if (error) die(error.message);
    if ((data as any)?.error) die((data as any).error);
    return data as { plan: Plan };
  },

  async generate(id: string): Promise<{ plan: Plan }> {
    return api.regenerate(id, "");
  },
};
