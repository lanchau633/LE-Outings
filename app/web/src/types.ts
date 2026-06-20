export type User = {
  username: string;
  dietary: string[];
  hasCar: boolean;
  carSeats: number;
  friends: string[];
};

export type EventProfile = {
  availability: string[]; // ISO date strings
  budget: number;
  cravings: string[];
  activity: string;
  submittedAt?: number;
};

export type Plan = {
  title: string;
  day: string;
  time: string;
  venue: { name: string; type: string; area: string; priceLevel: string; why: string };
  alternates?: { name: string; why: string }[];
  food: { note: string; averageBudget: number };
  transportation: {
    summary: string;
    assignments: { driver: string; riders: string[] }[];
    note?: string;
  };
  reasoning: string[];
  flags: string[];
  generatedAt?: number;
  constraint?: string | null;
};

export type Group = {
  id: string;
  name: string;
  leader: string;
  city: string;
  radiusMiles: number;
  note: string;
  members: string[];
  eventProfiles: Record<string, EventProfile>;
  plan: Plan | null;
  submitted: number;
  total: number;
  memberProfiles?: User[];
};
