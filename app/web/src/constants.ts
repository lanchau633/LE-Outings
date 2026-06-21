export const DIETARY = [
  "None",
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Halal",
  "Kosher",
  "Pescatarian",
  "Nut-Free",
  "Dairy-Free",
  "Other",
];

export const CRAVINGS = [
  "Thai",
  "Mexican",
  "Indian",
  "Italian",
  "Japanese",
  "Korean BBQ",
  "Mediterranean",
  "American",
  "Chinese",
  "Pizza",
  "Other",
];

// next 10 days as ISO date strings
export function next10Days(): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < 10; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

export function fmtHour(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

export function fmtDay(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return {
    dow: d.toLocaleDateString(undefined, { weekday: "short" }),
    day: d.getDate(),
    mon: d.toLocaleDateString(undefined, { month: "short" }),
  };
}
