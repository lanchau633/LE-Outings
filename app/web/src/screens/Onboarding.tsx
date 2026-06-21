import { useState } from "react";
import { auth } from "../auth";
import { DIETARY } from "../constants";
import { Button, Chip, Input, Note } from "../ui";
import type { User } from "../types";

export function Onboarding({ onDone }: { onDone: (u: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  return mode === "login" ? (
    <Login onDone={onDone} toSignup={() => setMode("signup")} />
  ) : (
    <Signup onDone={onDone} toLogin={() => setMode("login")} />
  );
}

/* ---------------- LOGIN ---------------- */
function Login({ onDone, toSignup }: { onDone: (u: User) => void; toSignup: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    setBusy(true);
    setErr("");
    try {
      onDone(await auth.signIn(username.trim(), password));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-4 pb-8">
      {/* Logo */}
      <div className="display text-2xl mb-5">
        LE<span className="text-lime">·</span>OUTINGS
      </div>

      {/* Progress bar — 3 segments, first active */}
      <div className="flex gap-2 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i === 0 ? "bg-lime" : "bg-surface"}`} />
        ))}
      </div>

      {/* Heading */}
      <h1 className="display text-4xl leading-[1.05] mb-2">WELCOME BACK.</h1>
      <p className="text-muted text-sm mb-8">Sign in to see what's planned.</p>

      {/* Fields */}
      <div className="space-y-5">
        <div>
          <div className="display text-xs text-muted tracking-widest mb-2">USERNAME</div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              placeholder="yourname"
              className="w-full bg-card border border-transparent rounded-2xl pl-9 pr-4 py-4 text-base text-white placeholder:text-muted outline-none focus:border-purple transition"
            />
          </div>
        </div>
        <div>
          <div className="display text-xs text-muted tracking-widest mb-2">PASSWORD</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && go()}
            className="w-full bg-card border border-transparent rounded-2xl px-4 py-4 text-base text-white placeholder:text-muted outline-none focus:border-purple transition"
          />
        </div>
      </div>

      <div className="flex-1" />
      {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
      <Button disabled={busy || username.trim().length < 2 || !password} onClick={go}>
        {busy ? "SIGNING IN…" : "LOG IN"}
      </Button>
      <button onClick={toSignup} className="text-muted text-sm mt-4 py-2">
        New here? <span className="text-lime font-bold">Create an account</span>
      </button>
    </div>
  );
}

/* ---------------- SIGNUP ---------------- */
function Signup({ onDone, toLogin }: { onDone: (u: User) => void; toLogin: () => void }) {
  const [step, setStep] = useState(0); // 0 creds, 1 dietary, 2 car
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [dietary, setDietary] = useState<string[]>(["None"]);
  const [otherDiet, setOtherDiet] = useState("");
  const [hasCar, setHasCar] = useState(false);
  const [carSeats, setCarSeats] = useState(4);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const toggleDiet = (d: string) =>
    setDietary((cur) => {
      if (d === "None") {
        setOtherDiet("");
        return ["None"];
      }
      const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur.filter((x) => x !== "None"), d];
      if (!next.includes("Other")) {
        setOtherDiet("");
      }
      return next;
    });

  async function finish() {
    setBusy(true);
    setErr("");
    try {
      const cleanDietary = dietary
        .filter((d) => d !== "None")
        .map((d) => (d === "Other" ? otherDiet.trim() : d))
        .filter(Boolean);

      const u = await auth.signUp(username.trim(), password, {
        dietary: cleanDietary,
        hasCar,
        carSeats: hasCar ? carSeats : 0,
      });
      onDone(u);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-2 pb-8 overflow-y-auto no-scrollbar">
      <div className="display text-2xl mb-6">
        LE<span className="text-lime">·</span>OUTINGS
      </div>
      <div className="flex gap-2 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-lime" : "bg-surface"}`} />
        ))}
      </div>

      {step === 0 && (
        <div className="flex-1 flex flex-col">
          <h1 className="display text-4xl leading-[1.05] mb-3">Create your account</h1>
          <p className="text-muted mb-6">Pick a unique username and a password.</p>
          <div className="space-y-3">
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              placeholder="username"
              className="w-full bg-surface border border-line rounded-2xl px-4 py-4 text-lg outline-none focus:border-purple"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password (min 6 chars)"
              className="w-full bg-surface border border-line rounded-2xl px-4 py-4 text-lg outline-none focus:border-purple"
            />
          </div>
          <div className="flex-1" />
          {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
          <Button disabled={username.trim().length < 2 || password.length < 6} onClick={() => setStep(1)}>
            CONTINUE
          </Button>
          <button onClick={toLogin} className="text-muted text-sm mt-4 py-2">
            Have an account? <span className="text-lime font-bold">Log in</span>
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="flex-1 flex flex-col">
          <h1 className="display text-4xl leading-[1.05] mb-3">Any dietary restrictions?</h1>
          <p className="text-muted mb-5">The AI uses this every time it picks food for your group.</p>
          <div className="flex flex-wrap gap-3 mb-5">
            {DIETARY.map((d) => (
              <Chip key={d} label={d} active={dietary.includes(d)} onClick={() => toggleDiet(d)} />
            ))}
          </div>
          {dietary.includes("Other") && (
            <div className="mb-5">
              <div className="display text-xs text-muted tracking-widest mb-2">SPECIFY DIETARY RESTRICTION</div>
              <Input
                value={otherDiet}
                onChange={(e) => setOtherDiet(e.target.value)}
                placeholder="e.g. Keto, Celiac, Garlic allergy"
              />
            </div>
          )}
          <Note>If a restaurant can't accommodate your restriction, the AI will flag it — not silently pick something that excludes you.</Note>
          <div className="flex-1" />
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setStep(0)}>BACK</Button>
            <Button className="flex-1" onClick={() => setStep(2)}>CONTINUE</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col">
          <h1 className="display text-4xl leading-[1.05] mb-3">Do you have a car?</h1>
          <p className="text-muted mb-6">Used to assign transportation — who drives, who rides.</p>

          <div className="space-y-3 mb-6">
            {/* Yes option */}
            <button
              onClick={() => setHasCar(true)}
              className={`w-full flex items-center gap-4 bg-card rounded-2xl px-4 py-4 border transition ${hasCar ? "border-lime/60" : "border-transparent"}`}
            >
              <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${hasCar ? "bg-lime/15" : "bg-surface"}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={hasCar ? "text-lime" : "text-muted"}>
                  <path d="M5 17H3a2 2 0 0 1-2-2v-4l2.5-6h13L19 11v4a2 2 0 0 1-2 2h-2" />
                  <circle cx="7.5" cy="17.5" r="2.5" />
                  <circle cx="16.5" cy="17.5" r="2.5" />
                </svg>
              </div>
              <div className="text-left">
                <div className={`font-semibold text-base ${hasCar ? "text-white" : "text-white/80"}`}>Yes, I have a car</div>
                <div className="text-muted text-sm">I'm available to drive for the group</div>
              </div>
            </button>

            {/* No option */}
            <button
              onClick={() => setHasCar(false)}
              className={`w-full flex items-center gap-4 bg-card rounded-2xl px-4 py-4 border transition ${!hasCar ? "border-purple/60" : "border-transparent"}`}
            >
              <div className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${!hasCar ? "bg-purple/15" : "bg-surface"}`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={!hasCar ? "text-purple" : "text-muted"}>
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v6l-3 3M12 13l3 3" />
                  <path d="M9 21h6" />
                </svg>
              </div>
              <div className="text-left">
                <div className={`font-semibold text-base ${!hasCar ? "text-white" : "text-white/80"}`}>No car</div>
                <div className="text-muted text-sm">I'll need a ride or use transit</div>
              </div>
            </button>
          </div>

          {/* Info note */}
          <div className="flex gap-3 bg-card rounded-2xl px-4 py-3 text-sm text-muted border border-transparent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-muted shrink-0 mt-0.5">
              <path d="M5 17H3a2 2 0 0 1-2-2v-4l2.5-6h13L19 11v4a2 2 0 0 1-2 2h-2" />
              <circle cx="7.5" cy="17.5" r="2.5" />
              <circle cx="16.5" cy="17.5" r="2.5" />
            </svg>
            <span>No per-day granularity needed — if you have a car, the AI assumes you're available to drive for any outing you're part of.</span>
          </div>

          <div className="flex-1" />
          {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>BACK</Button>
            <Button className="flex-1" disabled={busy} onClick={finish}>
              {busy ? "CREATING…" : "SET UP MY PROFILE"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
