// Server-side overview compute — a faithful port of loadOverview() in index.html.
// Runs the same 9 HogQL queries against PostHog and assembles the identical
// `_ovData` shape, so a Vercel Cron can precompute it and the dashboard can read
// a warm, keyless copy instantly instead of firing 9 heavy queries per visit.
//
// IMPORTANT: the SQL below is copied verbatim from index.html. If you change a
// query there, change it here too (they must stay in lock-step or numbers drift).

const IST_MS = 5.5 * 3600000;
const DAY = 86400000;

const GDR_PRESETS = [
  { key: 'today',     label: 'Today'       },
  { key: 'yest',      label: 'Yesterday'   },
  { key: '7d',        label: 'Last 7 days' },
  { key: '14d',       label: 'Last 14 days'},
  { key: 'thisMonth', label: 'This month'  },
  { key: 'lastMonth', label: 'Last month'  },
  { key: 'all',       label: 'All time'    },
];
const CONV_PRESETS = GDR_PRESETS; // index.html filters out 'custom'; we already omit it

const _istMidUtc = (y, m, d) => Date.UTC(y, m, d) - IST_MS;
const _dstr = ms => new Date(ms + IST_MS).toISOString().slice(0, 10);

function gdrBounds(key, cust) {
  const now = Date.now();
  const t = new Date(now + IST_MS);
  const Y = t.getUTCFullYear(), M = t.getUTCMonth(), D = t.getUTCDate();
  const tm = _istMidUtc(Y, M, D); // today 00:00 IST
  let s, e;
  switch (key) {
    case 'today':     s = tm;                    e = tm + DAY;                break;
    case 'yest':      s = tm - DAY;              e = tm;                      break;
    case '7d':        s = tm - 6 * DAY;          e = tm + DAY;                break;
    case '14d':       s = tm - 13 * DAY;         e = tm + DAY;                break;
    case 'thisMonth': s = _istMidUtc(Y, M, 1);   e = _istMidUtc(Y, M + 1, 1); break;
    case 'lastMonth': s = _istMidUtc(Y, M - 1, 1); e = _istMidUtc(Y, M, 1);   break;
    case 'all':       s = _istMidUtc(2026, 4, 1); e = tm + DAY;               break;
    case 'custom': {
      const f = (cust && cust.from) ? cust.from : _dstr(tm);
      const to = (cust && cust.to) ? cust.to : _dstr(tm);
      const fp = f.split('-').map(Number), tp = to.split('-').map(Number);
      s = _istMidUtc(fp[0], fp[1] - 1, fp[2]);
      e = _istMidUtc(tp[0], tp[1] - 1, tp[2]) + DAY;
      break;
    }
    default:          s = tm - 6 * DAY;          e = tm + DAY;
  }
  return {
    startDate: _dstr(s), endDate: _dstr(e),
    days: Math.max(1, Math.round((e - s) / DAY)),
    scanDays: Math.max(2, Math.ceil((now - s) / DAY) + 2),
  };
}

// ── PostHog HogQL fetch with a concurrency gate (team limit is 3 — stay at 2) ──
function makeRunner(env) {
  const host = env.PH_HOST || 'https://us.posthog.com';
  const projectId = env.PH_PROJECT_ID || '399417';
  const apiKey = env.PH_API_KEY;
  if (!apiKey) throw new Error('PH_API_KEY env var is not set');

  const gate = { active: 0, queue: [], MAX: 2 };
  const acquire = () => gate.active < gate.MAX
    ? (gate.active++, Promise.resolve())
    : new Promise(res => gate.queue.push(res)).then(() => { gate.active++; });
  const release = () => { gate.active--; const n = gate.queue.shift(); if (n) n(); };

  async function fetchOnce(sql) {
    const resp = await fetch(`${host}/api/projects/${projectId}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query: sql } }),
    });
    const json = await resp.json();
    if (!resp.ok) throw new Error(json.detail || json.error || `HTTP ${resp.status}`);
    return json;
  }

  // Retry ONLY 429 concurrency (clears sub-second); never retry deterministic
  // "max execution time" — re-running it trips PostHog's 3-strikes 2-min lockout.
  return async function runHogQL(sql) {
    await acquire();
    try {
      let lastErr;
      for (let attempt = 0; attempt < 4; attempt++) {
        try { return await fetchOnce(sql); }
        catch (e) {
          lastErr = e;
          const msg = e.message || '';
          const retriable = /too many|concurren|rate limit|\b429\b|\b50[234]\b/i.test(msg)
                            && !/max execution time/i.test(msg);
          if (attempt < 3 && retriable) {
            const base = /too many|concurren|429/i.test(msg) ? 500 : 1200;
            await new Promise(r => setTimeout(r, base * (attempt + 1) + Math.floor(Math.random() * 250)));
            continue;
          }
          throw e;
        }
      }
      throw lastErr;
    } finally { release(); }
  };
}

async function computeOverview(range, env, cust) {
  const runHogQL = makeRunner(env);
  const _ovGdr = gdrBounds(range, cust);
  const rangeStart = _ovGdr.startDate;
  const rangeEnd   = _ovGdr.endDate;
  const pgRangeFilter = `created_at >= toDateTime('${rangeStart} 00:00:00') AND created_at < toDateTime('${rangeEnd} 00:00:00')`;
  const evRangeHaving = `su >= toDate('${rangeStart}') AND su < toDate('${rangeEnd}')`;
  const evRangeInterval = `${_ovGdr.scanDays} DAY`;

  // Heaviest query — run solo first for full ClickHouse headroom.
  const counts = await runHogQL(`
          SELECT
            countIf(su >= toDate('2026-05-01')) AS new_product,
            countIf(su > toDate('2000-01-01') AND su < toDate('2026-05-01')) AS legacy,
            countIf(su = toDate(toTimeZone(now(),'Asia/Kolkata'))) AS new_today,
            countIf(su >= toDate(toTimeZone(now(),'Asia/Kolkata')) - 7) AS new_week,
            countIf(su >= toStartOfMonth(toDate(toTimeZone(now(),'Asia/Kolkata')))) AS new_month,
            countIf(plan LIKE '%pro%' AND su >= toDate('2026-05-01')) AS pro,
            countIf((plan LIKE '%pro%' OR plan LIKE '%basic%') AND status='active') AS paid,
            countIf(plan LIKE '%pro%' AND status='active') AS active_pro,
            countIf(plan LIKE '%basic%' AND status='active') AS active_basic,
            countIf(su = toDate(toTimeZone(now(),'Asia/Kolkata')) - 1) AS new_yesterday,
            countIf(su >= toDate(toTimeZone(now(),'Asia/Kolkata')) - 14 AND su < toDate(toTimeZone(now(),'Asia/Kolkata')) - 7) AS new_week_prev,
            countIf(plan LIKE '%pro%' AND status='expired') AS expired_pro,
            countIf(plan LIKE '%pro%' AND status='expired') AS lapsed_30d,
            ${CONV_PRESETS.map((p, i) => { const b = gdrBounds(p.key);
              return `countIf(su>=toDate('${b.startDate}') AND su<toDate('${b.endDate}')) AS cs${i}, `
                   + `countIf(su>=toDate('${b.startDate}') AND su<toDate('${b.endDate}') AND plan LIKE '%pro%') AS cp${i}`;
            }).join(', ')}
          FROM (
            SELECT person_id,
              minIf(toDate(toTimeZone(timestamp,'Asia/Kolkata')), event = 'signup_complete') AS su,
              argMaxIf(toString(person.properties.plan), timestamp, person.properties.plan!='') AS plan,
              argMaxIf(toString(person.properties.subscription_status), timestamp, person.properties.subscription_status!='') AS status
            FROM events
            WHERE timestamp > now() - INTERVAL 400 DAY
              AND NOT endsWith(coalesce(person.properties.email,''),'@nextraise.ai')
              AND NOT endsWith(coalesce(person.properties.email,''),'@creditdharma.in')
              AND person_id NOT IN COHORT 278743
              AND lower(coalesce(person.properties.email,'')) NOT LIKE '%test%'
            GROUP BY person_id
            HAVING su > toDate('2000-01-01')
          )`);

  const [signups, payments, revenue, sources, growth, dailyPay, influencers, pgSubscribers] = await Promise.all([
    runHogQL(`
          SELECT email, name, plan, created_at FROM (
            SELECT argMaxIf(toString(person.properties.email), timestamp, person.properties.email!='') AS email,
              argMaxIf(toString(person.properties.name), timestamp, person.properties.name!='') AS name,
              argMaxIf(toString(person.properties.plan), timestamp, person.properties.plan!='') AS plan,
              toString(maxIf(timestamp, event='signup_complete')) AS created_at
            FROM events
            WHERE person_id IN (SELECT person_id FROM events WHERE event='signup_complete' AND timestamp > now() - INTERVAL 21 DAY)
              AND timestamp > now() - INTERVAL 400 DAY
            GROUP BY person_id
          ) WHERE email NOT LIKE '%@nextraise.ai' AND email NOT LIKE '%@creditdharma.in' AND email!=''
          ORDER BY created_at DESC LIMIT 7`),
    runHogQL(`
          SELECT toString(person.properties.email) AS email,
            toString(person.properties.name) AS name,
            toString(properties.plan) AS plan,
            toString(timestamp) AS pay_created,
            toFloatOrZero(toString(properties.amount)) AS amount,
            toString(properties.currency) AS currency
          FROM events
          WHERE event='payment_completed'
            AND timestamp >= toDateTime('2026-05-01 00:00:00')
            AND NOT endsWith(coalesce(person.properties.email,''),'@nextraise.ai')
            AND NOT endsWith(coalesce(person.properties.email,''),'@creditdharma.in')
            AND coalesce(person.properties.email,'') NOT ILIKE '%test%'
            AND person_id NOT IN COHORT 278743
          ORDER BY timestamp DESC LIMIT 7`),
    runHogQL(`
          SELECT
            sumIf(amount, currency='INR') AS inr,
            sumIf(amount, currency='USD') AS usd
          FROM postgres.payments
          WHERE status='completed'
            AND ${pgRangeFilter}
            AND user_email NOT LIKE '%@nextraise.ai'
            AND user_email NOT LIKE '%@creditdharma.in'
            AND lower(user_email) NOT LIKE '%test%'`),
    runHogQL(`
          SELECT source, medium, count() AS c,
                 countIf(plan LIKE '%pro%' AND status='active') AS conv
          FROM (
            SELECT person_id,
              argMaxIf(toString(person.properties.source), timestamp, person.properties.source!='') AS source,
              argMaxIf(toString(person.properties.medium), timestamp, person.properties.medium!='') AS medium,
              argMaxIf(toString(person.properties.plan), timestamp, person.properties.plan!='') AS plan,
              argMaxIf(toString(person.properties.subscription_status), timestamp, person.properties.subscription_status!='') AS status,
              minIf(toDate(toTimeZone(timestamp,'Asia/Kolkata')), event IN ('signup_complete','onboarding_start')) AS su
            FROM events
            WHERE timestamp > now() - INTERVAL 400 DAY
              AND NOT endsWith(coalesce(person.properties.email,''),'@nextraise.ai')
              AND NOT endsWith(coalesce(person.properties.email,''),'@creditdharma.in')
              AND person_id NOT IN COHORT 278743
            GROUP BY person_id
            HAVING ${evRangeHaving}
          ) GROUP BY source, medium ORDER BY c DESC LIMIT 100`),
    runHogQL(`
          SELECT toString(toDate(toTimeZone(timestamp,'Asia/Kolkata'))) AS day, uniq(person_id) AS c
          FROM events
          WHERE event = 'signup_complete'
            AND toDate(toTimeZone(timestamp,'Asia/Kolkata')) >= toDate('${rangeStart}')
            AND toDate(toTimeZone(timestamp,'Asia/Kolkata')) < toDate('${rangeEnd}')
            AND NOT endsWith(coalesce(person.properties.email,''),'@nextraise.ai')
            AND NOT endsWith(coalesce(person.properties.email,''),'@creditdharma.in')
            AND person_id NOT IN COHORT 278743
          GROUP BY day ORDER BY day LIMIT 200`),
    runHogQL(`
          SELECT toString(toDate(toTimeZone(created_at,'Asia/Kolkata'))) AS day,
            count() AS cnt,
            sumIf(amount, currency='INR') AS inr,
            sumIf(amount, currency='USD') AS usd
          FROM postgres.payments
          WHERE status='completed'
            AND ${pgRangeFilter}
            AND user_email NOT LIKE '%@nextraise.ai'
            AND user_email NOT LIKE '%@creditdharma.in'
            AND lower(user_email) NOT LIKE '%test%'
          GROUP BY day ORDER BY day LIMIT 200`),
    runHogQL(`
          SELECT campaign, count() AS c,
                 countIf(plan LIKE '%pro%' AND status='active') AS conv
          FROM (
            SELECT person_id,
              argMaxIf(toString(person.properties.$initial_utm_campaign), timestamp, person.properties.$initial_utm_campaign!='') AS campaign,
              argMaxIf(toString(person.properties.plan), timestamp, person.properties.plan!='') AS plan,
              argMaxIf(toString(person.properties.subscription_status), timestamp, person.properties.subscription_status!='') AS status,
              minIf(toDate(toTimeZone(timestamp,'Asia/Kolkata')), event IN ('signup_complete','onboarding_start')) AS su
            FROM events
            WHERE positionCaseInsensitive(toString(person.properties.$initial_utm_campaign),'instagram') > 0
              AND timestamp > now() - INTERVAL ${evRangeInterval}
              AND NOT endsWith(coalesce(person.properties.email,''),'@nextraise.ai')
              AND NOT endsWith(coalesce(person.properties.email,''),'@creditdharma.in')
              AND person_id NOT IN COHORT 278743
            GROUP BY person_id
            HAVING ${evRangeHaving}
          ) GROUP BY campaign ORDER BY c DESC LIMIT 40`),
    runHogQL(`
          SELECT
            countIf((plan_cache LIKE '%pro%' OR plan_cache LIKE '%Pro%') AND sub_status='active') AS active_pro,
            countIf((plan_cache LIKE '%basic%') AND sub_status='active') AS active_basic,
            countIf((plan_cache LIKE '%pro%' OR plan_cache LIKE '%Pro%') AND sub_status='expired') AS expired_pro
          FROM postgres.users
          WHERE email NOT LIKE '%@nextraise.ai'
            AND email NOT LIKE '%@creditdharma.in'
            AND lower(email) NOT LIKE '%test%'`).catch(() => ({ results: [] })),
  ]);

  const revRow = (revenue.results || [])[0] || [0, 0];
  const pgSubRow = (pgSubscribers.results || [])[0] || [];
  const rawCounts = (counts.results || [])[0] || [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const mergedCounts = [...rawCounts];
  if (pgSubRow.length) {
    mergedCounts[7] = +pgSubRow[0] || 0;
    mergedCounts[8] = +pgSubRow[1] || 0;
    mergedCounts[11] = +pgSubRow[2] || 0;
    mergedCounts[12] = +pgSubRow[2] || 0;
  }
  return {
    counts:      mergedCounts,
    signups:     signups.results  || [],
    payments:    payments.results || [],
    revInr:      Number(revRow[0] || 0),
    revUsd:      Number(revRow[1] || 0),
    sources:     sources.results     || [],
    growth:      growth.results      || [],
    dailyPay:    dailyPay.results    || [],
    influencers: influencers.results || [],
    convByPeriod: CONV_PRESETS.map((p, i) => {
      const s = +mergedCounts[13 + i * 2] || 0, pr = +mergedCounts[13 + i * 2 + 1] || 0;
      return { key: p.key, label: p.label, signups: s, pro: pr, rate: s ? pr / s * 100 : 0 };
    }),
  };
}

module.exports = { computeOverview, gdrBounds, GDR_PRESETS };
