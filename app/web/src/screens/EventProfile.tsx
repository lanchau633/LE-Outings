import { useState } from "react";
import { api } from "../api";
import { CRAVINGS, fmtDay, next10Days } from "../constants";
import { Button, Chip, Field, Input, Note, RangeSlider } from "../ui";
import type { User } from "../types";

export function EventProfileForm({
  me,
  groupId,
  onSubmitted,
}: {
  me: User;
  groupId: string;
  onSubmitted: (generating: boolean) => void;
}) {
  const days = next10Days();
  const [availability, setAvailability] = useState<string[]>([]);
  const [budget, setBudget] = useState(30);
  const [cravings, setCravings] = useState<string[]>([]);
  const [otherCrave, setOtherCrave] = useState("");
  const [activity, setActivity] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const toggleDay = (d: string) =>
    setAvailability((a) => (a.includes(d) ? a.filter((x) => x !== d) : [...a, d]));
  const toggleCrave = (c: string) =>
    setCravings((a) => {
      const next = a.includes(c) ? a.filter((x) => x !== c) : [...a, c];
      if (!next.includes("Other")) {
        setOtherCrave("");
      }
      return next;
    });

  async function submit() {
    setBusy(true);
    setErr("");
    try {
      const cleanCravings = cravings
        .map((c) => (c === "Other" ? otherCrave.trim() : c))
        .filter(Boolean);

      const r = await api.submitEventProfile(groupId, {
        username: me.username,
        availability,
        budget,
        cravings: cleanCravings,
        activity: activity.trim(),
      });
      onSubmitted(r.generating);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8">
      <h1 className="display text-3xl mb-1">Your event profile</h1>
      <p className="text-muted mb-6">Tell the AI what works for you this time.</p>

      <div className="space-y-7">
        <div>
          <div className="display text-xs text-muted mb-3 tracking-widest">
            AVAILABILITY — next 10 days {availability.length > 0 && `· ${availability.length} picked`}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {days.map((d) => {
              const { dow, day } = fmtDay(d);
              const on = availability.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`rounded-2xl py-3 border flex flex-col items-center ${on ? "bg-lime/15 border-lime text-lime" : "bg-surface border-line"}`}
                >
                  <span className="text-[10px] uppercase opacity-70">{dow}</span>
                  <span className="text-lg font-bold">{day}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Field label={`PERSONAL BUDGET — $${budget}`}>
          <RangeSlider min={5} max={150} step={5} value={budget} onChange={setBudget} />
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>$5</span>
            <span>$150</span>
          </div>
        </Field>

        <div>
          <div className="display text-xs text-muted mb-3 tracking-widest">FOOD CRAVINGS (OPTIONAL)</div>
          <div className="flex flex-wrap gap-3">
            {CRAVINGS.map((c) => (
              <Chip key={c} label={c} active={cravings.includes(c)} onClick={() => toggleCrave(c)} color="lime" />
            ))}
          </div>
          {cravings.includes("Other") && (
            <div className="mt-4">
              <div className="display text-xs text-muted tracking-widest mb-2">SPECIFY OTHER CRAVING</div>
              <Input
                value={otherCrave}
                onChange={(e) => setOtherCrave(e.target.value)}
                placeholder="e.g. Sushi, Burgers, Vietnamese"
              />
            </div>
          )}
        </div>

        <Field label="SPECIFIC ACTIVITY (OPTIONAL)">
          <Input value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="e.g. bowling, arcade" />
        </Field>

        <Note>The plan auto-generates once everyone in the group submits their event profile.</Note>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <Button disabled={busy || availability.length === 0} onClick={submit}>
          {busy ? "SUBMITTING…" : "SUBMIT EVENT PROFILE"}
        </Button>
      </div>
    </div>
  );
}
