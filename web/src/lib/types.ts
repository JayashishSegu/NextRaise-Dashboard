// Shapes returned by the production /api/overview and /api/screen endpoints.

export type View = "overall" | "influencer" | "perf";

export type OverviewData = {
  counts: number[]; // [0]=users since 1 May, [7]=active Pro, [11]=expired Pro, [12]=lapsed 30d …
  curSignups: number;
  prevSignups: number | null;
  revInr: number;
  revUsd: number;
  revPayers: number;
  revInrPayers: number;
  revUsdPayers: number;
  prevRevInr: number | null;
  prevRevUsd: number | null;
  prevPayCount: number | null;
  growth: Array<[string, number]>; // [day, signups]
  dailyPay: Array<[string, number, number, number]>; // [day, payments, inr, usd]
  todayPay: Array<[string, number, number, number, number]>; // [day, cnt, payers, inr, usd]
  sources: Array<[string, string, number, number]>; // [source, medium, signups, proCohort]
  payersBySource: Array<[string, string, number]>;
  visitorsBySource: Array<[string, string, number]>;
  influencers: Array<[string, number, number]>; // [campaign, signups, pro]
  signups: Array<[string, string, string, string]>; // [email, name, plan, createdAt]
  payments: Array<[string, string, string, string, number, string]>; // [email, name, plan, createdAt, amount, currency]
  sameWin: [number, number, number] | null;
  convByPeriod: Array<{ key: string; label: string; signups: number; pro: number; rate: number }>;
  subsOk: boolean;
  proCancelled: number | null;
};

export type ReportData = {
  startD: string;
  endD: string;
  signups: number;
  sales: number;
  payers: number;
  inr: number;
  usd: number;
  google: Array<{ cid: string; spend: number; impr: number; clicks: number }>;
  meta: { spend: number; impr: number; clicks: number };
  creators: Array<{ code: string; signups: number; sales: number }>;
  trend: {
    signups: Array<[string, number]>;
    revenueParts: Array<[string, number, number]>; // [day, inr, usd]
  };
  bucket: null | {
    influencer: { signups: number; sales: number; inr: number; usd: number };
    perf: { signups: number; sales: number; inr: number; usd: number };
  };
};

export type DailyData = {
  ev: Array<[string, number, number]>; // [day, signups(events), activations]
  pay: Array<[string, number, number, number]>; // [day, inr, usd, payments]
  su?: Array<[string, number]>; // [day, signups(postgres.users)] when the server provides it
};

export type InsightsData = {
  funnel: number[]; // [signed, onboardingStart, onboardingDone, resumeUpload, paid]
};

export type ApiEnvelope<T> = {
  ts: number;
  stale?: boolean;
  range?: string;
  view?: string;
  data: T;
};

export type MonetizationData = {
  plans: Array<[string | null, number, number, number, number]>; // [plan_key, payments, payers, inr, usd]
  monthly: Array<[string, number, number, number, number]>; // [month, payments, payers, inr, usd]
  channels: Array<[string | null, string | null, number, number, number, number]>; // [source, medium, payments, payers, inr, usd]
};

export type CreatorsData = {
  rows: Array<[string | null, number, number, number, number, string, string]>; // [code, referrals, pro, inr, usd, firstRef, lastRef]
  funnel: { applied: number; discounted: number; purchased: number; rewarded: number; people: number; days: number };
};

export type RetentionData = {
  sizes: Array<[string, number]>; // [cohortWeek, size]
  cells: Array<[string, number, number]>; // [cohortWeek, weekOffset, activeUsers]
  events: string[];
  asOf: string;
};

export type ProUser = {
  id: string; email: string; name: string | null; plan: string | null; status: string | null;
  ends: string | null; created: string | null; code: string | null; phone: string | null;
  firstPay: string | null; lastPay: string | null; inr: number; usd: number; payCount: number; planKey: string | null;
};
export type ProUsersData = { users: ProUser[] };

export type SearchAccount = {
  id: string; email: string; name: string | null; plan: string | null; status: string | null;
  subEnd: string | null; createdAt: string | null; referralCode: string | null;
  referredBy: { name: string | null; email: string | null; code: string | null } | null;
  paid: { inr: number; usd: number; count: number; last: string | null };
  payments: Array<{ plan: string | null; amount: number; currency: string | null; status: string | null; at: string | null; provider: string | null }>;
  resumes: Array<{ name: string | null; phone: string | null; email: string | null }>;
};
export type SearchData = { q: string; accounts: SearchAccount[] };
