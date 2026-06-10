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
// Sources: peer-reviewed research only
const COMBINATION_INTERACTIONS = [
  {
    ingredients: ['paraben', 'fragrance'],
    warning: "Parabens + Fragrance: Research published in PubMed has found that parabens and fragrance chemicals may have synergistic effects on estrogen receptors — meaning together they may disrupt hormones more than either ingredient alone.",
    sources: [
      { name: "PubMed — Synergistic Paraben Endocrine Effects", url: "https://pubmed.ncbi.nlm.nih.gov/17306434/" },
      { name: "MDPI — Synthetic Endocrine Disruptors in Fragranced Products", url: "https://www.mdpi.com/2673-396X/5/3/27" }
    ]
  },
  {
    ingredients: ['paraben', 'phthalate'],
    warning: "Parabens + Phthalates: Both are estrogen-mimicking chemicals. Research in Environmental Health Perspectives suggests combined exposure to multiple endocrine disruptors may produce greater hormonal disruption than individual exposures — a synergistic effect.",
    sources: [
      { name: "Environmental Health Perspectives — Combined Chemical Exposures", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" },
      { name: "NIH NIEHS — Endocrine Disruptor Research", url: "https://www.niehs.nih.gov/health/topics/agents/endocrine/index.cfm" }
    ]
  },
  {
    ingredients: ['sls', 'fragrance'],
    warning: "SLS + Fragrance: SLS disrupts the skin barrier, which research suggests may increase absorption of other chemicals — including those hiding under 'fragrance' — into the bloodstream.",
    sources: [
      { name: "PubMed — SLS Skin Barrier Disruption", url: "https://pubmed.ncbi.nlm.nih.gov/3401788/" },
      { name: "Campaign for Safe Cosmetics", url: "https://www.safecosmetics.org/chemicals/fragrance/" }
    ]
  },
  {
    ingredients: ['formaldehyde', 'paraben'],
    warning: "Formaldehyde Releasers + Parabens: Both are preservatives with distinct toxicity concerns. Research suggests using multiple preservative systems with different mechanisms of harm may compound overall toxic burden on the body.",
    sources: [
      { name: "NIH NTP — Formaldehyde Carcinogen Report", url: "https://ntp.niehs.nih.gov/ntp/roc/content/profiles/formaldehyde.pdf" },
      { name: "EWG Skin Deep Database", url: "https://www.ewg.org/skindeep/" }
    ]
  },
  {
    ingredients: ['triclosan', 'fragrance'],
    warning: "Triclosan + Fragrance: Both have been identified as endocrine disruptors. Research in Environmental Health Perspectives on combined chemical exposures from consumer products found these combinations can produce compounded effects.",
    sources: [
      { name: "FDA — Triclosan Safety", url: "https://www.fda.gov/consumers/consumer-updates/5-things-know-about-triclosan" },
      { name: "Environmental Health Perspectives — Chemical Mixtures", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4977037/" }
    ]
  },
  {
    ingredients: ['bha', 'bht'],
    warning: "BHA + BHT Together: Both are synthetic antioxidant preservatives with similar mechanisms. The NIH National Toxicology Program has flagged BHA as reasonably anticipated to be a carcinogen. Using both in the same product increases cumulative exposure.",
    sources: [
      { name: "NIH NTP — BHA Report on Carcinogens", url: "https://ntp.niehs.nih.gov/ntp/roc/content/profiles/butylatedhydroxyanisole.pdf" },
      { name: "EWG — BHT Hazard Rating", url: "https://www.ewg.org/skindeep/ingredients/700801-BHT/" }
    ]
  }
];

// Detect which combination warnings apply to the scanned ingredients
function detectCombinations(flags) {
  const flagNames = flags.map(f => f.name.toLowerCase());
  const warnings = [];

  COMBINATION_INTERACTIONS.forEach(combo => {
    const allPresent = combo.ingredients.every(keyword =>
      flagNames.some(name => name.includes(keyword))
    );
    if (allPresent) {
      warnings.push({
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

RED FLAGS (AVOID): parabens, fragrance/parfum, DMDM Hydantoin, Diazolidinyl Urea, oxybenzone, HFCS, Red 40/Yellow 5/Yellow 6/Blue 1, sodium nitrate/nitrite, partially hydrogenated oils, QUATS/benzalkonium chloride, aspartame/sucralose/saccharin, canola/soybean/corn/vegetable oils (in skincare), sodium hypochlorite, triclosan, SLS/SLES, BHA/BHT, carrageenan, PEGs, propylene glycol, formaldehyde releasers, phthalates, coal tar, toluene.

CAUTION: phenoxyethanol, dimethicone, synthetic fragrance alternatives, aluminum compounds, fluoride.`;

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
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}