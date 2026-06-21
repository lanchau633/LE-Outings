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
  const [genBusy, setGenBusy] = useState(false);
  const pollRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    const g = await api.getGroup(groupId).catch(() => null);
    setGroup(g);
    return g;
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  // poll while a generation is in flight (auto or manual, possibly started by a partner)
  useEffect(() => {
    const generating = group?.planStatus === "generating";
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
  const allIn = group.submitted === group.total && group.total > 0;
  const generating = group.planStatus === "generating";
  const stale = Boolean(group.plan?.stale);

  async function addMember() {
    setAddMsg("");
    try {
      const g = await api.addMember(groupId, addHandle.trim());
      setAddHandle("");
      setGroup(g);
    } catch (e) {
      setAddMsg((e as Error).message);
    }
  }

  async function toggleLongDistance() {
    const g = await api.setLongDistance(groupId, !group!.longDistance).catch(() => null);
    if (g) setGroup(g);
  }

  async function generateNow() {
    setGenBusy(true);
    setAddMsg("");
    try {
      const r = await api.generate(groupId);
      setGroup({ ...group!, plan: r.plan, planStatus: "ready" });
    } catch (e) {
      setAddMsg((e as Error).message);
    } finally {
      setGenBusy(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6">
      <h1 className="display text-4xl leading-none mb-2">{group.name}</h1>
      <p className="text-muted text-sm mb-3">
        📍 within {group.radiusMiles} mi of {group.city}
        {group.note && <> · “{group.note}”</>}
      </p>

      {/* long-distance / international toggle */}
      <button
        onClick={toggleLongDistance}
        className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3 mb-4 text-left transition ${
          group.longDistance ? "bg-purple/15 border-purple" : "bg-surface border-line"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{group.longDistance ? "✈️" : "🚗"}</span>
          <div>
            <div className="text-sm font-semibold">
              {group.longDistance ? "Long-distance / international" : "Local trip"}
            </div>
            <div className="text-muted text-xs">
              {group.longDistance ? "Skips car & seat planning" : "Uses cars & seats for transport"}
            </div>
          </div>
        </div>
        <span
          className={`h-6 w-11 rounded-full p-0.5 transition ${group.longDistance ? "bg-purple" : "bg-line"}`}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-white transition ${group.longDistance ? "translate-x-5" : ""}`}
          />
        </span>
      </button>

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
            <div className="display text-lg">Generating your itinerary…</div>
            <p className="text-muted text-sm mt-1">Building a route from everyone's availability, budgets & activities.</p>
          </Card>
        ) : group.plan ? (
          <>
            {stale && (
              <Card className="border-purple/60 mb-3">
                <div className="display text-xs text-purple mb-1 tracking-widest">⚠ GROUP CHANGED</div>
                <p className="text-sm text-white/80 mb-3">
                  Someone joined since this plan was made. It will auto-refresh once everyone submits — or regenerate now.
                </p>
                <Button variant="purple" disabled={genBusy} onClick={generateNow}>
                  {genBusy ? "REGENERATING…" : "REGENERATE NOW"}
                </Button>
              </Card>
            )}
            <div className="display text-xs text-muted mb-3 tracking-widest">THE PLAN</div>
            <PlanView groupId={groupId} plan={group.plan} onUpdated={(p: Plan) => setGroup({ ...group, plan: p })} />
          </>
        ) : allIn ? (
          <Card className="text-center py-6">
            <p className="text-muted text-sm mb-3">Everyone's in. Ready to build your itinerary.</p>
            <Button disabled={genBusy} onClick={generateNow}>
              {genBusy ? "GENERATING…" : "GENERATE PLAN"}
            </Button>
          </Card>
        ) : (
          <Card className="text-center py-6">
            <p className="text-muted text-sm">You're in. Waiting on {group.total - group.submitted} more to submit.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
