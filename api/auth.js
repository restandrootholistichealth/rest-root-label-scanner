// api/auth.js
// Personal email-code login for the scanner, Cart Builder, and Meal Planner.
//   POST { action: 'request_code', email }              -> emails a 6-digit code
//   POST { action: 'verify', email, code, codeToken }   -> returns a session
//   POST { action: 'status', session }                  -> what she owns now

import crypto from 'crypto';
import { Resend } from 'resend';
import { sign, unsign, normEmail, codeHash, entitlementsFor, newSession, checkAccess, getPrefs, savePrefs, CODE_MS } from './_auth.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const CHECKOUT = 'https://restandrootholistichealth.systeme.io/87f9a7a0-346d5f81';

async function sendCode(email, code) {
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#FAF6F0;font-family:Arial,sans-serif;">
<div style="max-width:480px;margin:0 auto;padding:32px 20px;"><div style="background:white;border-radius:16px;padding:32px;text-align:center;">
<div style="font-size:28px;">🌿</div>
<div style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#7A9E7E;margin:6px 0 20px;">Rest &amp; Root Holistic Health</div>
<p style="font-size:15px;color:#5C3D2E;margin:0 0 16px;">Here's your login code:</p>
<div style="font-size:34px;font-weight:bold;letter-spacing:0.3em;color:#5C3D2E;background:#EEF4EE;border-radius:12px;padding:16px;">${code}</div>
<p style="font-size:13px;color:#8B6F5C;margin:20px 0 0;line-height:1.6;">It works for 15 minutes. If you didn't ask for this, you can ignore this email.</p>
</div></div></body></html>`;
  const result = await resend.emails.send({
    from: 'Lindsay | Rest & Root <lindsay@mail.restandrootholistic.com>',
    replyTo: 'restandrootholistichealth@gmail.com',
    to: email,
    subject: `${code} is your Rest & Root login code`,
    html,
    text: `Your Rest & Root login code is ${code}. It works for 15 minutes.`,
  });
  if (result?.error) throw new Error(result.error.message || 'Email failed');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.LOGIN_SECRET || !process.env.SYSTEME_API_KEY) {
    return res.status(500).json({ error: 'Login is not set up yet. Please email lindsay@restandrootholistic.com.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const { action } = body || {};

  try {
    if (action === 'request_code') {
      const email = normEmail(body.email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
      const info = await entitlementsFor(email);
      if (!info.found) {
        return res.status(404).json({ code: 'not_found', error: "We couldn't find a purchase for that email. Try the email you used at checkout, or email lindsay@restandrootholistic.com and we'll sort it out." });
      }
      if (!info.ent.scanner && !info.hadScanner) {
        return res.status(404).json({ code: 'no_purchase', checkout: CHECKOUT, error: "We don't see a scanner purchase on this email. If you bought with a different email, try that one." });
      }
      if (!info.ent.scanner) {
        return res.status(402).json({ code: 'renew', checkout: CHECKOUT, error: "Your scanner subscription isn't active right now. Restart it to log back in." });
      }
      const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
      await sendCode(email, code);
      const codeToken = sign({ e: email, h: codeHash(email, code), x: Date.now() + CODE_MS });
      return res.status(200).json({ ok: true, codeToken });
    }

    if (action === 'verify') {
      const email = normEmail(body.email);
      const t = unsign(body.codeToken);
      if (!t || t.e !== email || Date.now() > t.x) return res.status(400).json({ error: 'That code expired. Tap "Send a new code" and try again.' });
      if (codeHash(email, body.code) !== t.h) return res.status(400).json({ error: "That code doesn't match. Check your email and try again." });
      const info = await entitlementsFor(email);
      if (!info.ent.scanner) return res.status(402).json({ code: 'renew', checkout: CHECKOUT, error: "Your scanner subscription isn't active right now." });
      return res.status(200).json({ ok: true, session: newSession(email, info), ent: info.ent, email });
    }

    if (action === 'status') {
      const r = await checkAccess(body.session, 'scanner');
      return res.status(200).json({ ok: r.ok, code: r.code || null, ent: r.ent || null, session: r.session || null, checkout: CHECKOUT });
    }

    // Saved settings for the Cart Builder / Meal Planner (and the scan-to-cart list)
    if (action === 'get_prefs' || action === 'save_prefs') {
      const access = await checkAccess(body.session, 'scanner');
      if (!access.ok) return res.status(401).json({ code: access.code });
      const s = unsign(access.session || body.session);
      const contactId = s && s.c;
      if (!contactId) return res.status(200).json({ ok: true, prefs: null, local: true });
      if (action === 'get_prefs') {
        return res.status(200).json({ ok: true, prefs: await getPrefs(contactId), session: access.session || null });
      }
      const patch = {};
      const p = body.prefs || {};
      if (p.cart && typeof p.cart === 'object') patch.cart = p.cart;
      if (p.meals && typeof p.meals === 'object') patch.meals = p.meals;
      if (Array.isArray(p.queue)) patch.queue = p.queue.map(x => String(x).slice(0, 120));
      return res.status(200).json({ ok: true, prefs: await savePrefs(contactId, patch), session: access.session || null });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again in a minute.' });
  }
}
