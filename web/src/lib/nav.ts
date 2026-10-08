import {
  BarChart3, Compass, Crown, Flame, Funnel, LayoutDashboard, LineChart, Megaphone,
  Repeat2, Search, Sparkles, TrendingUp, Users, FileText, type LucideIcon,
} from "lucide-react";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  group: "Overview" | "Growth" | "People";
  description: string;
  /** Which dashboard controls apply on this screen. */
  range: boolean;
  view: boolean;
  /** Needs the gate key + unlock cookie (returns personal data). */
  locked?: boolean;
};

export const NAV: NavItem[] = [
  { id: "overview", label: "Overview", href: "/", icon: LayoutDashboard, group: "Overview", description: "Revenue, signups and conversion at a glance", range: true, view: true },
  { id: "report", label: "Report", href: "/report", icon: FileText, group: "Overview", description: "CEO report: spend, ROAS, CAC and campaigns", range: true, view: true },
  { id: "daily", label: "Daily", href: "/daily", icon: BarChart3, group: "Overview", description: "Last 30 days, day by day", range: false, view: true },
  { id: "insights", label: "Insights", href: "/insights", icon: LineChart, group: "Overview", description: "Signup funnel and where people drop off", range: true, view: true },
  { id: "acquire", label: "Acquire", href: "/acquire", icon: Compass, group: "Growth", description: "Channels: visitors, signups and paid", range: true, view: true },
  { id: "retention", label: "Retention", href: "/retention", icon: Repeat2, group: "Growth", description: "Weekly signup cohorts that come back", range: false, view: false },
  { id: "referrals", label: "Referrals", href: "/referrals", icon: Megaphone, group: "Growth", description: "Referral codes and the referral funnel", range: true, view: false },
  { id: "creators", label: "Creators", href: "/creators", icon: Crown, group: "People", description: "Creator codes: signups, paid and revenue", range: true, view: false },
  { id: "search", label: "Search", href: "/search", icon: Search, group: "People", description: "Look up an account by email or name", range: false, view: false, locked: true },
];

export const NAV_GROUPS: Array<NavItem["group"]> = ["Overview", "Growth", "People"];

export function navForPath(pathname: string): NavItem {
  const hit = NAV.find((n) => (n.href === "/" ? pathname === "/" : pathname === n.href || pathname.startsWith(n.href + "/")));
  return hit ?? NAV[0];
}

export { Users, Funnel };
