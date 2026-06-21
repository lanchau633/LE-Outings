import { useState } from "react";
import { api } from "../api";
import { Button, Card, Input, Spinner } from "../ui";
import type { ItineraryStop, Plan } from "../types";

const QUICK = ["Cheaper", "Less driving", "No seafood", "Indoor only"];

export function PlanView({
  groupId,
  plan,
  onUpdated,
}: {
  groupId: string;
  plan: Plan;
  onUpdated: (p: Plan) => void;
}) {
  const [constraint, setConstraint] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // new plans carry an itinerary; older plans only had a single venue
  const stops: ItineraryStop[] = plan.itinerary?.length
    ? plan.itinerary
    : plan.venue
    ? [{ ...plan.venue, time: plan.time }]
    : [];

  async function regen(c: string) {
    if (!c.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const r = await api.regenerate(groupId, c.trim());
      onUpdated(r.plan);
      setConstraint("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <div className="display text-2xl leading-tight">{plan.title}</div>
            <div className="text-muted text-sm mt-1">
              📅 {plan.day} · ⏰ {plan.time}
            </div>
          </div>
          <span className="text-lime text-xl">✦</span>
        </div>
      </Card>

      {/* itinerary route (falls back to a single stop for older venue-only plans) */}
      <Card>
        <div className="display text-xs text-muted mb-3 tracking-widest">THE ROUTE</div>
        <div className="space-y-4">
          {stops.map((s, i) => (
            <div key={i}>
              {i > 0 && s.travelFromPrev ? (
                <div className="text-muted text-xs pl-10 pb-2">↳ {s.travelFromPrev}</div>
              ) : null}
              <div className="flex gap-3">
                <div className="shrink-0 h-7 w-7 rounded-full bg-lime text-black grid place-items-center text-sm font-bold">
                  {s.order ?? i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold leading-snug">{s.name}</div>
                  {s.time && <div className="text-lime text-xs mt-0.5">{s.time}</div>}
                  <div className="text-muted text-sm mt-0.5">
                    {[s.type, s.area, s.priceLevel].filter(Boolean).join(" · ")}
                  </div>
                  {s.why && <p className="text-sm mt-1.5 text-white/80">💡 {s.why}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
        {plan.alternates?.length ? (
          <div className="mt-4 pt-3 border-t border-line">
            <div className="text-xs text-muted mb-1">Alternates</div>
            {plan.alternates.map((a, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium">{a.name}</span> <span className="text-muted">— {a.why}</span>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      {/* food */}
      <Card>
        <div className="display text-xs text-muted mb-2 tracking-widest">FOOD & BUDGET</div>
        <p className="text-sm text-white/80">{plan.food?.note}</p>
        {plan.food?.averageBudget != null && (
          <div className="text-muted text-sm mt-2">Avg budget: ${plan.food.averageBudget}/person</div>
        )}
      </Card>

      {/* transport */}
      <Card>
        <div className="display text-xs text-muted mb-2 tracking-widest">TRANSPORTATION</div>
        <p className="text-sm text-white/80 mb-2">{plan.transportation?.summary}</p>
        {plan.transportation?.assignments?.map((a, i) => (
          <div key={i} className="text-sm flex gap-2">
            <span className="text-lime">🚗</span>
            <span>
              <b>{a.driver}</b> drives {a.riders?.length ? `→ ${a.riders.join(", ")}` : "(solo)"}
            </span>
          </div>
        ))}
        {plan.transportation?.note && <p className="text-muted text-xs mt-2">{plan.transportation.note}</p>}
      </Card>

      {/* reasoning */}
      {plan.reasoning?.length ? (
        <Card>
          <div className="display text-xs text-muted mb-2 tracking-widest">WHY THIS PLAN</div>
          <ul className="space-y-1.5">
            {plan.reasoning.map((r, i) => (
              <li key={i} className="text-sm text-white/80 flex gap-2">
                <span className="text-lime">•</span>
                {r}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* flags */}
      {plan.flags?.length ? (
        <Card className="border-purple/50">
          <div className="display text-xs text-purple mb-2 tracking-widest">⚠ HEADS UP</div>
          <ul className="space-y-1.5">
            {plan.flags.map((f, i) => (
              <li key={i} className="text-sm text-white/80">
                {f}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {/* regenerate */}
      <Card>
        <div className="display text-xs text-muted mb-3 tracking-widest">TWEAK THE PLAN</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK.map((q) => (
            <button key={q} disabled={busy} onClick={() => regen(q)} className="px-4 py-2 rounded-full bg-surface border border-line text-sm disabled:opacity-40">
              {q}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={constraint} onChange={(e) => setConstraint(e.target.value)} placeholder="or type a change…" />
          <button onClick={() => regen(constraint)} disabled={busy || !constraint.trim()} className="px-5 rounded-2xl bg-purple text-white font-bold disabled:opacity-40 grid place-items-center min-w-14">
            {busy ? <Spinner /> : "↻"}
          </button>
        </div>
        {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
      </Card>
    </div>
  );
}
