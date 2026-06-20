import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import { Avatar, Button, Card, Input, ProgressBar, Spinner } from "../ui";
import { PlanView } from "./PlanView";
import type { Group, Plan, User } from "../types";

export function GroupScreen({
  me,
  groupId,
  onFillProfile,
}: {
  me: User;
  groupId: string;
  onFillProfile: () => void;
}) {
  const [group, setGroup] = useState<Group | null>(null);
  const [addHandle, setAddHandle] = useState("");
  const [addMsg, setAddMsg] = useState("");
  const pollRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    const g = await api.getGroup(groupId).catch(() => null);
    setGroup(g);
    return g;
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  // poll while everyone submitted but plan not posted yet (auto-generation in flight)
  useEffect(() => {
    const generating = group && group.submitted === group.total && !group.plan && group.total > 0;
    if (generating && pollRef.current == null) {
      pollRef.current = window.setInterval(load, 2500);
    }
    if (!generating && pollRef.current != null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current != null) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [group, load]);

  if (!group)
    return (
      <div className="flex-1 grid place-items-center text-muted">
        <Spinner />
      </div>
    );

  const iSubmitted = Boolean(group.eventProfiles?.[me.username]);
  const allIn = group.submitted === group.total;
  const generating = allIn && !group.plan;

  async function addMember() {
    setAddMsg("");
    try {
      await api.addMember(groupId, addHandle.trim());
      setAddHandle("");
      load();
    } catch (e) {
      setAddMsg((e as Error).message);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6">
      <h1 className="display text-4xl leading-none mb-2">{group.name}</h1>
      <p className="text-muted text-sm mb-4">
        📍 within {group.radiusMiles} mi of {group.city}
        {group.note && <> · “{group.note}”</>}
      </p>

      {/* progress */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted">
          {group.submitted} of {group.total} event profiles submitted
        </span>
        {!allIn && (
          <span className="text-purple text-sm font-bold bg-purple/15 px-3 py-1 rounded-full">
            {group.total - group.submitted} pending
          </span>
        )}
      </div>
      <ProgressBar value={group.submitted} total={group.total} />

      {/* members */}
      <div className="display text-xs text-muted mt-6 mb-3 tracking-widest">MEMBERS</div>
      <div className="space-y-2">
        {(group.memberProfiles ?? []).map((m) => {
          const done = Boolean(group.eventProfiles?.[m.username]);
          return (
            <Card key={m.username} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Avatar name={m.username} />
                <div>
                  <div className="font-semibold">
                    {m.username} {m.username === group.leader && <span className="text-lime text-xs">★ leader</span>}
                  </div>
                  <div className="text-muted text-xs">
                    {m.dietary?.length ? m.dietary.join(", ") : "No restrictions"} · {m.hasCar ? `🚗 ${m.carSeats} seats` : "no car"}
                  </div>
                </div>
              </div>
              <span className={`text-xs font-bold ${done ? "text-lime" : "text-muted"}`}>{done ? "submitted ✓" : "pending"}</span>
            </Card>
          );
        })}
      </div>

      {/* add member */}
      <div className="flex gap-2 mt-3">
        <Input value={addHandle} onChange={(e) => setAddHandle(e.target.value.replace(/\s/g, ""))} placeholder="add member by username" />
        <button onClick={addMember} disabled={!addHandle.trim()} className="px-5 rounded-2xl bg-surface border border-line font-bold disabled:opacity-40">
          +
        </button>
      </div>
      {addMsg && <p className="text-sm text-muted mt-1">{addMsg}</p>}

      {/* CTA / plan */}
      <div className="mt-6">
        {!iSubmitted ? (
          <Button onClick={onFillProfile}>FILL YOUR EVENT PROFILE</Button>
        ) : generating ? (
          <Card className="text-center py-8">
            <div className="flex justify-center mb-3">
              <span className="inline-block h-6 w-6 rounded-full border-2 border-line border-t-lime spin" />
            </div>
            <div className="display text-lg">Generating your plan…</div>
            <p className="text-muted text-sm mt-1">Cross-referencing availability, budgets & cars.</p>
          </Card>
        ) : group.plan ? (
          <>
            <div className="display text-xs text-muted mb-3 tracking-widest">THE PLAN</div>
            <PlanView groupId={groupId} plan={group.plan} onUpdated={(p: Plan) => setGroup({ ...group, plan: p })} />
          </>
        ) : (
          <Card className="text-center py-6">
            <p className="text-muted text-sm">You're in. Waiting on {group.total - group.submitted} more to submit.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
