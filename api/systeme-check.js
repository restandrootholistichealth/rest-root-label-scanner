// api/systeme-check.js
// TEMPORARY diagnostic — shows the SHAPE of Systeme.io API responses so the
// personal-login feature can be built correctly. Locked behind LOGIN_SECRET.
// Delete this file (and its vercel.json lines) once logins are built.

const BASE = 'https://api.systeme.io/api';

function shape(v, depth = 0) {
  if (v === null || v === undefined) return v;
  if (Array.isArray(v)) return v.length ? [shape(v[0], depth + 1), `(${v.length} items)`] : [];
  if (typeof v === 'object') {
    if (depth > 4) return '{…}';
    const o = {};
    for (const k of Object.keys(v)) o[k] = shape(v[k], depth + 1);
    return o;
  }
  if (typeof v === 'string') return /@/.test(v) ? '(email)' : v.length > 40 ? v.slice(0, 40) + '…' : v;
  return v;
}

async function get(path) {
  const r = await fetch(BASE + path, { headers: { 'X-API-Key': process.env.SYSTEME_API_KEY, Accept: 'application/json' } });
  let body = null;
  try { body = await r.json(); } catch (e) { body = '(not JSON)'; }
  return { status: r.status, body };
}

export default async function handler(req, res) {
  const secret = (req.query && req.query.secret) || '';
  if (!process.env.LOGIN_SECRET || secret !== process.env.LOGIN_SECRET) return res.status(404).end();
  if (!process.env.SYSTEME_API_KEY) return res.status(200).json({ error: 'SYSTEME_API_KEY is not set in Vercel' });

  const out = {};
  const subs = await get('/payment/subscriptions?limit=10');
  out.subscriptions_status = subs.status;
  out.subscriptions_shape = shape(subs.body);
  // Distinct values of anything that looks like a status, so we know what "active" looks like
  const items = (subs.body && (subs.body.items || subs.body.data || subs.body)) || [];
  if (Array.isArray(items)) {
    const vals = {};
    items.forEach(it => Object.keys(it || {}).forEach(k => {
      if (/status|state|active|cancel/i.test(k)) (vals[k] = vals[k] || new Set()).add(JSON.stringify(it[k]));
    }));
    out.status_values = Object.fromEntries(Object.entries(vals).map(([k, s]) => [k, [...s]]));
  }
  const contacts = await get('/contacts?limit=10');
  out.contacts_status = contacts.status;
  out.contacts_shape = shape(contacts.body);
  // Does filtering by contact or email work?
  const firstContact = contacts.body && Array.isArray(contacts.body.items) && contacts.body.items[0];
  if (firstContact && firstContact.id) {
    const byContact = await get(`/payment/subscriptions?contact=${firstContact.id}&limit=10`);
    out.filter_by_contact = { status: byContact.status, shape: shape(byContact.body) };
    const byContactId = await get(`/payment/subscriptions?contactId=${firstContact.id}&limit=10`);
    out.filter_by_contactId = { status: byContactId.status, shape: shape(byContactId.body) };
  }
  const byEmail = await get('/contacts?email=hello%40naturalhealthnetwork.org&limit=10');
  out.contacts_filter_by_email = { status: byEmail.status, count: byEmail.body && byEmail.body.items ? byEmail.body.items.length : null };
  return res.status(200).json(out);
}
