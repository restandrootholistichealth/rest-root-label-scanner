// api/systeme-check.js
// TEMPORARY diagnostic — read-only window into the Systeme.io API so the
// personal-login feature can be built correctly. Locked behind LOGIN_SECRET.
// GET only (cannot change anything). Delete this file and its vercel.json
// lines once logins are built.

const BASE = 'https://api.systeme.io/api';

async function get(path) {
  const r = await fetch(BASE + path, { headers: { 'X-API-Key': process.env.SYSTEME_API_KEY, Accept: 'application/json' } });
  let body = null;
  try { body = await r.json(); } catch (e) { body = '(not JSON)'; }
  return { status: r.status, body };
}

export default async function handler(req, res) {
  const q = req.query || {};
  if (!process.env.LOGIN_SECRET || q.secret !== process.env.LOGIN_SECRET) return res.status(404).end();
  if (!process.env.SYSTEME_API_KEY) return res.status(200).json({ error: 'SYSTEME_API_KEY is not set in Vercel' });

  // ?path=/contacts?email=... — any read-only Systeme.io API path
  if (q.path && /^\/[\w\/\-?=&%.@+]*$/.test(q.path)) {
    return res.status(200).json(await get(q.path));
  }

  // ?scan=1 — walk contacts and report the first few that have subscriptions
  if (q.scan) {
    const found = [];
    let after = '';
    let checked = 0;
    for (let page = 0; page < 5 && found.length < 4; page++) {
      const c = await get(`/contacts?limit=50${after ? '&startingAfter=' + after : ''}`);
      const items = (c.body && c.body.items) || [];
      for (const ct of items) {
        checked++;
        const s = await get(`/payment/subscriptions?contact=${ct.id}&limit=10`);
        const subs = (s.body && s.body.items) || [];
        if (subs.length) found.push({ contactId: ct.id, tags: ct.tags, subscriptions: subs });
        if (found.length >= 4) break;
      }
      if (!c.body || !c.body.hasMore || !items.length) break;
      after = items[items.length - 1].id;
    }
    return res.status(200).json({ checked, found });
  }
  return res.status(200).json({ ok: true });
}
