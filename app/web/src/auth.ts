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
    const { data, error } = await supabase.auth.signUp({ email: toEmail(uname), password });
    if (error) {
      if (/already registered/i.test(error.message)) throw new Error("That username is taken.");
      throw new Error(error.message);
    }
    if (!data.session)
      throw new Error(
        "Account made but no session — disable “Confirm email” in Supabase → Authentication → Providers → Email, then sign in."
      );
    const { data: row, error: pErr } = await supabase
      .from("profiles")
      .insert({
        id: data.user!.id,
        username: uname,
        dietary: profile.dietary,
        has_car: profile.hasCar,
        car_seats: profile.carSeats,
      })
      .select()
      .single();
    if (pErr) throw new Error(pErr.message);
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
