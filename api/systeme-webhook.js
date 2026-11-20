// api/systeme-webhook.js
// Receives purchase webhooks from Systeme.io and emails the scanner password
// (plus Cart Builder / Meal Planner passwords when those add-ons are bought).
// Modeled on the old samcart-webhook.js — same shared-password email flow,
// just adapted to Systeme.io's webhook payload shape.
//
// SETUP NOTE: Systeme.io's exact payload field names can vary by event type
// (e.g. "order.payment.succeeded" vs a simple form/order webhook). This
// parses several common shapes defensively. After connecting the webhook in
// Systeme.io, trigger one real test purchase and check the Vercel function
// logs (look for "Systeme.io webhook received: ...") — if the email/name
// aren't found, the raw payload will be right there in the log so the
// field paths below can be corrected.

import { Resend } from 'resend';
import { tagContact, ADDON_TAGS } from './_auth.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const SCANNER_PASSWORD = 'RootScanner2025';

async function sendPasswordEmail(email, name) {
  const firstName = name ? name.split(' ')[0] : 'there';

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #FAF6F0; font-family: Arial, sans-serif; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(92,61,46,0.08); }
    .leaf { font-size: 32px; text-align: center; margin-bottom: 8px; }
    .brand { text-align: center; font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #7A9E7E; margin-bottom: 24px; }
    h1 { font-size: 24px; color: #5C3D2E; text-align: center; margin: 0 0 16px; }
    p { font-size: 15px; color: #8B6F5C; line-height: 1.6; margin: 0 0 16px; }
    .key-box { background: #EEF4EE; border: 2px dashed #7A9E7E; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .key-label { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #7A9E7E; margin-bottom: 8px; }
    .key { font-size: 24px; font-weight: bold; color: #5C3D2E; letter-spacing: 0.1em; }
    .button { display: block; background: #7A9E7E; color: white; text-decoration: none; text-align: center; padding: 16px 24px; border-radius: 12px; font-size: 15px; font-weight: bold; margin: 24px 0; }
    .steps { background: #FAF6F0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .step { display: flex; align-items: flex-start; margin-bottom: 12px; font-size: 14px; color: #5C3D2E; }
    .step-num { background: #7A9E7E; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px; flex-shrink: 0; }
    .divider { border: none; border-top: 1px solid #EEF4EE; margin: 24px 0; }
    .footer { text-align: center; font-size: 12px; color: #8B6F5C; margin-top: 24px; }
    .footer a { color: #7A9E7E; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="leaf">🌿</div>
      <div class="brand">Rest & Root Holistic Health</div>

      <h1>You're in, ${firstName}! 🎉</h1>

      <p>Welcome to the Rest & Root Label Scanner family. There's no password to remember. You log in with this email address.</p>

      <div class="key-box">
        <div class="key-label">Log in with</div>
        <div class="key" style="font-size:18px;letter-spacing:0;">${email}</div>
      </div>

      <a href="https://restandrootholistic.com/login?email=${encodeURIComponent(email)}" class="button">
        Open Your Scanner →
      </a>

      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div>Tap the button above</div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div>We'll email you a 6-digit code. Type it in.</div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div>You're in! Add it to your home screen so it's one tap away.</div>
        </div>
      </div>

      <hr class="divider">

      <p>I'm so glad you're here. You just made a really good decision for your family. 🌿</p>

      <p>If you have any questions, just reply to this email — I read every one.</p>

      <p style="margin-top: 24px;">With love,<br><strong>Lindsay</strong><br><span style="color: #7A9E7E; font-size: 13px;">Certified Naturopath + HTMA Practitioner<br>Rest & Root Holistic Health</span></p>

      <hr class="divider">

      <div class="footer">
        <p>Save this email so you can always find your login link.<br>
        <a href="https://restandrootholistic.com">restandrootholistic.com</a> ·
        <a href="mailto:restandrootholistichealing@gmail.com">restandrootholistichealing@gmail.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

  try {
    console.log('Attempting to send email via Resend...');
    const result = await resend.emails.send({
      from: 'Lindsay | Rest & Root <lindsay@mail.restandrootholistic.com>',
      replyTo: 'restandrootholistichealth@gmail.com',
      to: email,
      subject: '🌿 Your Rest & Root Label Scanner is ready!',
      html: emailHtml,
    });

    // resend.emails.send() does NOT throw on a rejected send — it resolves
    // with { data: null, error: {...} }. Treating any resolved promise as
    // success (the old behavior) silently swallowed real failures, e.g. a
    // 403 "domain not verified" error. Check result.error explicitly.
    if (result?.error) {
      console.error('=== EMAIL SEND FAILED ===');
      console.error('Resend error:', JSON.stringify(result.error));
      throw new Error(result.error.message || 'Resend returned an error');
    }

    console.log('=== EMAIL SENT SUCCESSFULLY ===');
    console.log('Result:', JSON.stringify(result));
    return result;
  } catch (sendErr) {
    console.error('=== EMAIL SEND FAILED ===');
    console.error('Error message:', sendErr.message);
    throw sendErr;
  }
}

// ---------------------------------------------------------------------------
// Add-on tools (Clean Cart Builder order bump, Clean Meal Planner upsell).
// Each has its own shared password, checked by api/cart.js and api/meals.js.
// The "match" text must appear in the Systeme.io product or price plan name.
// ---------------------------------------------------------------------------
const ADDONS = [
  {
    match: 'cart builder',
    name: 'Clean Cart Builder',
    tag: ADDON_TAGS.cart,
    path: '/cart',
    button: 'Open Your Cart Builder →',
    intro: 'Paste your normal grocery list, pick your store and budget, and it shows you what is already fine, what to swap, and exactly what to grab — without blowing your budget.',
  },
  {
    match: 'meal planner',
    name: 'Clean Meal Planner',
    tag: ADDON_TAGS.meals,
    path: '/meals',
    button: 'Open Your Meal Planner →',
    intro: 'Tell it about your crew and your week, and it plans simple, clean dinners your family will actually eat, plus one shopping list you can send straight to your Cart Builder.',
  },
];

async function sendAddonEmail(email, name, addon) {
  const firstName = name ? name.split(' ')[0] : 'there';
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FAF6F0;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 20px;"><div style="background:white;border-radius:16px;padding:40px;">
<div style="font-size:32px;text-align:center;margin-bottom:8px;">🌿</div>
<div style="text-align:center;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#7A9E7E;margin-bottom:24px;">Rest &amp; Root Holistic Health</div>
<h1 style="font-size:24px;color:#5C3D2E;text-align:center;margin:0 0 16px;">Your ${addon.name} is ready, ${firstName}!</h1>
<p style="font-size:15px;color:#8B6F5C;line-height:1.6;">${addon.intro}</p>
<div style="background:#EEF4EE;border:2px dashed #7A9E7E;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
<div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#7A9E7E;margin-bottom:8px;">Log in with</div>
<div style="font-size:18px;font-weight:bold;color:#5C3D2E;">${email}</div></div>
<a href="https://restandrootholistic.com/login?email=${encodeURIComponent(email)}&next=${addon.path}" style="display:block;background:#7A9E7E;color:white;text-decoration:none;text-align:center;padding:16px 24px;border-radius:12px;font-size:15px;font-weight:bold;margin:24px 0;">${addon.button}</a>
<p style="font-size:15px;color:#8B6F5C;line-height:1.6;">It's already on your account. Open your scanner and tap <strong>${addon.name.replace('Clean ', '')}</strong> in the menu at the top. Same email, no extra password.</p>
<p style="font-size:15px;color:#8B6F5C;line-height:1.6;">Questions? Just reply to this email — I read every one.</p>
<p style="font-size:15px;color:#8B6F5C;line-height:1.6;margin-top:24px;">With love,<br><strong>Lindsay</strong><br><span style="color:#7A9E7E;font-size:13px;">Certified Naturopath + HTMA Practitioner<br>Rest &amp; Root Holistic Health</span></p>
<p style="text-align:center;font-size:12px;color:#8B6F5C;margin-top:24px;">Save this email so you can always find your login link.</p>
</div></div></body></html>`;

  const result = await resend.emails.send({
    from: 'Lindsay | Rest & Root <lindsay@mail.restandrootholistic.com>',
    replyTo: 'restandrootholistichealth@gmail.com',
    to: email,
    subject: `🌿 Your ${addon.name} is ready!`,
    html,
  });
  if (result?.error) {
    console.error(`=== ${addon.name} EMAIL FAILED ===`, JSON.stringify(result.error));
    throw new Error(result.error.message || 'Resend returned an error');
  }
  console.log(`=== ${addon.name} EMAIL SENT ===`, JSON.stringify(result));
  return result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    console.log('Systeme.io webhook received:', JSON.stringify(body));

    // This webhook is registered account-wide on "New sale", so it fires for
    // EVERY product Lindsay sells — not just the Label Scanner. Guard against
    // emailing the scanner password to buyers of other products by checking
    // whether "Label Scanner" appears anywhere in the payload (the digital
    // product is named "Rest & Root Label Scanner" and its price plans are
    // "Label Scanner - Monthly" / "Label Scanner - Annual", so this should
    // catch it regardless of which exact field systeme.io puts the name in).
    const payloadText = JSON.stringify(body).toLowerCase();
    const isScanner = payloadText.includes('label scanner');
    const addonsBought = ADDONS.filter(a => payloadText.includes(a.match));
    if (!isScanner && addonsBought.length === 0) {
      console.log('Sale is not for the Label Scanner or its add-ons — skipping password email.');
      return res.status(200).json({ success: true, message: 'Not a scanner or add-on sale — skipped' });
    }

    // Systeme.io payload shapes vary by trigger type — check several
    // common paths. If none match, the full payload is in the log above
    // so this list can be extended.
    const email =
      body?.data?.contact?.email ||
      body?.contact?.email ||
      body?.customer?.email ||
      body?.order?.customer?.email ||
      body?.email ||
      null;

    const name =
      body?.customer?.fields?.first_name ||
      body?.data?.contact?.fields?.first_name ||
      body?.contact?.fields?.first_name ||
      body?.data?.contact?.first_name ||
      body?.contact?.first_name ||
      body?.customer?.name ||
      body?.name ||
      '';

    if (!email) {
      console.error('No email found in Systeme.io webhook payload:', JSON.stringify(body));
      return res.status(400).json({
        success: false,
        message: 'No customer email found in webhook payload'
      });
    }

    // Systeme.io may send one webhook for the whole order (scanner + bump) or
    // one per product. Each email goes out for whatever product this payload
    // names. Worst case, a buyer gets the scanner email twice — harmless.
    const sent = [];
    const failed = [];

    if (isScanner) {
      // Tag scanner buyers so newsletters can go to "Scanner Customer".
      try { await tagContact(email, 'Scanner Customer'); }
      catch (e) { console.error('Could not add Scanner Customer tag:', e.message); }
      try { await sendPasswordEmail(email, name); sent.push('Label Scanner'); }
      catch (e) { console.error('Scanner email error:', e); failed.push('Label Scanner'); }
    }
    for (const addon of addonsBought) {
      // The tag is what unlocks the tool at login — do it first.
      // Retry briefly: the contact may be created a moment after the sale.
      let tagged = false;
      for (let i = 0; i < 3 && !tagged; i++) {
        try { await tagContact(email, addon.tag); tagged = true; }
        catch (e) { console.error(`Tagging ${addon.name} (try ${i + 1}) failed:`, e.message); await new Promise(r => setTimeout(r, 2000)); }
      }
      if (!tagged) console.error(`=== COULD NOT TAG ${email} with "${addon.tag}" — add it by hand in Systeme.io ===`);
      try { await sendAddonEmail(email, name, addon); sent.push(addon.name); }
      catch (e) { console.error(`${addon.name} email error:`, e); failed.push(addon.name); }
    }

    console.log(`Emails to ${email} — sent: [${sent.join(', ')}] failed: [${failed.join(', ')}]`);
    return res.status(200).json({
      success: true,
      message: failed.length ? 'Some emails failed — check logs' : 'Emails sent',
      sent,
      failed,
    });

  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
