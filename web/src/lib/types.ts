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
  /** Where the server got these numbers: compute, snapshot, snapshot-recent, snapshot-capped, ... */
  source?: string;
  /** Seconds since the server computed them. */
  ageSec?: number;
  /** Refresh was refused because the hourly allowance is spent; retryAfterSec says when it resets. */
  capped?: boolean;
  /** A manual refresh hit the 30s deadline and returned the previous numbers. */
  timedOut?: boolean;
  /** Someone else's refresh of the same view was still running when the wait ran out. */
  busy?: boolean;
  /** Names of queries that fell back to PostHog's saved copy because the live run timed out. */
  partlyCached?: string[];
  retryAfterSec?: number;
  /** A recompute was attempted and failed; this is why. */
  refreshFailed?: string;
  budget?: boolean;
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

export type SearchAccount = {
  id: string; email: string; name: string | null; plan: string | null; status: string | null;
  subEnd: string | null; createdAt: string | null; referralCode: string | null;
  referredBy: { name: string | null; email: string | null; code: string | null } | null;
  paid: { inr: number; usd: number; count: number; last: string | null };
  payments: Array<{ plan: string | null; amount: number; currency: string | null; status: string | null; at: string | null; provider: string | null }>;
  resumes: Array<{ name: string | null; phone: string | null; email: string | null }>;
};
export type SearchData = { q: string; accounts: SearchAccount[] };

export type PaymentEntry = { id: string; creator: string; code: string; date: string; amount: number; note: string; source?: "manual" | "sheet" };
export type SheetVideo = { creator: string; date: string | null; views: number; link: string };
/** kv:false means no Redis store is attached yet, so payments cannot be read or saved. */
export type PaymentsData = {
  kv: boolean; entries: PaymentEntry[]; total: number; window: { start: string; end: string };
  /** Amounts the Google Sheets show as earned but not yet paid, for months overlapping the range. */
  owed?: { total: number; rows: Array<{ month: string; creator: string; amount: number }> };
  videos?: { count: number; views: number; likes: number; comments: number; top: SheetVideo[] };
  /** Paid rows in the sheets whose amount could not be read. */
  unread?: Array<{ month: string; creator: string; reason: string }>;
  sync?: { months: Array<{ month: string; syncedAt: number | null; payments: number; videos: number; pipelineFound: boolean }>; latest: number | null };
};
