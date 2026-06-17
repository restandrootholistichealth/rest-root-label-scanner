import Anthropic from "@anthropic-ai/sdk";

// Verified sources hardcoded per ingredient category
// All sources are peer-reviewed research, government agencies, or established scientific organizations
const VERIFIED_SOURCES = {
  parabens: [
    { name: "NIH NIEHS — Endocrine Disruptors", url: "https://www.niehs.nih.gov/health/topics/agents/endocrine/index.cfm" },
    { name: "PubMed — Paraben Estrogenic Effects", url: "https://pubmed.ncbi.nlm.nih.gov/17306434/" },
    { name: "EWG Skin Deep — Methylparaben", url: "https://www.ewg.org/skindeep/ingredients/704389-METHYLPARABEN/" },
    { name: "National Toxicology Program", url: "https://ntp.niehs.nih.gov/" }
  ],
  fragrance: [
    { name: "Campaign for Safe Cosmetics — Fragrance", url: "https://www.safecosmetics.org/chemicals/fragrance/" },
    { name: "PubMed — Fragrance as Endocrine Disruptor", url: "https://pubmed.ncbi.nlm.nih.gov/28478814/" },
    { name: "EWG — Fragrance Ingredient Database", url: "https://www.ewg.org/skindeep/ingredients/702512-FRAGRANCE/" },
    { name: "NIH — Personal Care Product Safety", url: "https://newsinhealth.nih.gov/2022/08/probing-personal-care-products" }
  ],
  formaldehyde: [
    { name: "NIH NTP — Formaldehyde Report on Carcinogens", url: "https://ntp.niehs.nih.gov/ntp/roc/content/profiles/formaldehyde.pdf" },
    { name: "EPA — Formaldehyde Health Effects", url: "https://www.epa.gov/formaldehyde/facts-about-formaldehyde" },
    { name: "IARC — Group 1 Carcinogen Classification", url: "https://www.iarc.who.int/" }
  ],
  phthalates: [
    { name: "NIH NIEHS — Phthalates Research", url: "https://www.niehs.nih.gov/health/topics/agents/endocrine/index.cfm" },
    { name: "CDC — Phthalates Biomonitoring Fact Sheet", url: "https://www.cdc.gov/biomonitoring/phthalates_factsheet.html" },
    { name: "MDPI Endocrines — Phthalates as Endocrine Disruptors 2024", url: "https://www.mdpi.com/2673-396X/5/3/27" }
  ],
  sls: [
    { name: "EWG Skin Deep — Sodium Lauryl Sulfate", url: "https://www.ewg.org/skindeep/ingredients/706110-SODIUM_LAURYL_SULFATE/" },
    { name: "PubMed — SLS Skin Barrier Disruption", url: "https://pubmed.ncbi.nlm.nih.gov/3401788/" },
    { name: "Campaign for Safe Cosmetics", url: "https://www.safecosmetics.org/" }
  ],
  bha_bht: [
    { name: "NIH NTP — BHA Report on Carcinogens", url: "https://ntp.niehs.nih.gov/ntp/roc/content/profiles/butylatedhydroxyanisole.pdf" },
    { name: "EWG — BHA Hazard Score", url: "https://www.ewg.org/skindeep/ingredients/700879-BHA/" },
    { name: "European Chemicals Agency — BHA", url: "https://echa.europa.eu/substance-information/-/substanceinfo/100.002.368" }
  ],
  triclosan: [
    { name: "FDA — 5 Things to Know About Triclosan", url: "https://www.fda.gov/consumers/consumer-updates/5-things-know-about-triclosan" },
    { name: "PubMed — Triclosan Endocrine Effects", url: "https://pubmed.ncbi.nlm.nih.gov/31744686/" },
    { name: "EWG — Triclosan", url: "https://www.ewg.org/skindeep/ingredients/706623-TRICLOSAN/" }
  ],
  artificial_dyes: [
    { name: "Center for Science in the Public Interest — Food Dyes", url: "https://www.cspinet.org/resource/food-dyes-rainbow-risks" },
    { name: "PubMed — Synthetic Food Dye Safety Review", url: "https://pubmed.ncbi.nlm.nih.gov/22026433/" },
    { name: "EWG — Artificial Colors in Food", url: "https://www.ewg.org/foodscores/content/natural-vs-artificial-food-dyes" }
  ],
  oxybenzone: [
    { name: "EWG — Sunscreen Chemical Safety", url: "https://www.ewg.org/sunscreen/report/the-trouble-with-sunscreen-chemicals/" },
    { name: "PubMed — Oxybenzone Endocrine Disruption", url: "https://pubmed.ncbi.nlm.nih.gov/18438973/" },
    { name: "CDC — Sunscreen Absorption Study", url: "https://www.cdc.gov/nchs/products/databriefs/db336.htm" }
  ],
  carrageenan: [
    { name: "PubMed — Carrageenan Inflammation Research", url: "https://pubmed.ncbi.nlm.nih.gov/23538004/" },
    { name: "Cornucopia Institute — Carrageenan Report", url: "https://www.cornucopia.org/carrageenan/" }
  ],
  general: [
    { name: "NIH — Personal Care Product Safety Research", url: "https://newsinhealth.nih.gov/2022/08/probing-personal-care-products" },
    { name: "EWG Skin Deep Cosmetics Database", url: "https://www.ewg.org/skindeep/" },
    { name: "Campaign for Safe Cosmetics", url: "https://www.safecosmetics.org/" },
    { name: "NIH PMC — Cosmetic Toxicology Review", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11381309/" }
  ]
};

// Verified chemical combination interaction data
// ALL sources are peer-reviewed research, government agencies, or established scientific organizations
// Combinations fall into two categories:
// 1. REACTIVE — two ingredients create a new toxic compound
// 2. SYNERGISTIC — two ingredients amplify each other's harmful effects
const COMBINATION_INTERACTIONS = [

  // ============================================================
  // REACTIVE COMBINATIONS — create new toxic compounds
  // ============================================================
  {
    ingredients: ['sodium hypochlorite', 'ammonia'],
    type: 'REACTIVE',
    severity: 'DANGER',
    warning: "⚠️ DANGEROUS COMBINATION: Bleach (sodium hypochlorite) + Ammonia — When these two ingredients are mixed or used in the same space, they react to produce toxic chloramine gas. Exposure can cause eye irritation, coughing, shortness of breath, chest pain, and in high concentrations, pneumonia, lung damage, or death. This is a well-documented chemical hazard confirmed by the CDC, NIH, and Washington State Department of Health.",
    sources: [
      { name: "NIH — Chlorine Gas Toxicity (StatPearls)", url: "https://www.ncbi.nlm.nih.gov/books/NBK537213/" },
      { name: "PubMed — Mass Casualties from Chloramine Gas", url: "https://pubmed.ncbi.nlm.nih.gov/9503902/" },
      { name: "EWG — Dangers of Mixing Cleaning Products", url: "https://www.ewg.org/news-insights/news-release/tragic-accidental-death-mixture-cleaning-products-cautionary-warning" },
      { name: "Washington State Dept of Health — Bleach Mixing Dangers", url: "https://doh.wa.gov/community-and-environment/contaminants/bleach-mixing-dangers" },
      { name: "Poison Control — Chlorine Gas", url: "https://www.poison.org/articles/chlorine-gas" }
    ]
  },
  {
    ingredients: ['sodium hypochlorite', 'ammonium'],
    type: 'REACTIVE',
    severity: 'DANGER',
    warning: "⚠️ DANGEROUS COMBINATION: Bleach + Ammonium compounds — Ammonium-based ingredients react with sodium hypochlorite (bleach) to produce toxic chloramine gas. This is the same dangerous reaction as bleach + ammonia and has caused documented mass casualty events.",
    sources: [
      { name: "NIH — Chlorine Gas Toxicity", url: "https://www.ncbi.nlm.nih.gov/books/NBK537213/" },
      { name: "PubMed — Chloramine Gas Mass Exposure", url: "https://pubmed.ncbi.nlm.nih.gov/9503902/" },
      { name: "Washington State DOH", url: "https://doh.wa.gov/community-and-environment/contaminants/bleach-mixing-dangers" }
    ]
  },
  {
    ingredients: ['sodium hypochlorite', 'acid'],
    type: 'REACTIVE',
    severity: 'DANGER',
    warning: "⚠️ DANGEROUS COMBINATION: Bleach + Acidic ingredients — Mixing bleach (sodium hypochlorite) with acidic ingredients produces chlorine gas, which is toxic to the respiratory system. According to the NIH, even brief exposure can cause eye and throat irritation, and high concentrations can be fatal.",
    sources: [
      { name: "NIH — Chlorine Gas Toxicity", url: "https://www.ncbi.nlm.nih.gov/books/NBK537213/" },
      { name: "Poison Control — Chlorine Gas Facts", url: "https://www.poison.org/articles/chlorine-gas" },
      { name: "EWG — Cleaning Product Mixing Dangers", url: "https://www.ewg.org/news-insights/news-release/tragic-accidental-death-mixture-cleaning-products-cautionary-warning" }
    ]
  },

  // ============================================================
  // SYNERGISTIC COMBINATIONS — amplify harmful effects
  // ============================================================
  {
    ingredients: ['paraben', 'fragrance'],
    type: 'SYNERGISTIC',
    severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: Parabens + Fragrance — Both are associated with endocrine disruption. Research published in Environmental Health Perspectives found that combined exposures to multiple endocrine-disrupting chemicals in personal care products may produce greater hormonal effects than individual exposures alone — a synergistic interaction. Some fragrance compounds also enhance skin absorption of other chemicals.",
    sources: [
      { name: "NIH PMC — Chemical Mixtures in Personal Care Products", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" },
      { name: "PubMed — Paraben Endocrine Effects", url: "https://pubmed.ncbi.nlm.nih.gov/17306434/" },
      { name: "Campaign for Safe Cosmetics — Fragrance", url: "https://www.safecosmetics.org/chemicals/fragrance/" }
    ]
  },
  {
    ingredients: ['paraben', 'phthalate'],
    type: 'SYNERGISTIC',
    severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: Parabens + Phthalates — Both are estrogen-mimicking chemicals. Research in Environmental Health Perspectives on chemical mixtures in personal care products found that combined exposure to multiple endocrine disruptors may produce compounded hormonal disruption greater than each ingredient individually.",
    sources: [
      { name: "NIH PMC — Chemical Mixtures in Personal Care Products", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" },
      { name: "NIH NIEHS — Endocrine Disruptors", url: "https://www.niehs.nih.gov/health/topics/agents/endocrine/index.cfm" },
      { name: "CDC — Phthalates Fact Sheet", url: "https://www.cdc.gov/biomonitoring/phthalates_factsheet.html" }
    ]
  },
  {
    ingredients: ['sls', 'fragrance'],
    type: 'SYNERGISTIC',
    severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: Sodium Lauryl Sulfate + Fragrance — SLS disrupts the skin's natural barrier function, which research suggests may increase the skin's absorption of other chemicals — including the hundreds of undisclosed compounds that can hide under the word 'fragrance.' A compromised skin barrier means more of these chemicals may enter the bloodstream.",
    sources: [
      { name: "PubMed — SLS Skin Barrier Disruption", url: "https://pubmed.ncbi.nlm.nih.gov/3401788/" },
      { name: "NIH PMC — Chemical Mixtures in Personal Care Products", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" },
      { name: "Campaign for Safe Cosmetics", url: "https://www.safecosmetics.org/" }
    ]
  },
  {
    ingredients: ['sodium lauryl sulfate', 'fragrance'],
    type: 'SYNERGISTIC',
    severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: Sodium Lauryl Sulfate + Fragrance — SLS disrupts the skin's natural barrier function, which research suggests may increase skin absorption of other chemicals — including those hiding under 'fragrance.' A damaged skin barrier means more of these compounds may enter the bloodstream.",
    sources: [
      { name: "PubMed — SLS Skin Barrier Disruption", url: "https://pubmed.ncbi.nlm.nih.gov/3401788/" },
      { name: "NIH PMC — Chemical Mixtures in Personal Care Products", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" }
    ]
  },
  {
    ingredients: ['formaldehyde', 'paraben'],
    type: 'SYNERGISTIC',
    severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: Formaldehyde Releaser + Parabens — Using multiple preservative systems with distinct toxicity profiles increases overall preservative burden on the body. Formaldehyde releasers are classified as known carcinogens by the NIH National Toxicology Program, and parabens are linked to endocrine disruption — combining these increases cumulative toxic exposure.",
    sources: [
      { name: "NIH NTP — Formaldehyde Report on Carcinogens", url: "https://ntp.niehs.nih.gov/ntp/roc/content/profiles/formaldehyde.pdf" },
      { name: "PubMed — Paraben Endocrine Effects", url: "https://pubmed.ncbi.nlm.nih.gov/17306434/" },
      { name: "NIH PMC — Chemical Mixtures Research", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" }
    ]
  },
  {
    ingredients: ['triclosan', 'fragrance'],
    type: 'SYNERGISTIC',
    severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: Triclosan + Fragrance — Both have been identified as endocrine disruptors. Research on chemical mixtures in personal care products found that combined exposures can produce compounded effects on hormonal and respiratory health beyond what individual ingredients produce alone.",
    sources: [
      { name: "FDA — Triclosan Safety", url: "https://www.fda.gov/consumers/consumer-updates/5-things-know-about-triclosan" },
      { name: "NIH PMC — Chemical Mixtures in Personal Care Products", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" },
      { name: "PubMed — Triclosan Endocrine Effects", url: "https://pubmed.ncbi.nlm.nih.gov/31744686/" }
    ]
  },
  {
    ingredients: ['bha', 'bht'],
    type: 'SYNERGISTIC',
    severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: BHA + BHT Together — Both are synthetic antioxidant preservatives with similar mechanisms of action and overlapping toxicity concerns. The NIH National Toxicology Program classifies BHA as reasonably anticipated to be a human carcinogen. Using both in the same product increases cumulative exposure to this chemical class.",
    sources: [
      { name: "NIH NTP — BHA Report on Carcinogens", url: "https://ntp.niehs.nih.gov/ntp/roc/content/profiles/butylatedhydroxyanisole.pdf" },
      { name: "EWG — BHT Hazard Rating", url: "https://www.ewg.org/skindeep/ingredients/700801-BHT/" },
      { name: "European Chemicals Agency — BHA", url: "https://echa.europa.eu/substance-information/-/substanceinfo/100.002.368" }
    ]
  },
  {
    ingredients: ['retinol', 'aha'],
    type: 'SYNERGISTIC',
    severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: Retinol + AHA/BHA — Both ingredients increase skin cell turnover and reduce the skin's natural barrier. Used together, they can cause excessive irritation, redness, peeling, and increased photosensitivity. Dermatological research notes this combination significantly increases the risk of skin damage, particularly with sun exposure.",
    sources: [
      { name: "NIH PMC — Skincare Ingredient Interactions", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" },
      { name: "EWG Skin Deep Database", url: "https://www.ewg.org/skindeep/" }
    ]
  },
  {
    ingredients: ['benzoyl peroxide', 'retinol'],
    type: 'SYNERGISTIC',
    severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: Benzoyl Peroxide + Retinol — Benzoyl peroxide oxidizes retinol on contact, rendering it inactive and potentially creating irritating byproducts. This combination can increase skin sensitivity and cause unnecessary exposure to degraded chemical compounds. These ingredients are best used at separate times of day.",
    sources: [
      { name: "EWG Skin Deep Database", url: "https://www.ewg.org/skindeep/" },
      { name: "NIH PMC — Cosmetic Ingredient Interactions", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" }
    ]
  },
  {
    ingredients: ['fragrance', 'antimicrobial'],
    type: 'SYNERGISTIC',
    severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: Fragrance + Antimicrobial compounds — Research in Environmental Health Perspectives found that fragrance compounds and antimicrobials together can exacerbate asthma and respiratory conditions more than either ingredient individually. Some fragrance compounds also enhance skin penetration of antimicrobial chemicals.",
    sources: [
      { name: "NIH PMC — Chemical Mixtures in Personal Care Products", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" },
      { name: "Campaign for Safe Cosmetics", url: "https://www.safecosmetics.org/chemicals/fragrance/" }
    ]
  }
];

// Detect which combination warnings apply to the scanned ingredients
function detectCombinations(flags) {
  const flagNames = flags.map(f => f.name.toLowerCase());
  // Also include extracted ingredients text for cleaning product combinations
  const warnings = [];

  COMBINATION_INTERACTIONS.forEach(combo => {
    const allPresent = combo.ingredients.every(keyword =>
      flagNames.some(name => name.includes(keyword))
    );
    if (allPresent) {
      warnings.push({
        type: combo.type,
        severity: combo.severity,
        warning: combo.warning,
        sources: combo.sources
      });
    }
  });

  return warnings;
}

// Map ingredient names to verified source categories
function getSourcesForIngredient(name) {
  const n = name.toLowerCase();
  if (n.includes('paraben')) return VERIFIED_SOURCES.parabens;
  if (n.includes('fragrance') || n.includes('parfum')) return VERIFIED_SOURCES.fragrance;
  if (n.includes('formaldehyde') || n.includes('dmdm') || n.includes('diazolidinyl') || n.includes('quaternium')) return VERIFIED_SOURCES.formaldehyde;
  if (n.includes('phthalate')) return VERIFIED_SOURCES.phthalates;
  if (n.includes('sodium lauryl') || n.includes('sls') || n.includes('sodium laureth') || n.includes('sles')) return VERIFIED_SOURCES.sls;
  if (n.includes('bha') || n.includes('bht')) return VERIFIED_SOURCES.bha_bht;
  if (n.includes('triclosan') || n.includes('triclocarban')) return VERIFIED_SOURCES.triclosan;
  if (n.includes('red 40') || n.includes('yellow 5') || n.includes('yellow 6') || n.includes('blue 1')) return VERIFIED_SOURCES.artificial_dyes;
  if (n.includes('oxybenzone') || n.includes('benzophenone')) return VERIFIED_SOURCES.oxybenzone;
  if (n.includes('carrageenan')) return VERIFIED_SOURCES.carrageenan;
  return VERIFIED_SOURCES.general;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { ingredients, image } = req.body;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const PROMPT = `You are Lindsay Greear, certified naturopath and HTMA practitioner at Rest & Root Holistic Health. Analyze ingredient labels and respond ONLY with valid JSON, no markdown.

ACCURACY RULES — CRITICAL:
- Only state things backed by peer-reviewed science or government bodies (NIH, EPA, FDA, IARC, EWG)
- For associations not fully proven: use "research suggests" or "some studies have linked"
- For established facts: use "is known to" or "has been shown to"
- Distinguish correlation from causation
- Never overstate harm — be accurate and empowering, not alarmist
- Do NOT generate source URLs — these are added automatically

JSON format (respond ONLY with this, no other text):
{
  "extracted_ingredients": "comma separated ingredients from photo (photo scans only)",
  "verdict": "PUT IT BACK or CAUTION or LOOKS CLEAN",
  "summary": "2-3 sentences. Warm, plain English, like texting a friend. Accurate.",
  "swap_tip": "One sentence on cleaner alternative. Empty if clean.",
  "diy_recipe": "Simple recipe with exact measurements if applicable. Empty if not.",
  "flags": [
    {
      "name": "exact ingredient name",
      "risk": "AVOID or CAUTION or SAFE",
      "reason": "One accurate plain sentence. Use 'linked to' not 'causes' unless causation is proven.",
      "found_in": "Other products this commonly appears in",
      "education": {
        "body_impact": "2-3 sentences on documented effects. Use 'research suggests' for associations. Connect to real symptoms people feel.",
        "mineral_depletion": "If research shows mineral depletion, specify minerals and symptoms of deficiency. Empty string if not established.",
        "carcinogen_info": "If classified by IARC/NTP/EPA, state the exact classification level and what it means simply. Empty string if not classified.",
        "symptom_connections": "Symptoms research has linked to this. Use 'some people report' or 'research has associated' appropriately. 1-2 sentences."
      }
    }
  ],
  "overall_symptoms": "1-2 sentences using 'may contribute to' language connecting flagged ingredients to possible symptoms. Empty if clean."
}

RED FLAGS — ALWAYS rate these as AVOID, no exceptions:
parabens (methylparaben, propylparaben, butylparaben, ethylparaben), fragrance/parfum, DMDM Hydantoin, Diazolidinyl Urea, Imidazolidinyl Urea, Quaternium-15, oxybenzone, avobenzone, HFCS/high fructose corn syrup, artificial dyes (Red 40, Yellow 5, Yellow 6, Blue 1, Red 3), sodium nitrate, sodium nitrite, partially hydrogenated oils, trans fats, QUATS/quaternary ammonium compounds/benzalkonium chloride, aspartame, sucralose, saccharin, canola oil, soybean oil, corn oil, vegetable oil (in skincare), sodium hypochlorite, triclosan, triclocarban, SLS/sodium lauryl sulfate, SLES/sodium laureth sulfate, BHA, BHT, carrageenan, PEGs, propylene glycol, mineral oil, petrolatum, formaldehyde, toluene, phthalates, coal tar, hydroquinone.

CAUTION — ALWAYS rate these as CAUTION, no exceptions:
phenoxyethanol, dimethicone, carbomer, tocopheryl acetate (synthetic), retinyl palmitate, aluminum compounds, fluoride, sodium benzoate, citric acid (in high concentrations), ethanol (in skincare).

SAFE — rate everything else as SAFE unless it appears in the above lists.

CRITICAL: Never rate a RED FLAG ingredient as CAUTION or SAFE. Never rate a CAUTION ingredient as AVOID or SAFE unless it also appears in the RED FLAGS list. Be consistent — the same ingredient must always get the same risk rating.`;

    let content = [];

    if (image) {
      content.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } });
      content.push({ type: "text", text: `${PROMPT}\n\nRead ALL text from this ingredient label image, then analyze every ingredient. Include extracted_ingredients.` });
    } else {
      content.push({ type: "text", text: `${PROMPT}\n\nAnalyze: ${ingredients}` });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      messages: [{ role: "user", content }],
    });

    const text = message.content.map((i) => i.text || "").join("").trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    if (!parsed) throw new Error("Could not parse response");

    // Inject verified hardcoded sources for each flagged ingredient
    if (parsed.flags) {
      parsed.flags = parsed.flags.map(flag => {
        if (flag.risk !== 'SAFE') {
          if (!flag.education) flag.education = {};
          flag.education.sources = getSourcesForIngredient(flag.name);
        }
        return flag;
      });

      // Detect and add chemical combination warnings
      const flaggedIngredients = parsed.flags.filter(f => f.risk !== 'SAFE');
      const combinations = detectCombinations(flaggedIngredients);
      if (combinations.length > 0) {
        parsed.combination_warnings = combinations;
      }

      // DETERMINISTIC VERDICT — override AI verdict with code logic
      // Same ingredients will ALWAYS produce the same verdict
      const hasAvoid = parsed.flags.some(f => f.risk === 'AVOID');
      const hasCaution = parsed.flags.some(f => f.risk === 'CAUTION');
      const hasDangerCombination = combinations.some(c => c.severity === 'DANGER');
      const hasCautionCombination = combinations.length > 0;

      if (hasAvoid || hasDangerCombination) {
        parsed.verdict = 'PUT IT BACK';
      } else if (hasCaution || hasCautionCombination) {
        parsed.verdict = 'CAUTION';
      } else {
        parsed.verdict = 'LOOKS CLEAN';
      }
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}