import { useEffect, useState } from "react";
import { api } from "../api";
import { Button, Field, Input, Chip, RangeSlider } from "../ui";
import { fmtHour } from "../constants";
import type { Group, User } from "../types";

export function CreateGroup({
  me,
  onCreated,
}: {
  me: User;
  onCreated: (g: Group) => void;
}) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState(15);
  const [startHour, setStartHour] = useState(12);
  const [endHour, setEndHour] = useState(22);
  const [note, setNote] = useState("");
  const [friends, setFriends] = useState<User[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.getFriends(me.username).then(setFriends).catch(() => setFriends([]));
  }, [me.username]);

  const toggle = (u: string) =>
    setPicked((p) => (p.includes(u) ? p.filter((x) => x !== u) : [...p, u]));

  async function create() {
    setBusy(true);
    setErr("");
    try {
      const g = await api.createGroup({
        name: name.trim(),
        leader: me.username,
        city: city.trim(),
        radiusMiles: radius,
        startHour,
        endHour,
        note: note.trim(),
        members: picked,
      });
      onCreated(g);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8">
      <h1 className="display text-3xl mb-6">New Group</h1>
      <div className="space-y-5">
        <Field label="GROUP NAME">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Weekend Crew" />
        </Field>
        <Field label="DESTINATION CITY">
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Irvine, CA" />
        </Field>
        <Field label={`RADIUS — within ${radius} miles`}>
          <RangeSlider min={1} max={50} value={radius} onChange={setRadius} />
        </Field>

        {/* time window */}
        <div>
          <div className="display text-xs text-muted mb-3 tracking-widest">
            TIME WINDOW — {fmtHour(startHour)} to {fmtHour(endHour)}
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted mb-1.5">Start</div>
              <RangeSlider min={0} max={23} value={startHour} onChange={(v) => {
                setStartHour(v);
                if (v >= endHour) setEndHour(Math.min(23, v + 1));
              }} />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>12 AM</span><span>11 PM</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1.5">End</div>
              <RangeSlider min={0} max={23} value={endHour} onChange={(v) => {
                setEndHour(v);
                if (v <= startHour) setStartHour(Math.max(0, v - 1));
              }} />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>12 AM</span><span>11 PM</span>
              </div>
            </div>
          </div>
          <p className="text-muted text-xs mt-2">
            The AI plans within this window. Activities that don't fit are listed as alternates.
          </p>
        </div>

        <Field label="NOTE / LABEL (OPTIONAL)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Birthday trip" />
          <p className="text-muted text-xs mt-1">
            Just a label shown to the group — the AI plans only from each member's event profile.
          </p>
        </Field>

        <div>
          <div className="display text-xs text-muted mb-3 tracking-widest">
            INVITE FRIENDS {picked.length > 0 && `· ${picked.length} selected`}
          </div>
          {friends.length === 0 ? (
            <p className="text-muted text-sm">No friends yet — add some from Home. You can also make a solo group.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {friends.map((f) => (
                <Chip key={f.username} label={f.username} active={picked.includes(f.username)} onClick={() => toggle(f.username)} color="lime" />
              ))}
            </div>
          )}
        </div>
        <p className="text-muted text-xs">You ({me.username}) are added automatically as group leader.</p>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <Button disabled={busy || !name.trim() || !city.trim()} onClick={create}>
          {busy ? "CREATING…" : "CREATE GROUP"}
        </Button>
      </div>
    </div>
  );
}
