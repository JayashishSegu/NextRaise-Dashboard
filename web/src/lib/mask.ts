/** "gourav.sharma089@gmail.com" -> "gou***@gmail.com". Used wherever an email is shown without needing to be actionable. */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "";
  const at = email.indexOf("@");
  if (at < 1) return email;
  const local = email.slice(0, at);
  return `${local.slice(0, Math.min(3, Math.max(1, local.length - 1)))}***${email.slice(at)}`;
}

export function firstName(name: string | null | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] || "";
}

export function initials(name: string | null | undefined, fallback = "?"): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  return ((parts[0][0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || fallback;
}
