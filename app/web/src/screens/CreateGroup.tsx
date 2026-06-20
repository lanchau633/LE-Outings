import { useEffect, useState } from "react";
import { api } from "../api";
import { Button, Field, Input, Chip } from "../ui";
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
          <input
            type="range"
            min={1}
            max={50}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full accent-lime"
          />
        </Field>
        <Field label="NOTE (OPTIONAL)">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="casual dinner, nothing too expensive" />
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
