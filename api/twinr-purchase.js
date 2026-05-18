// api/twinr-purchase.js
// Receives purchase confirmations from Twinr after successful App Store/Google Play subscription
// Unlocks the scanner for the subscriber

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Log the incoming webhook for debugging
  console.log('Twinr purchase webhook received:', JSON.stringify(req.body));
  console.log('Headers:', JSON.stringify(req.headers));

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    // Initialize purchase store if needed
    if (!global.purchases) {
      global.purchases = {};
    }

    // Extract purchase info from Twinr webhook
    // Twinr sends different fields depending on platform
    const productId = 
      body?.product_id ||
      body?.productId ||
      body?.sku ||
      body?.purchase?.product_id ||
      null;

    const transactionId =
      body?.transaction_id ||
      body?.transactionId ||
      body?.purchase?.transaction_id ||
      body?.orderId ||
      null;

    const purchaseToken =
      body?.purchase_token ||
      body?.purchaseToken ||
      body?.token ||
      null;

    const platform =
      body?.platform ||
      body?.source ||
      'unknown';

    const status =
      body?.status ||
      body?.purchase_state ||
      body?.type ||
      'purchased';

    console.log(`Purchase received: product=${productId}, transaction=${transactionId}, platform=${platform}, status=${status}`);

    // Valid product IDs
    const validProducts = [
      'com.restandroot.labelscanner.monthly',
      'com.restandroot.labelscanner.yearly',
      'scanner_monthly',
      'scanner_yearly',
    ];

    // Check if this is a valid purchase
    const isValidProduct = !productId || validProducts.some(p => 
      productId.toLowerCase().includes('monthly') || 
      productId.toLowerCase().includes('yearly') ||
      productId === p
    );

    // Store the purchase
    if (transactionId) {
      global.purchases[transactionId] = {
        productId,
        platform,
        status,
        purchaseToken,
        timestamp: new Date().toISOString(),
        unlocked: true,
      };
    }

    // Always return success to Twinr
    // The actual unlocking happens client-side via localStorage
    return res.status(200).json({
      success: true,
      message: 'Purchase received',
      productId,
      transactionId,
      platform,
      unlocked: true,
    });

  } catch (err) {
    console.error('Twinr purchase webhook error:', err);
    // Still return 200 to prevent Twinr from retrying
    return res.status(200).json({
      success: false,
      message: err.message,
    });
  }
}
