// api/cart.js
// Clean Cart Builder — rewrites a grocery list with cleaner options the
// shopper can actually find at her store, within her budget.
// Access: a shared password (emailed after purchase) is sent with every
// request and checked here, so the AI can't be used without buying.

import Anthropic from "@anthropic-ai/sdk";

const CART_PASSWORD = 'CleanCart2026';

const STORE_HINTS = {
  walmart: "Walmart: Great Value Organic, Marketside Organic, Simple Mills, Siete, Primal Kitchen, Kevita, Annie's, Applegate, Horizon Organic, Chosen Foods.",
  target: "Target: Good & Gather Organic, Simple Truth is NOT at Target, Simple Mills, Siete, Primal Kitchen, Annie's, Applegate, Banza, Chosen Foods, Lesser Evil.",
  aldi: "Aldi: Simply Nature (organic/cleaner line), Never Any! (no antibiotics/added hormones meats), SimplyNature organic produce and pantry, Fit & Active is NOT a clean line.",
  kroger: "Kroger and Kroger-family stores: Simple Truth and Simple Truth Organic, Private Selection, Primal Kitchen, Siete, Simple Mills, Applegate, Annie's.",
  costco: "Costco: Kirkland Signature Organic, Kirkland avocado oil, Kirkland organic eggs, Kirkland grass-fed butter, Siete, Simple Mills, Mary's Gone Crackers, Rao's.",
  publix: "Publix: GreenWise (organic/cleaner line), Simple Mills, Siete, Primal Kitchen, Applegate, Annie's.",
  wholefoods: "Whole Foods: 365 by Whole Foods Market (organic versions), plus most clean brands. Whole Foods already bans many additives — still check seed oils and added sugars.",
  traderjoes: "Trader Joe's: Trader Joe's organic products. Trader Joe's avoids artificial colors and preservatives in its own brand — still check seed oils, sugars, and 'natural flavors.'",
  sprouts: "Sprouts: Sprouts brand organic products, plus most clean brands like Siete, Simple Mills, Primal Kitchen.",
  meijer: "Meijer: True Goodness by Meijer (organic/cleaner line), Simple Mills, Siete, Primal Kitchen, Applegate.",
  other: "Unknown store: favor widely available national clean brands (Simple Mills, Siete, Primal Kitchen, Applegate, Annie's Organic, Bob's Red Mill, Kerrygold, Rao's) and the store's own organic line."
};

const BUDGET_HINTS = {
  tight: "TIGHT BUDGET: Keep the total close to what she spends now. Prefer store-brand organic lines, bulk staples, and swaps that cost the same. Only suggest a pricier swap for the 2-3 items where it matters most (things eaten daily, items with artificial dyes, HFCS, or seed-oil-heavy snacks for kids). For everything else, say 'keep as is' or give a same-price better pick.",
  moderate: "MODERATE BUDGET: She can spend a little more on items that matter. Swap the high-impact items; keep low-impact items as is or suggest store-brand organic.",
  flexible: "FLEXIBLE BUDGET: She is happy to spend more for the cleanest option. Suggest the best clean version of each item that is realistically available at her store."
};

function buildPrompt({ list, store, budget, needs }) {
  const storeHint = STORE_HINTS[store] || STORE_HINTS.other;
  const budgetHint = BUDGET_HINTS[budget] || BUDGET_HINTS.moderate;
  const needsText = needs && needs.length ? needs.join(', ') : 'none';

  return `You are the Rest & Root Clean Cart Builder, made by Lindsay Greear, certified naturopath. You help busy moms turn their normal grocery list into a cleaner one they can actually buy at their store, without fear and without blowing the budget. Respond ONLY with valid JSON, no markdown, no preamble.

THE SHOPPER
- Store: ${storeHint}
- ${budgetHint}
- Household needs: ${needsText}. Every suggestion MUST respect these. If she is gluten-free, never suggest anything with wheat, barley, rye, or regular oats (only certified gluten-free oats). Dairy-free means no milk, butter, cheese, whey, or casein. Nut-free means no tree nuts or peanuts, including nut flours and nut milks. Egg-free means no eggs. If an original item conflicts with her needs, give a compliant swap.

WHAT "CLEANER" MEANS (Rest & Root standards)
Priority to replace: artificial dyes (Red 40, Yellow 5/6, Blue 1), high fructose corn syrup, artificial sweeteners (sucralose, aspartame, ace-K), artificial flavors, nitrates/nitrites in processed meats, BHA/BHT/TBHQ, carrageenan, MSG and hidden glutamates, partially hydrogenated oils, fragranced cleaning or personal care products.
Worth improving: seed oils (canola, soybean, corn, cottonseed) — prefer avocado, olive, coconut oil, butter, or ghee; enriched/bleached flour — prefer whole grain or organic; conventional dairy — prefer organic or rBGH-free; the Dirty Dozen produce (strawberries, spinach, kale, grapes, apples, peaches, cherries, pears, nectarines, bell peppers, celery, tomatoes) — prefer organic; conventional meat — prefer grass-fed, pasture-raised, or no antibiotics; table salt — prefer sea salt.
Fine as is: most whole, single-ingredient foods. The Clean Fifteen produce (avocados, sweet corn, pineapple, onions, papaya, frozen peas, asparagus, honeydew, kiwi, cabbage, mushrooms, mango, sweet potatoes, watermelon, carrots) does not need to be organic. Plain frozen fruit and vegetables are great.

RULES
1. Go through EVERY item on her list, in her order. Do not skip any. Combine exact duplicates.
2. Only suggest brands or store lines that are realistically sold at her store. Never invent a product name. If you are not sure a specific product is carried there, name the store's own organic line or describe exactly what to look for instead.
3. "look_for" is the label check that works even if the suggested product is out of stock — always fill it for swaps.
4. Calm, practical tone. No fear language. Never tell her something is toxic or dangerous. Never make health or medical claims, never mention diseases or conditions, and never give dosing or supplement advice. If the list includes medicine, supplements, or baby formula, set action to "keep" and set why to "Ask your doctor or pharmacist before changing this one."
5. Keep each "why" to one short sentence a shopper can read in the aisle.
6. price_change: "same" (about the same price), "a bit more" (roughly up to $1-2 more), or "more" (noticeably pricier).
7. priority (for swaps only): "high" for things eaten or used daily or by kids, or with dyes/HFCS/artificial sweeteners/nitrites; "medium" for seed oils, enriched flour, conventional Dirty Dozen produce; "low" for nice-to-haves.
8. Non-food items (cleaning, laundry, personal care, paper goods): apply the same idea — prefer fragrance-free and dye-free options sold at that store.

JSON format:
{
  "items": [
    {
      "original": "item exactly as she wrote it",
      "action": "keep" or "swap",
      "pick": "what to put in the cart (the swap, or the original if keeping) — specific brand/store line when possible",
      "why": "one short sentence",
      "look_for": "the label check, e.g. 'No Red 40 — colored with fruit or vegetable juice' (empty string if keep)",
      "price_change": "same" or "a bit more" or "more",
      "priority": "high" or "medium" or "low" (use "low" for keeps),
      "section": "Produce" or "Meat & Seafood" or "Dairy & Eggs" or "Bakery & Bread" or "Pantry" or "Frozen" or "Snacks" or "Drinks" or "Household" or "Personal Care" or "Other"
    }
  ],
  "top_three": ["the three swaps that make the biggest difference, as short phrases"],
  "budget_note": "One encouraging sentence about cost, e.g. how to keep this list close to her usual spend.",
  "encouragement": "One warm sentence reminding her progress beats perfection."
}

HER GROCERY LIST:
${list}`;
}

function parseJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch (e) {}
  // Repair a cut-off response: keep every complete item
  const raw = match[0];
  const lastItem = raw.lastIndexOf('"section"');
  if (lastItem > 0) {
    const end = raw.indexOf('}', lastItem);
    if (end > 0) {
      try { return JSON.parse(raw.substring(0, end + 1) + ']}'); } catch (e) {}
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const { key, verify_only, list, store, budget, needs } = body || {};

  if ((key || '').trim() !== CART_PASSWORD) {
    return res.status(401).json({ error: "That password didn't work. Check your Cart Builder email from Lindsay." });
  }
  if (verify_only) return res.status(200).json({ ok: true });

  const cleanList = String(list || '').trim().slice(0, 4000);
  if (!cleanList) return res.status(400).json({ error: "Add a few items to your list first." });

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 6000,
      messages: [{ role: "user", content: buildPrompt({ list: cleanList, store, budget, needs: Array.isArray(needs) ? needs.slice(0, 10) : [] }) }],
    });
    const text = message.content.map(c => c.text || "").join("").trim();
    const parsed = parseJson(text);
    if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      console.error('Cart Builder could not parse:', text.slice(0, 500));
      return res.status(500).json({ error: "Something went sideways building your cart. Please try again." });
    }
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Cart Builder error:', err);
    return res.status(500).json({ error: "Something went sideways building your cart. Please try again." });
  }
}
