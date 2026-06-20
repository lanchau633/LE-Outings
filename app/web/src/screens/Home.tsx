import { useEffect, useState } from "react";
import { api } from "../api";
import { Avatar, Button, Card, Input } from "../ui";
import type { Group, User } from "../types";

export function Home({
  me,
  onOpenGroup,
  onCreateGroup,
}: {
  me: User;
  onOpenGroup: (id: string) => void;
  onCreateGroup: () => void;
}) {
  const [friends, setFriends] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [handle, setHandle] = useState("");
  const [msg, setMsg] = useState("");

  async function refresh() {
    setFriends(await api.getFriends(me.username).catch(() => []));
    setGroups(await api.myGroups(me.username).catch(() => []));
  }
  useEffect(() => {
    refresh();
  }, [me.username]);

  async function add() {
    setMsg("");
    try {
      await api.addFriend(me.username, handle.trim());
      setHandle("");
      setMsg(`Added @${handle.trim()}`);
      refresh();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6">
      <h1 className="display text-3xl mb-1">Hey, {me.username} 👋</h1>
      <p className="text-muted mb-5">Plan your next outing.</p>

      <Card className="mb-5">
        <div className="display text-xs text-muted mb-3 tracking-widest">ADD A FRIEND</div>
        <div className="flex gap-2">
          <Input
            value={handle}
            onChange={(e) => setHandle(e.target.value.replace(/\s/g, ""))}
            placeholder="username"
          />
          <button onClick={add} disabled={!handle.trim()} className="px-5 rounded-2xl bg-lime text-black font-bold disabled:opacity-40">
            +
          </button>
        </div>
        {msg && <p className="text-sm text-muted mt-2">{msg}</p>}
        {friends.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {friends.map((f) => (
              <div key={f.username} className="flex items-center gap-2 bg-surface border border-line rounded-full pl-1 pr-3 py-1">
                <Avatar name={f.username} className="h-7 w-7 text-xs" />
                <span className="text-sm">{f.username}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between mb-3">
        <div className="display text-xs text-muted tracking-widest">YOUR GROUPS</div>
        <button onClick={onCreateGroup} className="text-lime text-sm font-bold">
          + New group
        </button>
      </div>

      {groups.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-muted mb-4">No groups yet.</p>
          <Button onClick={onCreateGroup}>CREATE YOUR FIRST GROUP</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <button key={g.id} onClick={() => onOpenGroup(g.id)} className="w-full text-left">
              <Card className="flex items-center justify-between">
                <div>
                  <div className="display text-xl">{g.name}</div>
                  <div className="text-muted text-sm">
                    📍 {g.city} · {g.total} member{g.total > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-right">
                  {g.plan ? (
                    <span className="text-lime text-sm font-bold">Plan ready ✦</span>
                  ) : (
                    <span className="text-purple text-sm font-bold">
                      {g.submitted}/{g.total} in
                    </span>
                  )}
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
