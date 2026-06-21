import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import { Avatar, Button, Card, Chip, Input, ProgressBar, Spinner } from "../ui";
import { PlanView } from "./PlanView";
import type { Group, Plan, User } from "../types";
import { fmtDay, next10Days } from "../constants";

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
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const viewedProfile = selectedMemberName ? group?.eventProfiles?.[selectedMemberName] : null;
  const viewedUser = selectedMemberName ? group?.memberProfiles?.find((u) => u.username === selectedMemberName) : null;

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
            <Card
              key={m.username}
              className={`flex items-center justify-between py-3 transition ${
                done ? "cursor-pointer hover:border-lime/40 hover:bg-surface/30 active:scale-[0.99]" : ""
              }`}
              onClick={() => {
                if (done) {
                  setSelectedMemberName(m.username);
                }
              }}
            >
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
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${done ? "text-lime" : "text-muted"}`}>{done ? "submitted ✓" : "pending"}</span>
                {done && <span className="text-[10px] text-lime/60 opacity-60">ⓘ</span>}
              </div>
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

      {selectedMemberName && viewedProfile && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm max-h-[90%] overflow-y-auto no-scrollbar border border-line flex flex-col p-6 relative bg-card shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setSelectedMemberName(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-surface border border-line flex items-center justify-center text-sm hover:border-lime/40 transition"
            >
              ✕
            </button>

            {/* Header / Avatar */}
            <div className="flex flex-col items-center mb-6 mt-2">
              <Avatar name={selectedMemberName} className="h-16 w-16 text-xl mb-2 bg-mint" />
              <div className="display text-xl">{selectedMemberName}</div>
              <div className="text-muted text-xs">Event Profile (Read-Only)</div>
            </div>

            <div className="space-y-6">
              {/* Availability */}
              <div>
                <div className="display text-xs text-muted mb-2 tracking-widest">
                  AVAILABILITY
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {next10Days().map((d) => {
                    const { dow, day } = fmtDay(d);
                    const on = viewedProfile.availability?.includes(d);
                    return (
                      <div
                        key={d}
                        className={`rounded-xl py-2 border flex flex-col items-center justify-center text-center select-none ${
                          on
                            ? "bg-lime/15 border-lime text-lime font-bold"
                            : "bg-surface/50 border-line/50 text-muted/50"
                        }`}
                      >
                        <span className="text-[9px] uppercase opacity-70">{dow}</span>
                        <span className="text-sm font-bold">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Personal Budget */}
              <div>
                <div className="display text-xs text-muted mb-2 tracking-widest">
                  PERSONAL BUDGET
                </div>
                <div className="bg-surface border border-line rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/90">Budget Limit</span>
                  <span className="text-lime font-bold text-lg">${viewedProfile.budget}</span>
                </div>
              </div>

              {/* Dietary Restrictions (Base Profile data) */}
              {viewedUser && (
                <div>
                  <div className="display text-xs text-muted mb-2 tracking-widest">
                    DIETARY RESTRICTIONS
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {viewedUser.dietary?.length ? (
                      viewedUser.dietary.map((d) => (
                        <div
                          key={d}
                          className="px-3 py-1.5 rounded-full border border-line bg-surface text-xs text-white"
                        >
                          {d}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted">No restrictions</span>
                    )}
                  </div>
                </div>
              )}

              {/* Transportation (Base Profile data) */}
              {viewedUser && (
                <div>
                  <div className="display text-xs text-muted mb-2 tracking-widest">
                    TRANSPORTATION
                  </div>
                  <div className="bg-surface border border-line rounded-2xl p-4 text-xs text-white/90">
                    {viewedUser.hasCar ? (
                      <div className="flex items-center gap-2">
                        <span>🚗</span>
                        <span>
                          Has a car ({viewedUser.carSeats} seats available)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>🚶</span>
                        <span>No car (needs a ride or transit)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Food Cravings */}
              <div>
                <div className="display text-xs text-muted mb-2 tracking-widest">
                  FOOD CRAVINGS
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {viewedProfile.cravings?.length ? (
                    viewedProfile.cravings.map((c) => (
                      <div
                        key={c}
                        className="px-3 py-1.5 rounded-full border border-lime bg-lime/10 text-xs text-lime"
                      >
                        {c}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted">No specific cravings</span>
                  )}
                </div>
              </div>

              {/* Specific Activity */}
              <div>
                <div className="display text-xs text-muted mb-2 tracking-widest">
                  SPECIFIC ACTIVITY
                </div>
                <div className="bg-surface border border-line rounded-2xl p-4 text-sm">
                  {viewedProfile.activity?.trim() ? (
                    <span className="text-white font-medium">{viewedProfile.activity}</span>
                  ) : (
                    <span className="text-muted italic">None specified</span>
                  )}
                </div>
              </div>
            </div>
            
            <Button variant="ghost" onClick={() => setSelectedMemberName(null)} className="mt-6">
              CLOSE
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
