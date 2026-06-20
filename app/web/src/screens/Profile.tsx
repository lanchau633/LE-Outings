import { useState } from "react";
import { api } from "../api";
import { DIETARY } from "../constants";
import { Avatar, Button, Card, Chip } from "../ui";
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
  const [dietary, setDietary] = useState<string[]>(me.dietary.length ? me.dietary : ["None"]);
  const [hasCar, setHasCar] = useState(me.hasCar);
  const [carSeats, setCarSeats] = useState(me.carSeats || 4);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (d: string) =>
    setDietary((cur) =>
      d === "None"
        ? ["None"]
        : cur.includes(d)
          ? cur.filter((x) => x !== d)
          : [...cur.filter((x) => x !== "None"), d]
    );

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      const u = await api.upsertUser({
        username: me.username,
        dietary: dietary.filter((d) => d !== "None"),
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
      </Card>

      <Card className="mb-6">
        <div className="display text-xs text-muted mb-3 tracking-widest">TRANSPORTATION</div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setHasCar(true)} className={`rounded-2xl py-4 border font-bold ${hasCar ? "bg-lime/15 border-lime text-lime" : "bg-surface border-line"}`}>
            🚗 Has car
          </button>
          <button onClick={() => setHasCar(false)} className={`rounded-2xl py-4 border font-bold ${!hasCar ? "bg-purple border-purple text-white" : "bg-surface border-line"}`}>
            🚶 No car
          </button>
        </div>
        {hasCar && (
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm text-muted">Seats</span>
            <button onClick={() => setCarSeats((s) => Math.max(2, s - 1))} className="h-10 w-10 rounded-full bg-surface border border-line">−</button>
            <span className="text-xl font-bold w-8 text-center">{carSeats}</span>
            <button onClick={() => setCarSeats((s) => Math.min(8, s + 1))} className="h-10 w-10 rounded-full bg-surface border border-line">+</button>
          </div>
        )}
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
