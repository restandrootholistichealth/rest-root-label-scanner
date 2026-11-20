// api/_auth.js
// Shared personal-login helpers for the scanner, Cart Builder, and Meal Planner.
//
// How it works (no database needed):
//  - Systeme.io is the source of truth for who has paid.
//  - A customer logs in with her purchase email + a 6-digit code we email her.
//  - She gets a signed "session" token (stored on her phone) listing what she
//    owns. The signature (LOGIN_SECRET) means it can't be faked or edited.
//  - Once a day the session is re-checked against Systeme.io, so a cancelled
//    or failed subscription locks the tools within 24 hours.
//
// Needs Vercel environment variables: SYSTEME_API_KEY, LOGIN_SECRET.

import crypto from 'crypto';

const SYSTEME = 'https://api.systeme.io/api';
export const RECHECK_MS = 24 * 60 * 60 * 1000;           // re-check Systeme.io daily
export const SESSION_MS = 60 * 24 * 60 * 60 * 1000;      // stay logged in up to 60 days
export const CODE_MS = 15 * 60 * 1000;                   // login codes last 15 minutes

// Lindsay's own emails always get full access to every tool.
const ADMIN_EMAILS = [
  'lindsay@restandrootholistic.com',
  'restandrootholistichealth@gmail.com',
  'restandrootholistichealing@gmail.com',
];

// Tag names the purchase webhook adds in Systeme.io for one-time add-ons.
export const ADDON_TAGS = { cart: 'Clean Cart Builder', meals: 'Clean Meal Planner' };

// Subscription statuses that count as "paid up" (trials show as active).
const ACTIVE = ['active', 'trialing', 'trial', 'in_trial'];

const b64 = s => Buffer.from(s).toString('base64url');
const unb64 = s => Buffer.from(s, 'base64url').toString('utf8');
const hmac = s => crypto.createHmac('sha256', process.env.LOGIN_SECRET || '').update(s).digest('base64url');

export function sign(payload) {
  const body = b64(JSON.stringify(payload));
  return `${body}.${hmac(body)}`;
}

export function unsign(token) {
  if (!token || typeof token !== 'string' || !process.env.LOGIN_SECRET) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const good = hmac(body);
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try { return JSON.parse(unb64(body)); } catch (e) { return null; }
}

export const normEmail = e => String(e || '').trim().toLowerCase();
export const codeHash = (email, code) => hmac(`code:${normEmail(email)}:${String(code).trim()}`);

async function systeme(path, opts = {}) {
  const r = await fetch(SYSTEME + path, {
    ...opts,
    headers: { 'X-API-Key': process.env.SYSTEME_API_KEY, Accept: 'application/json', 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  let body = null;
  try { body = await r.json(); } catch (e) {}
  if (!r.ok) {
    const err = new Error(`Systeme.io ${r.status} on ${path}`);
    err.status = r.status;
    throw err;
  }
  return body;
}

export async function findContact(email) {
  const e = normEmail(email);
  const res = await systeme(`/contacts?email=${encodeURIComponent(e)}&limit=10`);
  const items = (res && res.items) || [];
  return items.find(c => normEmail(c.email) === e) || null;
}

// What does this person own right now?
export async function entitlementsFor(email) {
  const e = normEmail(email);
  if (ADMIN_EMAILS.includes(e)) {
    let contactId = null;
    try { const c = await findContact(e); contactId = c ? c.id : null; } catch (err) {}
    return { contactId, ent: { scanner: true, cart: true, meals: true }, admin: true, found: true };
  }
  const contact = await findContact(e);
  if (!contact) return { contactId: null, ent: { scanner: false, cart: false, meals: false }, found: false };

  const subs = await systeme(`/payment/subscriptions?contact=${contact.id}&limit=50`);
  const items = (subs && subs.items) || [];
  const scanner = items.some(s => {
    const plan = s.pricePlan || {};
    const name = `${plan.innerName || ''} ${plan.name || ''} ${plan.statementDescriptor || ''}`.toLowerCase();
    return (name.includes('label scanner') || name.includes('scanner')) && ACTIVE.includes(String(s.status || '').toLowerCase());
  });
  const tags = (contact.tags || []).map(t => String(t.name || '').toLowerCase());
  const has = name => tags.includes(name.toLowerCase());
  return {
    contactId: contact.id,
    found: true,
    // Add-ons ride along with an active scanner subscription.
    ent: { scanner, cart: scanner && has(ADDON_TAGS.cart), meals: scanner && has(ADDON_TAGS.meals) },
  };
}

export function newSession(email, info) {
  const now = Date.now();
  return sign({ e: normEmail(email), c: info.contactId, ent: info.ent, chk: now, exp: now + SESSION_MS });
}

// Checks a session for a tool ('scanner' | 'cart' | 'meals').
// Returns { ok, code, session?, ent } — code is 'login', 'renew', or 'not_purchased'.
export async function checkAccess(token, tool) {
  const s = unsign(token);
  if (!s || !s.e || !s.exp || Date.now() > s.exp) return { ok: false, code: 'login' };
  let ent = s.ent || {};
  let session = null;
  const age = Date.now() - (s.chk || 0);
  // Re-check daily, or right away (at most once a minute) if this tool looks
  // locked — she may have just bought it or restarted her subscription.
  const looksLocked = !ent.scanner || (tool !== 'scanner' && !ent[tool]);
  if (!s.chk || age > RECHECK_MS || (looksLocked && age > 60 * 1000)) {
    try {
      const info = await entitlementsFor(s.e);
      ent = info.ent;
      session = sign({ ...s, c: info.contactId ?? s.c, ent, chk: Date.now() });
    } catch (e) {
      // Systeme.io unreachable: keep the last known access rather than locking
      // a paying customer out because of someone else's outage.
      console.error('Access re-check failed, using last known access:', e.message);
    }
  }
  if (!ent.scanner) return { ok: false, code: 'renew', ent, session };
  if (tool !== 'scanner' && !ent[tool]) return { ok: false, code: 'not_purchased', ent, session };
  return { ok: true, ent, session, email: s.e };
}

// ---------------------------------------------------------------------------
// Saved preferences — stored on her Systeme.io contact in a custom field, so
// her Cart Builder / Meal Planner settings follow her to any phone.
// Shape: { cart: {...settings}, meals: {...settings}, queue: ["swap from a scan", ...] }
// ---------------------------------------------------------------------------
const PREFS_SLUG = 'rr_app_prefs';
let prefsFieldReady = false;

async function ensurePrefsField() {
  if (prefsFieldReady) return;
  const list = await systeme('/contact_fields?limit=100');
  const items = (list && list.items) || (Array.isArray(list) ? list : []);
  if (!items.some(f => f.slug === PREFS_SLUG)) {
    await systeme('/contact_fields', { method: 'POST', body: JSON.stringify({ fieldName: 'Rest & Root App Settings', slug: PREFS_SLUG }) });
  }
  prefsFieldReady = true;
}

export async function getPrefs(contactId) {
  if (!contactId) return null;
  const c = await systeme(`/contacts/${contactId}`);
  const f = ((c && c.fields) || []).find(x => x.slug === PREFS_SLUG);
  if (!f || !f.value) return {};
  try { return JSON.parse(f.value); } catch (e) { return {}; }
}

export async function savePrefs(contactId, patch) {
  if (!contactId) return null;
  await ensurePrefsField();
  const current = (await getPrefs(contactId)) || {};
  const next = { ...current, ...patch };
  if (Array.isArray(next.queue)) next.queue = next.queue.slice(-25);
  const value = JSON.stringify(next).slice(0, 4000);
  await systeme(`/contacts/${contactId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/merge-patch+json' },
    body: JSON.stringify({ fields: [{ slug: PREFS_SLUG, value }] }),
  });
  return next;
}

// Used by the purchase webhook: add a tag to a contact (creating the tag if needed).
export async function tagContact(email, tagName) {
  const contact = await findContact(email);
  if (!contact) throw new Error(`No Systeme.io contact for ${email}`);
  if ((contact.tags || []).some(t => String(t.name).toLowerCase() === tagName.toLowerCase())) return;
  let tagId = null;
  let after = '';
  for (let page = 0; page < 10 && !tagId; page++) {
    const list = await systeme(`/tags?limit=100${after ? '&startingAfter=' + after : ''}`);
    const items = (list && list.items) || [];
    const hit = items.find(t => String(t.name).toLowerCase() === tagName.toLowerCase());
    if (hit) tagId = hit.id;
    if (!list || !list.hasMore || !items.length) break;
    after = items[items.length - 1].id;
  }
  if (!tagId) {
    const created = await systeme('/tags', { method: 'POST', body: JSON.stringify({ name: tagName }) });
    tagId = created && created.id;
  }
  await systeme(`/contacts/${contact.id}/tags`, { method: 'POST', body: JSON.stringify({ tagId }) });
}
