// api/systeme-check.js
// ADMIN TOOL — locked behind LOGIN_SECRET. Tags every contact with an active
// Label Scanner subscription as "Scanner Customer", so newsletters can be sent
// to current customers. Safe to run more than once (already-tagged contacts
// are skipped). Run in batches: ?secret=...&tag=1&after=<lastId>

import { entitlementsFor, tagContact } from './_auth.js';

const BASE = 'https://api.systeme.io/api';
export const SCANNER_TAG = 'Scanner Customer';

export default async function handler(req, res) {
  const q = req.query || {};
  if (!process.env.LOGIN_SECRET || q.secret !== process.env.LOGIN_SECRET) return res.status(404).end();
  if (!q.tag) return res.status(200).json({ ok: true });

  const after = q.after ? `&startingAfter=${encodeURIComponent(q.after)}` : '';
  const r = await fetch(`${BASE}/contacts?limit=10${after}`, { headers: { 'X-API-Key': process.env.SYSTEME_API_KEY, Accept: 'application/json' } });
  const page = await r.json();
  const items = (page && page.items) || [];
  const tagged = [], skipped = [], errors = [];
  for (const c of items) {
    try {
      if ((c.tags || []).some(t => t.name === SCANNER_TAG)) { skipped.push(c.id); continue; }
      const info = await entitlementsFor(c.email);
      if (info.ent.scanner && !info.admin) { await tagContact(c.email, SCANNER_TAG); tagged.push(c.id); }
      else skipped.push(c.id);
    } catch (e) { errors.push({ id: c.id, error: e.message }); }
  }
  const last = items.length ? items[items.length - 1].id : null;
  return res.status(200).json({ checked: items.length, tagged: tagged.length, skipped: skipped.length, errors, next: page && page.hasMore ? last : null });
}
