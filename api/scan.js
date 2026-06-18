import Anthropic from "@anthropic-ai/sdk";

// Verified sources hardcoded per ingredient category
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
    { name: "MDPI Endocrines — Phthalates as Endocrine Disruptors", url: "https://www.mdpi.com/2673-396X/5/3/27" }
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
    { name: "EWG — Artificial Colors", url: "https://www.ewg.org/foodscores/content/natural-vs-artificial-food-dyes" }
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

const COMBINATION_INTERACTIONS = [
  {
    ingredients: ['sodium hypochlorite', 'ammonia'],
    type: 'REACTIVE', severity: 'DANGER',
    warning: "🚨 DANGEROUS COMBINATION: Bleach (sodium hypochlorite) + Ammonia — These react to produce toxic chloramine gas. Causes eye irritation, coughing, shortness of breath, chest pain, and in high concentrations lung damage or death. Confirmed by CDC, NIH, and Washington State Department of Health.",
    sources: [
      { name: "NIH — Chlorine Gas Toxicity", url: "https://www.ncbi.nlm.nih.gov/books/NBK537213/" },
      { name: "PubMed — Mass Casualties from Chloramine Gas", url: "https://pubmed.ncbi.nlm.nih.gov/9503902/" },
      { name: "EWG — Dangers of Mixing Cleaning Products", url: "https://www.ewg.org/news-insights/news-release/tragic-accidental-death-mixture-cleaning-products-cautionary-warning" },
      { name: "Washington State DOH — Bleach Mixing Dangers", url: "https://doh.wa.gov/community-and-environment/contaminants/bleach-mixing-dangers" }
    ]
  },
  {
    ingredients: ['sodium hypochlorite', 'ammonium'],
    type: 'REACTIVE', severity: 'DANGER',
    warning: "🚨 DANGEROUS COMBINATION: Bleach + Ammonium compounds — React to produce toxic chloramine gas. Same dangerous reaction as bleach + ammonia.",
    sources: [
      { name: "NIH — Chlorine Gas Toxicity", url: "https://www.ncbi.nlm.nih.gov/books/NBK537213/" },
      { name: "Washington State DOH", url: "https://doh.wa.gov/community-and-environment/contaminants/bleach-mixing-dangers" }
    ]
  },
  {
    ingredients: ['paraben', 'fragrance'],
    type: 'SYNERGISTIC', severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: Parabens + Fragrance — Both are associated with endocrine disruption. Research in Environmental Health Perspectives found combined exposures to multiple endocrine-disrupting chemicals may produce greater hormonal effects than individual exposures alone.",
    sources: [
      { name: "NIH PMC — Chemical Mixtures in Personal Care Products", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" },
      { name: "PubMed — Paraben Endocrine Effects", url: "https://pubmed.ncbi.nlm.nih.gov/17306434/" }
    ]
  },
  {
    ingredients: ['paraben', 'phthalate'],
    type: 'SYNERGISTIC', severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: Parabens + Phthalates — Both are estrogen-mimicking chemicals. Research suggests combined exposure may produce compounded hormonal disruption.",
    sources: [
      { name: "NIH PMC — Chemical Mixtures in Personal Care Products", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" },
      { name: "CDC — Phthalates Fact Sheet", url: "https://www.cdc.gov/biomonitoring/phthalates_factsheet.html" }
    ]
  },
  {
    ingredients: ['sls', 'fragrance'],
    type: 'SYNERGISTIC', severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: SLS + Fragrance — SLS disrupts the skin barrier, which research suggests increases absorption of chemicals hiding under fragrance into the bloodstream.",
    sources: [
      { name: "PubMed — SLS Skin Barrier Disruption", url: "https://pubmed.ncbi.nlm.nih.gov/3401788/" },
      { name: "NIH PMC — Chemical Mixtures", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" }
    ]
  },
  {
    ingredients: ['sodium lauryl sulfate', 'fragrance'],
    type: 'SYNERGISTIC', severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: Sodium Lauryl Sulfate + Fragrance — SLS disrupts the skin barrier, increasing absorption of chemicals hiding under fragrance into the bloodstream.",
    sources: [
      { name: "PubMed — SLS Skin Barrier Disruption", url: "https://pubmed.ncbi.nlm.nih.gov/3401788/" },
      { name: "NIH PMC — Chemical Mixtures", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" }
    ]
  },
  {
    ingredients: ['bha', 'bht'],
    type: 'SYNERGISTIC', severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: BHA + BHT Together — Both synthetic preservatives have overlapping toxicity concerns. NIH NTP classifies BHA as reasonably anticipated to be a human carcinogen. Combined use increases cumulative exposure.",
    sources: [
      { name: "NIH NTP — BHA Report on Carcinogens", url: "https://ntp.niehs.nih.gov/ntp/roc/content/profiles/butylatedhydroxyanisole.pdf" },
      { name: "EWG — BHT", url: "https://www.ewg.org/skindeep/ingredients/700801-BHT/" }
    ]
  },
  {
    ingredients: ['triclosan', 'fragrance'],
    type: 'SYNERGISTIC', severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: Triclosan + Fragrance — Both are endocrine disruptors. Research on chemical mixtures found combined exposures can produce compounded hormonal and respiratory effects.",
    sources: [
      { name: "FDA — Triclosan Safety", url: "https://www.fda.gov/consumers/consumer-updates/5-things-know-about-triclosan" },
      { name: "NIH PMC — Chemical Mixtures", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" }
    ]
  },
  {
    ingredients: ['retinol', 'aha'],
    type: 'SYNERGISTIC', severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: Retinol + AHA/BHA — Both increase skin cell turnover and reduce barrier function. Used together, they can cause excessive irritation, peeling, and increased photosensitivity.",
    sources: [
      { name: "EWG Skin Deep Database", url: "https://www.ewg.org/skindeep/" }
    ]
  },
  {
    ingredients: ['benzoyl peroxide', 'retinol'],
    type: 'SYNERGISTIC', severity: 'CAUTION',
    warning: "⚗️ SYNERGISTIC CONCERN: Benzoyl Peroxide + Retinol — Benzoyl peroxide oxidizes retinol on contact, rendering it inactive and creating irritating byproducts. Increases skin sensitivity.",
    sources: [
      { name: "EWG Skin Deep Database", url: "https://www.ewg.org/skindeep/" }
    ]
  }
];

function detectCombinations(flags) {
  const flagNames = flags.map(f => f.name.toLowerCase());
  const warnings = [];
  COMBINATION_INTERACTIONS.forEach(combo => {
    const allPresent = combo.ingredients.every(keyword =>
      flagNames.some(name => name.includes(keyword))
    );
    if (allPresent) {
      warnings.push({ type: combo.type, severity: combo.severity, warning: combo.warning, sources: combo.sources });
    }
  });
  return warnings;
}

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

async function getFastScan(client, ingredients, image) {
  const FAST_PROMPT = `You are Lindsay Greear, certified naturopath and HTMA practitioner at Rest & Root Holistic Health. Analyze ingredient labels and respond ONLY with valid JSON, no markdown, no preamble.

JSON format:
{
  "extracted_ingredients": "comma separated ingredients from photo (photo scans only, else empty string)",
  "summary": "2-3 warm plain English sentences about the product overall. Do NOT include swap suggestions or DIY recipes in the summary — those go in swap_tip and diy_recipe fields only.",
  "swap_tip": "One sentence recommending a specific clean product to swap to. No DIY here — just a product recommendation. Empty string if product is clean.",
  "diy_recipe": "ONLY if a simple DIY version exists AND it's meaningfully better than buying clean. Exact recipe with measurements. Empty string if no good DIY exists OR if you already gave a product swap. Never duplicate what is in swap_tip.",
  "flags": [
    {
      "name": "exact ingredient name",
      "risk": "AVOID or CAUTION or SAFE",
      "reason": "One accurate plain sentence. Use linked to not causes unless proven.",
      "found_in": "Other products this hides in"
    }
  ]
}

RED FLAGS — ALWAYS rate as AVOID: parabens, fragrance/parfum, DMDM Hydantoin, Diazolidinyl Urea, Imidazolidinyl Urea, Quaternium-15, oxybenzone, HFCS, Red 40/Yellow 5/Yellow 6/Blue 1, sodium nitrate/nitrite, partially hydrogenated oils, QUATS/benzalkonium chloride, aspartame/sucralose/saccharin, canola/soybean/corn/vegetable oils in skincare, sodium hypochlorite, triclosan, SLS/SLES, BHA/BHT, carrageenan, PEGs, propylene glycol, formaldehyde releasers, phthalates, coal tar, toluene, ammonia.

CAUTION — ALWAYS rate as CAUTION: phenoxyethanol, dimethicone, carbomer, tocopheryl acetate synthetic, retinyl palmitate, aluminum compounds, fluoride, sodium benzoate.

CRITICAL: Same ingredient ALWAYS gets same risk rating. Never rate a RED FLAG as anything other than AVOID. Never put DIY recipes in the summary field.`;

  let content = [];
  if (image) {
    content.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } });
    content.push({ type: "text", text: `${FAST_PROMPT}\n\nRead ALL text from this ingredient label image, then analyze every ingredient. Include extracted_ingredients.` });
  } else {
    content.push({ type: "text", text: `${FAST_PROMPT}\n\nAnalyze: ${ingredients}` });
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{ role: "user", content }],
  });

  const text = message.content.map(i => i.text || "").join("").trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
}

async function getEducation(client, flaggedIngredients) {
  if (!flaggedIngredients || flaggedIngredients.length === 0) return {};

  const ingredientList = flaggedIngredients.map(f => f.name).join(', ');

  const EDU_PROMPT = `You are Lindsay Greear, certified naturopath and HTMA practitioner. For each ingredient listed, provide educational information. Respond ONLY with valid JSON, no markdown.

ACCURACY RULES:
- Use "research suggests" or "some studies have linked" for associations
- Use "is known to" only for established facts
- Use "some practitioners believe" for naturopathic perspectives not yet in mainstream research
- Never overstate harm

JSON format:
{
  "overall_symptoms": "1-2 sentences connecting ALL these ingredients together to symptoms the person may already feel. Use may contribute to language.",
  "education": {
    "INGREDIENT_NAME": {
      "body_impact": "2-3 sentences. What does this do in the body. Plain English. Real symptoms.",
      "mineral_depletion": "Specific minerals depleted and what low levels feel like. Empty string if not established.",
      "carcinogen_info": "If classified by IARC/NTP/EPA state exact level. Explain simply. Empty if not classified.",
      "symptom_connections": "Symptoms research has linked to this. 1-2 sentences."
    }
  }
}

Analyze these ingredients: ${ingredientList}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: [{ type: "text", text: EDU_PROMPT }] }],
  });

  const text = message.content.map(i => i.text || "").join("").trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { ingredients, image, education_only, flags_for_education } = req.body;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Education only request (Call 2)
    if (education_only && flags_for_education) {
      const eduData = await getEducation(client, flags_for_education);
      return res.status(200).json(eduData);
    }

    // Fast scan (Call 1)
    const parsed = await getFastScan(client, ingredients, image);
    if (!parsed) throw new Error("Could not parse response");

    // Inject verified sources
    if (parsed.flags) {
      parsed.flags = parsed.flags.map(flag => {
        if (flag.risk !== 'SAFE') {
          flag.sources = getSourcesForIngredient(flag.name);
        }
        return flag;
      });

      // Detect combinations
      const flaggedIngredients = parsed.flags.filter(f => f.risk !== 'SAFE');
      const combinations = detectCombinations(flaggedIngredients);
      if (combinations.length > 0) parsed.combination_warnings = combinations;

      // Deterministic verdict
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