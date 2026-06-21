import { useState } from "react";
import { api } from "../api";
import { DIETARY } from "../constants";
import { Avatar, Button, Card, Chip, Input } from "../ui";
import type { User } from "../types";

export function Profile({
  me,
  onSaved,
  onLogout,
}: {
  me: User;
  onSaved: (u: User) => void;
  onLogout: () => void;
}) {
  const initialDietary = me.dietary.filter((d) => DIETARY.includes(d));
  const customDietary = me.dietary.filter((d) => !DIETARY.includes(d) && d !== "Other");
  const [dietary, setDietary] = useState<string[]>(() => {
    const list = [...initialDietary];
    if (customDietary.length) {
      list.push("Other");
    }
    return list.length ? list : ["None"];
  });
  const [otherDiet, setOtherDiet] = useState(customDietary.join(", "));
  const [hasCar, setHasCar] = useState(me.hasCar);
  const [carSeats, setCarSeats] = useState(me.carSeats || 4);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (d: string) =>
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

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      const cleanDietary = dietary
        .filter((d) => d !== "None")
        .map((d) => (d === "Other" ? otherDiet.trim() : d))
        .filter(Boolean);

      const u = await api.upsertUser({
        username: me.username,
        dietary: cleanDietary,
        hasCar,
        carSeats: hasCar ? carSeats : 0,
      });
      onSaved(u);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8">
      <div className="flex flex-col items-center mb-6 mt-2">
        <Avatar name={me.username} className="h-20 w-20 text-2xl mb-3" />
        <div className="display text-2xl">{me.username}</div>
        <div className="text-muted text-sm">Base profile</div>
      </div>

      <Card className="mb-5">
        <div className="display text-xs text-muted mb-3 tracking-widest">DIETARY RESTRICTIONS</div>
        <div className="flex flex-wrap gap-3">
          {DIETARY.map((d) => (
            <Chip key={d} label={d} active={dietary.includes(d)} onClick={() => toggle(d)} />
          ))}
        </div>
        {dietary.includes("Other") && (
          <div className="mt-4">
            <div className="display text-xs text-muted tracking-widest mb-2">SPECIFY DIETARY RESTRICTION</div>
            <Input
              value={otherDiet}
              onChange={(e) => setOtherDiet(e.target.value)}
              placeholder="e.g. Keto, Celiac, Garlic allergy"
            />
          </div>
        )}
      </Card>

      <Card className="mb-6">
        <div className="display text-xs text-muted mb-3 tracking-widest">TRANSPORTATION</div>
        <div className="space-y-3 mb-3">
          {/* Yes option */}
          <button
            onClick={() => setHasCar(true)}
            className={`w-full flex items-center gap-4 bg-bg rounded-2xl px-4 py-4 border transition ${hasCar ? "border-lime/60" : "border-transparent"}`}
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
            className={`w-full flex items-center gap-4 bg-bg rounded-2xl px-4 py-4 border transition ${!hasCar ? "border-purple/60" : "border-transparent"}`}
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
        <div className="flex gap-3 bg-bg rounded-2xl px-4 py-3 text-sm text-muted">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-muted shrink-0 mt-0.5">
            <path d="M5 17H3a2 2 0 0 1-2-2v-4l2.5-6h13L19 11v4a2 2 0 0 1-2 2h-2" />
            <circle cx="7.5" cy="17.5" r="2.5" />
            <circle cx="16.5" cy="17.5" r="2.5" />
          </svg>
          <span>No per-day granularity needed — if you have a car, the AI assumes you're available to drive for any outing you're part of.</span>
        </div>
      </Card>

      <Button disabled={busy} onClick={save}>
        {busy ? "SAVING…" : saved ? "SAVED ✓" : "SAVE CHANGES"}
      </Button>
      <button onClick={onLogout} className="w-full text-center text-muted text-sm mt-4 py-2">
        Switch user
      </button>
    </div>
  );
}
