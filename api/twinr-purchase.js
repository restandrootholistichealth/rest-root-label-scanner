// api/twinr-purchase.js
// Receives purchase confirmations from Twinr
// Returns load_url immediately to redirect user to scanner

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Respond IMMEDIATELY with load_url before any processing
  // This ensures Twinr gets the redirect URL as fast as possible
  res.status(200).json({
    success: true,
    load_url: 'https://scanner.restandrootholistic.com/scanner',
  });

  // Log purchase details after responding (non-blocking)
  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    console.log('Twinr purchase received:', JSON.stringify({
      twinr_product_id: body?.twinr_product_id,
      store_product_id: body?.store_product_id,
      platform: body?.platform,
      success: body?.success,
    }));

  } catch (err) {
    console.error('Twinr purchase log error:', err);
  }
}