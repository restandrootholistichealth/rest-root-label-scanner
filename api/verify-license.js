// /api/verify-license.js
// Verifies a Gumroad license key for the Rest & Root Label Scanner.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }

  const { licenseKey, alreadyActivated } = body || {};

  if (!licenseKey || typeof licenseKey !== 'string') {
    return res.status(400).json({ success: false, message: 'Please enter a license key.' });
  }

  const PRODUCT_PERMALINK = process.env.GUMROAD_PRODUCT_PERMALINK || 'scanner';

  try {
    const params = new URLSearchParams({
      product_permalink: PRODUCT_PERMALINK,
      license_key: licenseKey.trim(),
      increment_uses_count: alreadyActivated ? 'false' : 'true',
    });

    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await gumroadResponse.json();

    if (!data.success) {
      return res.status(200).json({
        success: false,
        message: 'That license key isn\'t valid. Double-check your Gumroad receipt and try again.',
      });
    }

    if (data.purchase && (data.purchase.refunded || data.purchase.chargebacked || data.purchase.disputed)) {
      return res.status(200).json({
        success: false,
        message: 'This license is no longer active. Please contact support if you believe this is an error.',
      });
    }

    const MAX_DEVICES = 3;
    const usesCount = data.uses || 0;

    if (!alreadyActivated && usesCount > MAX_DEVICES) {
      return res.status(200).json({
        success: false,
        message: `This license has already been activated on ${MAX_DEVICES} devices. If you need help, please reach out to Lindsay.`,
      });
    }

    return res.status(200).json({
      success: true,
      buyerEmail: data.purchase?.email || '',
      buyerName: data.purchase?.full_name || '',
      usesCount,
      maxDevices: MAX_DEVICES,
    });

  } catch (err) {
    console.error('License verification error:', err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong verifying your license. Please try again in a moment.',
    });
  }
}
