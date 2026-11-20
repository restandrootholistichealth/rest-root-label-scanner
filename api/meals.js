// api/meals.js
// Clean Meal Planner — builds a week of simple, clean dinners for the family
// plus a combined shopping list that can be sent to the Clean Cart Builder.
// Access: shared password (emailed after purchase), checked on every request.

import Anthropic from "@anthropic-ai/sdk";
import { checkAccess } from "./_auth.js";


const BUDGET_HINTS = {
  tight: "TIGHT BUDGET: Lean on affordable whole foods — eggs, beans, lentils, rice, potatoes, whole chickens and chicken thighs, ground beef or turkey, frozen vegetables, seasonal produce. Reuse ingredients across meals so nothing goes to waste. Make one meal a planned leftovers night.",
  moderate: "MODERATE BUDGET: Mix affordable staples with a couple of nicer proteins. Reuse ingredients across meals to cut waste.",
  flexible: "FLEXIBLE BUDGET: Any quality whole-food ingredients are fine, including grass-fed beef, wild salmon, and pasture-raised chicken."
};

function buildPrompt({ adults, kids, dinners, minutes, budget, needs, dislikes, lunches }) {
  const needsText = needs && needs.length ? needs.join(', ') : 'none';
  return `You are the Rest & Root Clean Meal Planner, made by Lindsay Greear, certified naturopath. You plan simple, family-friendly, whole-food meals for busy moms. Respond ONLY with valid JSON, no markdown, no preamble.

THE FAMILY
- ${adults} adult(s) and ${kids} kid(s). Size every recipe and the shopping list for this household.
- ${dinners} dinners this week${lunches ? ', plus a simple lunch idea for each of those days that mostly reuses dinner leftovers or pantry staples' : ''}.
- Hands-on cooking time: about ${minutes} minutes or less per dinner. Sheet pan, slow cooker, Instant Pot, and one-pan meals are great.
- ${BUDGET_HINTS[budget] || BUDGET_HINTS.moderate}
- Must work around: ${needsText}.
- Foods they don't like: ${dislikes || 'none listed'}.

STRICT DIET RULES — never break these:
- Gluten-free: no wheat, barley, rye, regular flour, regular pasta, regular bread, couscous, or regular oats. Use certified gluten-free oats, rice, potatoes, gluten-free pasta, corn tortillas. Use tamari or coconut aminos instead of soy sauce.
- Dairy-free: no milk, butter, ghee, cheese, cream, sour cream, yogurt, whey, or casein. Use olive oil, avocado oil, coconut oil, or coconut milk instead. These strict rules override the cooking-fat list below.
- Nut-free: no tree nuts, peanuts, nut butters, nut flours, or nut milks. Coconut is fine.
- Egg-free: no eggs, including in baked goods and as binders.
- Vegetarian: no meat, poultry, or fish.
If a rule applies, every meal, lunch, and shopping list item must follow it.

REST & ROOT STANDARDS
- Real, whole-food ingredients. No boxed mixes, seasoning packets, canned cream soups, or bottled dressings — make simple sauces from scratch or name a clean bottled option to look for.
- Cook with olive oil, avocado oil, butter, ghee, or coconut oil — never canola, vegetable, soybean, or corn oil.
- Sea salt instead of table salt.
- Kid-friendly flavors when there are kids. Include one "build your own" style meal (tacos, bowls, etc.) when there are kids.
- Calm, encouraging tone. No health claims, no talk of diseases or conditions, no supplement advice.

KEEP IT SHORT so it fits on a phone: each recipe gets at most 6 short steps. Ingredients include amounts.

JSON format:
{
  "meals": [
    {
      "day": "Day 1",
      "name": "meal name",
      "minutes": 30,
      "kid_tip": "one short tip to make it kid-approved (empty string if no kids)",
      "ingredients": ["1 lb ground beef", "..."],
      "steps": ["short step", "..."],
      "lunch": "short lunch idea for this day (empty string if lunches were not requested)"
    }
  ],
  "shopping_list": [
    { "item": "ground beef", "amount": "2 lb", "section": "Produce" or "Meat & Seafood" or "Dairy & Eggs" or "Bakery & Bread" or "Pantry" or "Frozen" or "Snacks" or "Drinks" or "Other" }
  ],
  "pantry_staples": ["things most kitchens already have that the plan uses, e.g. sea salt, olive oil, garlic powder"],
  "prep_ahead": "One or two sentences on a 20-minute Sunday prep that makes the week easier.",
  "encouragement": "One warm sentence."
}

The shopping_list must combine the same ingredient across all meals into one line with the total amount, and must NOT include anything in pantry_staples.`;
}

function parseJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch (e) { return null; }
}

const clampInt = (v, lo, hi, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const b = body || {};

  const access = await checkAccess(b.session, 'meals');
  if (!access.ok) {
    const status = access.code === 'login' ? 401 : access.code === 'renew' ? 402 : 403;
    return res.status(status).json({ code: access.code, session: access.session || null, error: access.code === 'login' ? 'Please log in.' : access.code === 'renew' ? "Your scanner subscription isn't active." : "The Clean Meal Planner isn't on your account yet." });
  }
  if (b.verify_only) return res.status(200).json({ ok: true, session: access.session || null });

  const opts = {
    adults: clampInt(b.adults, 1, 8, 2),
    kids: clampInt(b.kids, 0, 8, 2),
    dinners: clampInt(b.dinners, 3, 7, 5),
    minutes: clampInt(b.minutes, 15, 90, 30),
    budget: ['tight', 'moderate', 'flexible'].includes(b.budget) ? b.budget : 'moderate',
    needs: Array.isArray(b.needs) ? b.needs.slice(0, 10).map(String) : [],
    dislikes: String(b.dislikes || '').slice(0, 300),
    lunches: !!b.lunches,
  };

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8000,
      messages: [{ role: "user", content: buildPrompt(opts) }],
    });
    const text = message.content.map(c => c.text || "").join("").trim();
    const parsed = parseJson(text);
    if (!parsed || !Array.isArray(parsed.meals) || parsed.meals.length === 0) {
      console.error('Meal Planner could not parse:', text.slice(0, 500));
      return res.status(500).json({ error: "Something went sideways planning your week. Please try again." });
    }
    if (access.session) parsed.session = access.session;
    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Meal Planner error:', err);
    return res.status(500).json({ error: "Something went sideways planning your week. Please try again." });
  }
}
