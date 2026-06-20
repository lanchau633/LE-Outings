import { useState } from "react";
import { auth } from "../auth";
import { DIETARY } from "../constants";
import { Button, Chip, Note } from "../ui";
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
    <div className="flex-1 flex flex-col px-6 pt-6 pb-8">
      <div className="display text-4xl mb-1">
        LE<span className="text-lime">·</span>OUTINGS
      </div>
      <p className="text-muted mb-10">Welcome back.</p>

      <div className="space-y-3">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
          placeholder="username"
          className="w-full bg-surface border border-line rounded-2xl px-4 py-4 text-lg outline-none focus:border-purple"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          onKeyDown={(e) => e.key === "Enter" && go()}
          className="w-full bg-surface border border-line rounded-2xl px-4 py-4 text-lg outline-none focus:border-purple"
        />
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
  const [hasCar, setHasCar] = useState(false);
  const [carSeats, setCarSeats] = useState(4);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const toggleDiet = (d: string) =>
    setDietary((cur) =>
      d === "None" ? ["None"] : cur.includes(d) ? cur.filter((x) => x !== d) : [...cur.filter((x) => x !== "None"), d]
    );

  async function finish() {
    setBusy(true);
    setErr("");
    try {
      const u = await auth.signUp(username.trim(), password, {
        dietary: dietary.filter((d) => d !== "None"),
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
          <Note>If a restaurant can't accommodate your restriction, the AI will flag it — not silently pick something that excludes you.</Note>
          <div className="flex-1" />
          <Button onClick={() => setStep(2)}>CONTINUE</Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col">
          <h1 className="display text-4xl leading-[1.05] mb-3">Do you have a car?</h1>
          <p className="text-muted mb-6">Used to build the carpool plan for the group.</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setHasCar(true)}
              className={`rounded-2xl py-6 border font-bold ${hasCar ? "bg-lime/15 border-lime text-lime" : "bg-surface border-line"}`}
            >
              🚗 Yes
            </button>
            <button
              onClick={() => setHasCar(false)}
              className={`rounded-2xl py-6 border font-bold ${!hasCar ? "bg-purple border-purple text-white" : "bg-surface border-line"}`}
            >
              🚶 No
            </button>
          </div>
          {hasCar && (
            <div className="mb-6">
              <div className="display text-xs text-muted mb-2 tracking-widest">SEATS (incl. you)</div>
              <div className="flex items-center gap-4">
                <button onClick={() => setCarSeats((s) => Math.max(2, s - 1))} className="h-12 w-12 rounded-full bg-surface border border-line text-xl">−</button>
                <span className="text-2xl font-bold w-10 text-center">{carSeats}</span>
                <button onClick={() => setCarSeats((s) => Math.min(8, s + 1))} className="h-12 w-12 rounded-full bg-surface border border-line text-xl">+</button>
              </div>
            </div>
          )}
          <div className="flex-1" />
          {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
          <Button disabled={busy} onClick={finish}>
            {busy ? "CREATING…" : "CREATE ACCOUNT"}
          </Button>
        </div>
      )}
    </div>
  );
}
