// api/samcart-webhook.js
// Receives SamCart purchase webhooks, generates a unique license key,
// and sends it to the buyer via MailerLite transactional email.

import crypto from 'crypto';

// Simple in-memory key store — in production this would be a database
// For now we store keys in a global object that persists per Vercel instance
if (!global.licenseKeys) {
  global.licenseKeys = {};
}

function generateLicenseKey() {
  // Generates a key in format: XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return segments.join('-');
}

async function sendKeyEmail(email, name, licenseKey) {
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
    .key { font-size: 18px; font-weight: bold; color: #5C3D2E; letter-spacing: 0.1em; word-break: break-all; }
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
      
      <p>Welcome to the Rest & Root Label Scanner family. Your unique license key is below — you'll only need this once.</p>

      <div class="key-box">
        <div class="key-label">Your License Key</div>
        <div class="key">${licenseKey}</div>
      </div>

      <a href="https://scanner.restandrootholistic.com" class="button">
        Open Your Scanner →
      </a>

      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div>Click the button above to open your scanner</div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div>Paste your license key from above into the unlock box</div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div>Click "Unlock Scanner" — that's it! You're in forever on this device</div>
        </div>
      </div>

      <p style="font-size: 13px;">You can activate your scanner on up to <strong>3 devices</strong> total (phone + laptop + tablet, or any combination). Just paste your key each time.</p>

      <hr class="divider">

      <p>I'm so glad you're here. You just made a really good decision for your family. 🌿</p>
      
      <p>If you have any questions, just reply to this email — I read every one.</p>

      <p style="margin-top: 24px;">With love,<br><strong>Lindsay</strong><br><span style="color: #7A9E7E; font-size: 13px;">Certified Naturopath + HTMA Practitioner<br>Rest & Root Holistic Health</span></p>

      <hr class="divider">

      <div class="footer">
        <p>Save this email — your license key lives here.<br>
        <a href="https://restandrootholistic.com">restandrootholistic.com</a> · 
        <a href="mailto:restandrootholistichealing@gmail.com">restandrootholistichealing@gmail.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const response = await fetch('https://connect.mailerlite.com/api/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      from: 'restandrootholistichealing@gmail.com',
      from_name: 'Lindsay | Rest & Root',
      to: [{ email: email, name: name || '' }],
      subject: '🌿 Your Rest & Root Label Scanner is ready!',
      html: emailHtml,
    }),
  });

  return response;
}

export default async function handler(req, res) {
  // Allow CORS
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

    console.log('SamCart webhook received:', JSON.stringify(body));

    // Extract buyer info from SamCart webhook payload
    // SamCart sends different formats — we handle the most common ones
    const email = 
      body?.customer?.email || 
      body?.email ||
      body?.billing_address?.email ||
      body?.order?.customer?.email ||
      null;

    const name = 
      body?.customer?.name ||
      body?.customer?.full_name ||
      `${body?.customer?.first_name || ''} ${body?.customer?.last_name || ''}`.trim() ||
      body?.name ||
      body?.order?.customer?.name ||
      '';

    if (!email) {
      console.error('No email found in webhook payload:', JSON.stringify(body));
      return res.status(400).json({ 
        success: false, 
        message: 'No customer email found in webhook payload' 
      });
    }

    // Generate a unique license key for this buyer
    const licenseKey = generateLicenseKey();

    // Store the key (email → key mapping)
    global.licenseKeys[licenseKey] = {
      email: email.toLowerCase(),
      name: name,
      createdAt: new Date().toISOString(),
      uses: 0,
      maxUses: 3,
    };

    console.log(`Generated key ${licenseKey} for ${email}`);

    // Send the key email via MailerLite
    const emailResponse = await sendKeyEmail(email, name, licenseKey);
    
    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('MailerLite email error:', errorText);
      // Still return success to SamCart — we don't want to retry the webhook
      // Log the key so we can manually send it if needed
      console.log(`MANUAL KEY NEEDED: ${email} → ${licenseKey}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Key generated but email failed — check logs',
        key: licenseKey 
      });
    }

    console.log(`Key email sent successfully to ${email}`);
    return res.status(200).json({ success: true, message: 'Key generated and email sent' });

  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
