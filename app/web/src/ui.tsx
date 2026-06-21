import type { ReactNode } from "react";

export type Tab = "home" | "group" | "profile" | "plan";

/* ---------- phone frame ---------- */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="relative w-[400px] h-[820px] max-h-[95vh] rounded-[44px] bg-bg border border-line shadow-2xl overflow-hidden flex flex-col">
        {/* status bar */}
        <div className="flex items-center justify-between px-7 pt-4 pb-2 text-sm shrink-0">
          <span className="font-semibold">9:41</span>
          <div className="h-6 w-28 rounded-full bg-black/60 border border-line" />
          <div className="flex items-center gap-1">
            <span className="text-xs">▦</span>
            <span className="inline-block h-3 w-6 rounded-sm bg-lime" />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function TopBar({ onBack, right }: { onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 shrink-0">
      {onBack ? (
        <button
          onClick={onBack}
          className="h-11 w-11 rounded-full bg-surface border border-line grid place-items-center text-lg"
        >
          ←
        </button>
      ) : (
        <div className="h-11 w-11" />
      )}
      <div className="display text-2xl tracking-tight">
        LE<span className="text-lime">·</span>OUTINGS
      </div>
      {right ?? <div className="h-11 w-11" />}
    </div>
  );
}

export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div
      className={`h-11 w-11 rounded-full bg-mint text-black grid place-items-center font-bold text-sm ${className}`}
    >
      {initials}
    </div>
  );
}

/* ---------- buttons ---------- */
export function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "purple";
  className?: string;
  type?: "button" | "submit";
}) {
  const base =
    "w-full rounded-full py-4 font-bold text-base transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";
  const styles = {
    primary: "bg-lime text-black",
    purple: "bg-purple text-white",
    ghost: "bg-surface border border-line text-white",
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

/* ---------- selectable pill chip ---------- */
export function Chip({
  label,
  active,
  onClick,
  color = "purple",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: "purple" | "lime";
}) {
  const on =
    color === "lime"
      ? "bg-lime/15 border-lime text-lime"
      : "bg-purple border-purple text-white";
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 rounded-full border text-[15px] font-medium transition ${
        active ? on : "bg-surface border-line text-white/80"
      }`}
    >
      {label}
    </button>
  );
}

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-card border border-line rounded-3xl p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="display text-xs text-muted mb-2 tracking-widest">{label}</div>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-surface border border-line rounded-2xl px-4 py-3.5 text-white placeholder:text-muted outline-none focus:border-purple ${
        props.className ?? ""
      }`}
    />
  );
}

export function TimeRangeSlider({
  min = 0,
  max = 23,
  start,
  end,
  onStart,
  onEnd,
}: {
  min?: number;
  max?: number;
  start: number;
  end: number;
  onStart: (v: number) => void;
  onEnd: (v: number) => void;
}) {
  const range = max - min;
  const leftPct = ((start - min) / range) * 100;
  const rightPct = ((end - min) / range) * 100;
  const track = `linear-gradient(to right, #2a2a33 ${leftPct}%, #c7f24a ${leftPct}%, #c7f24a ${rightPct}%, #2a2a33 ${rightPct}%)`;
  return (
    <div className="relative h-6 flex items-center">
      <div className="absolute inset-x-0 h-1.5 rounded-full pointer-events-none" style={{ background: track }} />
      <input
        type="range" min={min} max={max} value={start}
        onChange={(e) => { const v = Number(e.target.value); onStart(Math.min(v, end - 1)); }}
        className="absolute inset-x-0 w-full pointer-events-none"
        style={{ background: "transparent" }}
      />
      <input
        type="range" min={min} max={max} value={end}
        onChange={(e) => { const v = Number(e.target.value); onEnd(Math.max(v, start + 1)); }}
        className="absolute inset-x-0 w-full pointer-events-none"
        style={{ background: "transparent" }}
      />
    </div>
  );
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        background: `linear-gradient(to right, #c7f24a ${pct}%, #2a2a33 ${pct}%)`,
      }}
    />
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 bg-surface border border-line rounded-2xl p-4 text-sm text-muted">
      <span className="text-purple shrink-0">ⓘ</span>
      <span>{children}</span>
    </div>
  );
}

export function Spinner() {
  return <span className="inline-block h-4 w-4 rounded-full border-2 border-black/30 border-t-black spin" />;
}

/* ---------- bottom nav ---------- */
const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "HOME", icon: "⌂" },
  { id: "group", label: "GROUP", icon: "👥" },
  { id: "profile", label: "PROFILE", icon: "👤" },
  { id: "plan", label: "PLAN", icon: "✦" },
];
export function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div className="shrink-0 border-t border-line bg-bg px-4 py-2 flex items-center justify-around">
      {NAV.map((n) => {
        const active = tab === n.id;
        return (
          <button key={n.id} onClick={() => setTab(n.id)} className="flex flex-col items-center gap-1 py-1 w-16">
            <span
              className={`h-9 w-9 grid place-items-center rounded-full text-base ${
                active ? "bg-lime text-black" : "text-muted"
              }`}
            >
              {n.icon}
            </span>
            <span className={`display text-[10px] tracking-widest ${active ? "text-lime" : "text-muted"}`}>
              {n.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="h-2.5 w-full rounded-full bg-surface overflow-hidden">
      <div className="h-full bg-lime rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
