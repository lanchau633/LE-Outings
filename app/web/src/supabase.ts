import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = Boolean(url && anon);

// Falls back to harmless placeholders if unconfigured so the app still mounts
// and shows the "configure Supabase" banner instead of crashing.
export const supabase = createClient(url || "http://localhost", anon || "public-anon-key");

// usernames are mapped to synthetic emails so Supabase Auth (email-based) can
// power a username-only login UX.
export const EMAIL_DOMAIN = "le-outings.app";
export const toEmail = (username: string) => `${username.toLowerCase().trim()}@${EMAIL_DOMAIN}`;
