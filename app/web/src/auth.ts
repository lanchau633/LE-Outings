import { supabase, toEmail } from "./supabase";
import type { User } from "./types";

type Row = {
  id: string;
  username: string;
  dietary: string[];
  has_car: boolean;
  car_seats: number;
};

export const rowToUser = (r: Row): User => ({
  username: r.username,
  dietary: r.dietary ?? [],
  hasCar: r.has_car,
  carSeats: r.car_seats ?? 0,
  friends: [],
});

export const auth = {
  async signUp(
    username: string,
    password: string,
    profile: { dietary: string[]; hasCar: boolean; carSeats: number }
  ): Promise<User> {
    const uname = username.toLowerCase().trim();

    // Reject duplicate usernames up front (friendlier than the auth error).
    const { data: existing } = await supabase.from("profiles").select("id").eq("username", uname).maybeSingle();
    if (existing) throw new Error("That username is taken.");

    // Create the auth user. If a prior signup created the auth user but failed
    // before writing the profile (Bug #5), recover by signing into that orphan
    // with the same password instead of erroring out.
    let userId: string;
    const { data, error } = await supabase.auth.signUp({ email: toEmail(uname), password });
    if (error) {
      if (/already registered/i.test(error.message)) {
        const { data: si, error: se } = await supabase.auth.signInWithPassword({
          email: toEmail(uname),
          password,
        });
        if (se || !si.user) throw new Error("That username is taken.");
        userId = si.user.id;
      } else {
        throw new Error(error.message);
      }
    } else {
      if (!data.session)
        throw new Error(
          "Account made but no session — disable “Confirm email” in Supabase → Authentication → Providers → Email, then sign in."
        );
      userId = data.user!.id;
    }

    // Upsert (not insert) so the recovery path is idempotent.
    const { data: row, error: pErr } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        username: uname,
        dietary: profile.dietary,
        has_car: profile.hasCar,
        car_seats: profile.carSeats,
      })
      .select()
      .single();
    if (pErr) {
      // Don't leave the user signed into a half-made account.
      await supabase.auth.signOut();
      throw new Error(pErr.message);
    }
    return rowToUser(row as Row);
  },

  async signIn(username: string, password: string): Promise<User> {
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(username),
      password,
    });
    if (error) throw new Error("Invalid username or password.");
    const me = await auth.getMyProfile();
    if (!me) throw new Error("Profile missing for this account.");
    return me;
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getMyProfile(): Promise<User | null> {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return null;
    const { data: row } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", s.session.user.id)
      .single();
    return row ? rowToUser(row as Row) : null;
  },

  async myId(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  },
};
