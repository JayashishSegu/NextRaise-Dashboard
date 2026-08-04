// Build a referral-code → influencer-name map from PostHog cohorts.
// The team maintains one cohort per influencer, defined as
//   "referred_by_code equals <CODE>"  (e.g. MoonXShruthi → YUBC4W).
// The influencer's human name (IG handle) lives ONLY in the cohort name, so we
// walk every cohort's filter tree, and for each referred_by_code value we map
// that code → the cohort name. The dashboard then labels influencers by handle
// instead of the signup account name.

// Recursively collect referred_by_code values from a cohort filter node.
function collectCodes(node, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { for (const n of node) collectCodes(n, out); return; }
  if (node.key === 'referred_by_code' && node.value != null) {
    const vals = Array.isArray(node.value) ? node.value : [node.value];
    for (const v of vals) { const c = String(v).trim().toUpperCase(); if (c) out.push(c); }
  }
  // recurse into the containers PostHog uses for nested criteria
  collectCodes(node.values, out);
  collectCodes(node.properties, out);
  collectCodes(node.groups, out);
}

async function computeCohortNameMap(env) {
  const host = env.PH_HOST || 'https://us.posthog.com';
  const projectId = env.PH_PROJECT_ID || '399417';
  const apiKey = env.PH_API_KEY;
  if (!apiKey) throw new Error('PH_API_KEY not set');

  const map = {};
  let url = `${host}/api/projects/${projectId}/cohorts/?limit=200`;
  let guard = 0;
  while (url && guard++ < 20) {
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!resp.ok) throw new Error(`cohorts HTTP ${resp.status}`);
    const j = await resp.json();
    for (const c of (j.results || [])) {
      if (c.deleted) continue;
      const codes = [];
      collectCodes(c.filters, codes);   // current shape: filters.properties tree
      collectCodes(c.groups, codes);    // legacy shape: groups[].properties[]
      for (const code of codes) if (!map[code]) map[code] = (c.name || '').trim();
    }
    url = j.next || null;
  }
  return map;
}

module.exports = { computeCohortNameMap, collectCodes };
