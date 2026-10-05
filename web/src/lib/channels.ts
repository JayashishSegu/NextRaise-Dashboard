// Channel bucketing, ported verbatim from channelOf() in the production dashboard
// so every channel total here matches what the team already knows.

export type Channel =
  | "Direct" | "Extension" | "Influencer" | "Google Ads" | "Meta Ads"
  | "Organic Search" | "Organic Social" | "Email" | "Referral" | "Other";

export function channelOf(source: string | null | undefined, medium: string | null | undefined): Channel {
  const s = (source || "").toLowerCase().trim();
  const m = (medium || "").toLowerCase().trim();
  const blank = (v: string) => !v || ["none", "null", "undefined", "(none)", "(direct)", "false"].includes(v);
  if ((blank(s) && blank(m)) || s === "direct") return "Direct";
  if (s === "organic_search") return "Organic Search"; // visitors with no UTM who arrived from a search engine
  if (s === "chrome_extension" || m === "extension") return "Extension";
  if (m.includes("influ") || s.includes("influ")) return "Influencer";
  if (s.includes("google")) return "Google Ads";
  if (s.includes("meta") || s.includes("facebook") || s === "fb" || s === "ig" || s.includes("instagram") || s.includes("instagran")) {
    return m === "social" || m === "video" ? "Organic Social" : "Meta Ads";
  }
  if (m === "email" || s === "loops") return "Email";
  if (m === "referral" || s === "affiliate" || s.includes("auto_dm")) return "Referral";
  if (m === "social" || m === "video" || m === "paid_social") return "Organic Social";
  if (s.includes("twitter") || s.includes("chatgpt") || s.includes("youtube")) return "Organic Social";
  return "Other";
}

export const CHANNEL_COLOR: Record<Channel, string> = {
  "Direct": "#9a9aa0",
  "Extension": "#2dd4bf",
  "Influencer": "#a78bfa",
  "Google Ads": "#6e8cff",
  "Meta Ads": "#ff8ca6",
  "Organic Search": "#38bdf8",
  "Organic Social": "#f5c451",
  "Email": "#2fb57a",
  "Referral": "#fb923c",
  "Other": "#6b6b72",
};

/** Plan keys come from postgres.payments.plan_key (e.g. resume-builder-pro-1w) or users.plan_cache. */
export function planLabel(key: string | null | undefined): string {
  if (!key) return "Free";
  const k = key.toLowerCase();
  const m = k.match(/pro-(\d+)(w)?$/);
  if (m) {
    const n = m[1];
    return m[2] ? `Pro · ${n} week${n === "1" ? "" : "s"}` : `Pro · ${n} month${n === "1" ? "" : "s"}`;
  }
  if (k.includes("credits")) return "Credit pack";
  if (k === "free") return "Free";
  if (k.includes("full-pro")) return "Full Pro";
  if (k.includes("pro")) return "Pro";
  return key;
}

/** Cohort names look like "Mani Prabhu instagram Influencer". Keep the person, drop the boilerplate. */
export function creatorLabel(code: string | null | undefined, names: Record<string, string> | null | undefined) {
  const raw = code ? names?.[code] : undefined;
  const clean = raw ? raw.replace(/\s*(instagram|insta|ig)?\s*(influencer|influenser)\s*$/i, "").trim() : "";
  return { name: clean || raw || code || "Unknown", code: code || "", handle: raw || null };
}
