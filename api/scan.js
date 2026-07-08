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
  natural_flavors: [
    { name: "FDA — Natural Flavors Definition", url: "https://www.fda.gov/food/food-additives-petitions/food-additive-status-list" },
    { name: "EWG — Natural Flavors", url: "https://www.ewg.org/foodscores/content/natural-vs-artificial-flavors" },
    { name: "NIH — Food Additive Safety", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3649458/" }
  ],
  essential_oils: [
    { name: "NIH PubMed — Essential Oil Skin Sensitization", url: "https://pubmed.ncbi.nlm.nih.gov/30864277/" },
    { name: "EWG Skin Deep — Fragrance Oils", url: "https://www.ewg.org/skindeep/" },
    { name: "American Contact Dermatitis Society", url: "https://www.contactderm.org/" }
  ],
  general: [
    { name: "NIH — Personal Care Product Safety Research", url: "https://newsinhealth.nih.gov/2022/08/probing-personal-care-products" },
    { name: "EWG Skin Deep Cosmetics Database", url: "https://www.ewg.org/skindeep/" },
    { name: "Campaign for Safe Cosmetics", url: "https://www.safecosmetics.org/" },
    { name: "NIH PMC — Cosmetic Toxicology Review", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11381309/" },
    { name: "EU Food Additives Database — EFSA", url: "https://food.ec.europa.eu/food-safety/food-improvement-agents/additives/database_en" }
  ],
  dairy: [
    { name: "Center for Food Safety — rBGH", url: "https://www.centerforfoodsafety.org/issues/1044/rbgh/about-rbgh" },
    { name: "American Cancer Society — rBGH", url: "https://www.cancer.org/cancer/risk-prevention/chemicals/recombinant-bovine-growth-hormone.html" },
    { name: "Breast Cancer Prevention Partners — rBST", url: "https://www.bcpp.org/resource/rbgh-rbst/" },
    { name: "EU Ban on rBGH — European Commission 1999", url: "https://ec.europa.eu/commission/presscorner/detail/en/ip_99_798" }
  ],
  eu_banned: [
    { name: "EU Food Additives Database", url: "https://food.ec.europa.eu/food-safety/food-improvement-agents/additives/database_en" },
    { name: "EFSA — Food Additives", url: "https://www.efsa.europa.eu/en/topics/topic/food-additives" },
    { name: "EWG — Food Scores Database", url: "https://www.ewg.org/foodscores/" }
  ],
  msg: [
    { name: "NIH — Monosodium Glutamate", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5938543/" },
    { name: "PubMed — MSG and Neurological Effects", url: "https://pubmed.ncbi.nlm.nih.gov/19438927/" },
    { name: "EWG Food Scores — MSG", url: "https://www.ewg.org/foodscores/" }
  ],
  glutamate_enhancers: [
    { name: "NIH — Disodium Inosinate and Guanylate", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5938543/" },
    { name: "EWG Food Scores Database", url: "https://www.ewg.org/foodscores/" }
  ],
  synthetic_preservatives: [
    { name: "EWG Skin Deep — Phenoxyethanol", url: "https://www.ewg.org/skindeep/ingredients/704811-PHENOXYETHANOL/" },
    { name: "Campaign for Safe Cosmetics — Preservatives", url: "https://www.safecosmetics.org/" },
    { name: "NIH PMC — Cosmetic Preservative Safety", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11381309/" }
  ],
  phosphates: [
    { name: "PubMed — Dietary Phosphate and Kidney Health", url: "https://pubmed.ncbi.nlm.nih.gov/22626904/" },
    { name: "NIH — Phosphate Additives in Food", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3278747/" },
    { name: "EWG Food Scores Database", url: "https://www.ewg.org/foodscores/" }
  ],
  synthetic_vitamins: [
    { name: "NIH — Synthetic vs Natural Vitamins", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3649458/" },
    { name: "EWG Food Scores Database", url: "https://www.ewg.org/foodscores/" }
  ],
  non_organic: [
    { name: "EWG — Dirty Dozen List", url: "https://www.ewg.org/foodnews/dirty-dozen.php" },
    { name: "NIH — Pesticide Residues in Food", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7400278/" },
    { name: "USDA Pesticide Data Program", url: "https://www.ams.usda.gov/datasets/pdp" }
  ],
  salt: [
    { name: "NIH — Processed Salt vs Natural Salt", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3951800/" },
    { name: "EWG Food Scores Database", url: "https://www.ewg.org/foodscores/" }
  ],
  sugar: [
    { name: "NIH — Added Sugar Health Effects", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5174139/" },
    { name: "EWG Food Scores — Sugar", url: "https://www.ewg.org/foodscores/" },
    { name: "Harvard School of Public Health — Sugar", url: "https://www.hsph.harvard.edu/nutritionsource/carbohydrates/added-sugar-in-the-diet/" }
  ],
  enriched_flour: [
    { name: "NIH — Refined Grains and Health", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3078018/" },
    { name: "Harvard School of Public Health — Whole Grains", url: "https://www.hsph.harvard.edu/nutritionsource/what-should-you-eat/whole-grains/" },
    { name: "EWG Food Scores Database", url: "https://www.ewg.org/foodscores/" }
  ],
  greenwashing: [
    { name: "Campaign for Safe Cosmetics — Greenwashing", url: "https://www.safecosmetics.org/" },
    { name: "EWG — Misleading Label Claims", url: "https://www.ewg.org/skindeep/" },
    { name: "FTC — Green Guides", url: "https://www.ftc.gov/news-events/topics/truth-advertising/green-guides" }
  ],
  citric_acid: [
    { name: "NIH — Citric Acid Production", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7400278/" },
    { name: "EWG Food Scores Database", url: "https://www.ewg.org/foodscores/" }
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
  },
  {
    ingredients: ['monosodium glutamate', 'disodium inosinate'],
    type: 'SYNERGISTIC', severity: 'DANGER',
    warning: "🚨 SYNERGISTIC CONCERN: MSG + Disodium Inosinate — Disodium inosinate is specifically used to amplify the effects of MSG. Together they produce significantly stronger excitotoxic effects than MSG alone. This combination is a strong signal that the product is engineered to override your natural satiety signals.",
    sources: [
      { name: "NIH — Monosodium Glutamate", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5938543/" },
      { name: "EWG Food Scores Database", url: "https://www.ewg.org/foodscores/" }
    ]
  },
  {
    ingredients: ['monosodium glutamate', 'disodium guanylate'],
    type: 'SYNERGISTIC', severity: 'DANGER',
    warning: "🚨 SYNERGISTIC CONCERN: MSG + Disodium Guanylate — Disodium guanylate is specifically used to amplify the effects of MSG. Together they produce significantly stronger excitotoxic effects than MSG alone.",
    sources: [
      { name: "NIH — Monosodium Glutamate", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5938543/" },
      { name: "EWG Food Scores Database", url: "https://www.ewg.org/foodscores/" }
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
  if (n.includes('greenwash') || n.includes('unscented') || n.includes('misleading')) return VERIFIED_SOURCES.greenwashing;
  if (n.includes('formaldehyde') || n.includes('dmdm') || n.includes('diazolidinyl') || n.includes('quaternium')) return VERIFIED_SOURCES.formaldehyde;
  if (n.includes('phthalate')) return VERIFIED_SOURCES.phthalates;
  if (n.includes('sodium lauryl') || n.includes('sls') || n.includes('sodium laureth') || n.includes('sles')) return VERIFIED_SOURCES.sls;
  if (n.includes('bha') || n.includes('bht')) return VERIFIED_SOURCES.bha_bht;
  if (n.includes('triclosan') || n.includes('triclocarban')) return VERIFIED_SOURCES.triclosan;
  if (n.includes('red 40') || n.includes('yellow 5') || n.includes('yellow 6') || n.includes('blue 1') || n.includes('artificial color') || n.includes('artificial dye')) return VERIFIED_SOURCES.artificial_dyes;
  if (n.includes('oxybenzone') || n.includes('benzophenone')) return VERIFIED_SOURCES.oxybenzone;
  if (n.includes('carrageenan')) return VERIFIED_SOURCES.carrageenan;
  if (n.includes('natural flavor') || n.includes('artificial flavor')) return VERIFIED_SOURCES.natural_flavors;
  if (n.includes('essential oil') || n.includes('lavender oil') || n.includes('tea tree oil') || n.includes('citrus oil') || n.includes('peppermint oil') || n.includes('eucalyptus oil')) return VERIFIED_SOURCES.essential_oils;
  if (n.includes('milk') || n.includes('cream') || n.includes('whey') || n.includes('casein') || n.includes('lactose') || n.includes('butter') || n.includes('cheese') || n.includes('dairy') || n.includes('buttermilk')) return VERIFIED_SOURCES.dairy;
  if (n.includes('potassium bromate') || n.includes('azodicarbonamide') || n.includes('tbhq') || n.includes('titanium dioxide') || n.includes('propylparaben') || n.includes('bvo') || n.includes('brominated vegetable')) return VERIFIED_SOURCES.eu_banned;
  if (n.includes('monosodium glutamate') || n.includes('msg')) return VERIFIED_SOURCES.msg;
  if (n.includes('disodium inosinate') || n.includes('disodium guanylate')) return VERIFIED_SOURCES.glutamate_enhancers;
  if (n.includes('phenoxyethanol') || n.includes('ethylhexylglycerin') || n.includes('sodium benzoate') || n.includes('potassium sorbate')) return VERIFIED_SOURCES.synthetic_preservatives;
  if (n.includes('phosphate') || n.includes('triphosphate')) return VERIFIED_SOURCES.phosphates;
  if (n.includes('niacin') || n.includes('thiamin') || n.includes('riboflavin') || n.includes('folic acid') || n.includes('ferrous sulfate') || n.includes('vitamin b') || n.includes('synthetic vitamin') || n.includes('synthetic mineral')) return VERIFIED_SOURCES.synthetic_vitamins;
  if (n.includes('non-organic') || n.includes('conventional') || n.includes('pesticide')) return VERIFIED_SOURCES.non_organic;
  if (n.includes('citric acid')) return VERIFIED_SOURCES.citric_acid;
  if (n.includes('salt') && !n.includes('himalayan') && !n.includes('celtic') && !n.includes('sea salt')) return VERIFIED_SOURCES.salt;
  if (n.includes('sugar') || n.includes('cane sugar') || n.includes('beet sugar')) return VERIFIED_SOURCES.sugar;
  if (n.includes('enriched') || n.includes('bleached flour') || n.includes('refined flour')) return VERIFIED_SOURCES.enriched_flour;
  return VERIFIED_SOURCES.general;
}

async function getFastScan(client, ingredients, image, wellnessProfile) {

  const profileContextMap = {
    hormone: `HORMONE HEALTH PRIORITY: Research published in Frontiers in Reproductive Health (2025) confirms that endocrine-disrupting chemicals (EDCs) in personal care products, including parabens, phthalates, and triclosan, can mimic, block, or interfere with hormone signaling even at low concentrations. The NIH NIEHS confirms even low doses may be unsafe. Flag any EDC with extra priority and explain specific hormone pathway affected.`,
    thyroid: `THYROID / AUTOIMMUNE PRIORITY: Research in Toxics (2021) identified EDCs including triclosan, phthalates, and bisphenols as particularly concerning for thyroid hormone regulation. For autoimmune conditions, SLS has been shown to disrupt mucosal barriers which may exacerbate immune reactivity. Flag any ingredient with thyroid or autoimmune relevance and explain the specific mechanism.`,
    pregnancy: `PREGNANCY / FERTILITY PRIORITY: A 2025 review in Frontiers in Reproductive Health found EDCs primarily influence the hypothalamus-pituitary-gonadal axis and embryonic growth. The NIH notes pregnant women and young children are more susceptible populations. Flag any ingredient of concern during pregnancy with extra urgency and practical avoidance guidance.`,
    kids: `CHILDREN / BABIES PRIORITY: Research confirms children face unique risks during key developmental windows and that phthalates may impair brain development and contribute to early puberty in girls. Always flag any potentially harmful ingredient as especially concerning for children and suggest the safest possible alternatives.`,
    gut: `GUT HEALTH PRIORITY: Carrageenan has been linked in peer-reviewed research to intestinal inflammation and disruption of gut microbiome integrity. SLS may damage the gut mucosal lining with repeated exposure. Flag any ingredient with gut health relevance and explain the specific mechanism of concern.`,
    skin: `SENSITIVE SKIN PRIORITY: For eczema, psoriasis, rosacea, or contact dermatitis, SLS is a well-documented skin barrier disruptor. Fragrance is the most common cause of allergic contact dermatitis. Flag any skin sensitizer with extra urgency and note specifically which skin conditions are most affected.`,
    fragrance: `FRAGRANCE-FREE PRIORITY: This user wants to avoid all fragrance. Flag any form of fragrance (fragrance, parfum, fragrance oil, natural fragrance, essential oils) as an immediate priority concern. Note that even products labeled unscented or fragrance-free may still contain masking fragrances — always check the full ingredient list.`,
    pfas: `PFAS / FOREVER CHEMICALS PRIORITY: Flag any PTFE, fluoropolymer, polyfluoro, or perfluoro ingredient with high urgency and note their persistence in both the body and environment.`,
    environment: `ENVIRONMENTAL IMPACT PRIORITY: Flag ingredients that are persistent in the environment, bioaccumulative, or toxic to aquatic life. Note biodegradability concerns where relevant. Flag environmental concerns alongside health concerns.`,
    general: `GENERAL CLEAN LIVING: This user is just getting started. Use encouraging, non-overwhelming language. Explain why each flagged ingredient matters in simple terms. Focus on the most impactful swaps first rather than overwhelming with everything at once. Frame this as a journey, not perfection.`
  };

  let profileContext = '';
  if (wellnessProfile && wellnessProfile.length > 0) {
    const contextParts = wellnessProfile
      .filter(key => profileContextMap[key])
      .map(key => profileContextMap[key]);
    if (contextParts.length > 0) {
      profileContext = `\n\nUSER WELLNESS PROFILE — PERSONALIZE YOUR RESPONSE:\nThis user has indicated the following health priorities. Tailor your summary, flag reasons, and swap suggestions to be specifically relevant to their situation:\n\n${contextParts.join('\n\n')}`;
    }
  }

  const FAST_PROMPT = `You are Lindsay Greear, certified naturopath and HTMA practitioner at Rest & Root Holistic Health. Analyze ingredient labels and respond ONLY with valid JSON, no markdown, no preamble.

JSON format:
{
  "extracted_ingredients": "comma separated ingredients from photo (photo scans only, else empty string)",
  "summary": "2-3 warm plain English sentences about the product overall. Do NOT include swap suggestions or DIY recipes in the summary — those go in swap_tip and diy_recipe fields only.",
  "swap_tip": "One sentence recommending a specific clean product to swap to. No DIY here — just a product recommendation. Empty string if product is clean.",
  "diy_recipe": "ONLY if a simple DIY version exists AND it is meaningfully better than buying clean. Exact recipe with measurements. Empty string if no good DIY exists OR if you already gave a product swap. Never duplicate what is in swap_tip.",
  "flags": [
    {
      "name": "exact ingredient name",
      "risk": "AVOID or CAUTION or SAFE",
      "reason": "One accurate plain sentence. Use linked to not causes unless proven.",
      "found_in": "Other products this hides in"
    }
  ]
}

CRITICAL PARSING RULES — READ THESE FIRST BEFORE ANALYZING ANYTHING:
1. When you see "Artificial Color (Including X, Y, and Z)" or any bundled phrasing, you MUST extract and flag EACH color individually as its own flag entry. Never treat a bundle as one ingredient.
2. When you see "Natural and Artificial Flavor" or "Natural and Artificial Flavors" flag it as AVOID — this phrasing means synthetic compounds are confirmed present.
3. When you see "Vegetable Oil (Sunflower, Canola, and/or Corn Oil)" or any similar bundled oil listing, flag each oil individually.
4. When ingredients appear inside parentheses as sub-ingredients at ANY level of nesting — for example "Cheese Sauce Mix (Whey, Milk Fat, Salt, Milk Protein Concentrate, Sodium Triphosphate...)" or "Enriched Macaroni (Wheat Flour, Durum Flour, Niacin, Ferrous Sulfate...)" — you MUST analyze and flag every single sub-ingredient individually. Do not skip or group them.
5. Never skip an ingredient because it is grouped with others. Parse every single item at every level of nesting.
6. Never rate an ingredient SAFE if you are not completely certain it has no documented concerns. Default to CAUTION when uncertain.
7. Same ingredient ALWAYS gets the same risk rating every single scan, no exceptions.
8. GREENWASHING ALERT: If a product is labeled "unscented", "fragrance-free", "natural", "clean", "gentle", "pure", "non-toxic", "green", "eco", or "hypoallergenic" but the ingredient list contains fragrance, parfum, synthetic preservatives, or other flagged ingredients, you MUST call this out explicitly as greenwashing in the flag reason. Use direct language: "This product claims to be [X] but contains [Y] — this is misleading marketing."
9. ORGANIC RULE: If a food, spice, herb, grain, fruit, vegetable, or crop-based ingredient does not have the word organic in its name and the product is not labeled USDA Organic, flag it as CAUTION for potential pesticide residue. Apply this to every food scan without exception.
10. SYNTHETIC RULE: Any ingredient that is synthetic, artificial, or heavily processed and serves no nutritional purpose must be flagged. When in doubt about whether something is synthetic, flag it as CAUTION.
11. MOST IMPORTANT RULE: The flags array MUST contain an individual entry for every single concerning ingredient. If your summary describes a product as synthetic, ultra-processed, industrial, or concerning in any way, there MUST be corresponding AVOID or CAUTION flags for each ingredient that makes it so. A product with a negative summary and an empty or all-SAFE flags array is a critical failure. Never let this happen.

RED FLAGS — ALWAYS rate as AVOID, no exceptions:
parabens (methylparaben, propylparaben, butylparaben, ethylparaben),
fragrance/parfum/fragrance oil/natural fragrance,
DMDM Hydantoin,
Diazolidinyl Urea,
Imidazolidinyl Urea,
Quaternium-15,
oxybenzone,
benzophenone,
HFCS/high fructose corn syrup,
Red 40/Red 40 Lake,
Yellow 5/Yellow 5 Lake,
Yellow 6/Yellow 6 Lake,
Blue 1/Blue 1 Lake,
Red 3,
Blue 2,
Green 3,
artificial colors/artificial dyes/artificial color — when this phrase appears flag it as AVOID and list every named dye inside it as a separate AVOID flag,
natural and artificial flavor/natural and artificial flavors — AVOID because confirmed synthetic compounds are present,
artificial flavor/artificial flavors — AVOID,
sodium nitrate,
sodium nitrite,
partially hydrogenated oils,
trans fats,
QUATS/benzalkonium chloride,
aspartame,
sucralose,
saccharin,
acesulfame potassium/acesulfame-k/ace-k,
neotame,
advantame,
sodium hypochlorite,
triclosan,
triclocarban,
SLS/sodium lauryl sulfate,
SLES/sodium laureth sulfate,
BHA/butylated hydroxyanisole,
BHT/butylated hydroxytoluene,
carrageenan,
PEGs/polyethylene glycol,
propylene glycol,
formaldehyde releasers,
phthalates,
coal tar,
toluene,
ammonia,
titanium dioxide in food/E171,
hydroquinone,
mercury/thimerosal,
lead acetate,
potassium bromate,
brominated vegetable oil/BVO,
azodicarbonamide/ADA,
TBHQ/tertiary butylhydroquinone,
monosodium glutamate/MSG — AVOID. Flag as an excitotoxin linked to headaches, flushing, and neurological sensitivity. Not a natural whole ingredient,
disodium inosinate — AVOID. MSG amplifier. Hidden glutamate source. Not a whole ingredient,
disodium guanylate — AVOID. MSG amplifier. Hidden glutamate source. Not a whole ingredient,
dimethyl dicarbonate/DMDC,
calcium disodium EDTA,
butane/isobutane/propane as food propellants,
sodium benzoate when combined with vitamin C,
citric acid in any processed or packaged product — AVOID. Despite the name the citric acid in virtually all processed products is not from citrus fruit. It is industrially produced using Aspergillus niger mold fermentation. Flag as AVOID and note: "Despite its name, the citric acid in this product is almost certainly not from citrus — it is industrially produced via Aspergillus niger mold fermentation. Many people with mold sensitivities react to it.",
sodium triphosphate/sodium tripolyphosphate/STPP — AVOID. Synthetic phosphate additive with no nutritional value. Research links high synthetic phosphate intake to kidney stress and cardiovascular strain. A marker of ultra-processed food,
disodium phosphate/trisodium phosphate/sodium phosphate — AVOID. Synthetic phosphate additive. Same concerns as sodium triphosphate,
calcium phosphate in processed food — AVOID. Synthetic form used as an anti-caking agent and stabilizer in ultra-processed foods.

CAUTION — ALWAYS rate as CAUTION:
phenoxyethanol — CAUTION in beauty products. Synthetic preservative. Strongly suggest switching to a product preserved with natural alternatives like rosemary extract, vitamin E, or neem oil,
ethylhexylglycerin — CAUTION. Synthetic preservative. Suggest natural alternatives,
sodium benzoate alone without vitamin C — CAUTION. Synthetic preservative. Suggest natural alternatives,
potassium sorbate — CAUTION. Synthetic preservative. Considered one of the safer synthetic options but still not a whole ingredient. Suggest natural alternatives,
dimethicone — CAUTION. Synthetic silicone,
carbomer — CAUTION. Synthetic polymer,
tocopheryl acetate synthetic vitamin E — CAUTION. Synthetic form. Natural tocopherols from whole food sources are preferred,
retinyl palmitate — CAUTION. Synthetic form of vitamin A,
aluminum compounds — CAUTION,
fluoride — CAUTION,
mineral oil — CAUTION. Petroleum derivative,
petrolatum — CAUTION. Petroleum derivative,
talc — CAUTION,
nanoparticles — CAUTION,
essential oils — CAUTION. Quality matters significantly. Look for brands that are third-party tested and display a GC/MS (gas chromatography/mass spectrometry) test result, clearly label the full botanical name of the plant, are sold by a reputable supplier, and are used properly diluted with a carrier oil. A properly sourced and diluted essential oil is very different from a low-quality or undiluted one. This is about informed choice not avoidance,
maltodextrin — CAUTION. Highly processed, high glycemic index, may disrupt gut microbiome. Not a whole ingredient,
modified food starch — CAUTION. Heavily processed. Not a whole ingredient,
autolyzed yeast extract/hydrolyzed vegetable protein/HVP — CAUTION. Hidden glutamate sources,
carnauba wax — CAUTION. Processed wax coating,
seed oils in food including sunflower oil/safflower oil/soybean oil/corn oil/cottonseed oil/rapeseed oil/canola oil — CAUTION not AVOID. Highly refined oils. Current peer-reviewed human research does NOT confirm inflammatory effects as established fact. From a naturopathic whole-food perspective minimizing highly refined oils is reasonable. Always note that cold-pressed organic versions are significantly better if oil is needed,
xanthan gum — CAUTION. Synthetic fermentation product. Can cause digestive issues in sensitive individuals,
carboxymethylcellulose/cellulose gum — CAUTION. Synthetic emulsifier,
polysorbate 80/polysorbate 60 — CAUTION. Synthetic emulsifier,
silicon dioxide in high amounts — CAUTION,
calcium propionate — CAUTION. Synthetic preservative,
dextrose — CAUTION. Highly refined simple sugar, high glycemic index, spikes blood sugar rapidly. Not a whole ingredient,
lactic acid — CAUTION unless explicitly labeled as naturally fermented. In unlabeled processed products lactic acid is typically synthetic. Note: "If this product labels its lactic acid as naturally fermented it is generally fine. If unlabeled as in most processed foods it is likely synthetic.",
annatto — CAUTION. Natural color but some research links it to inflammatory responses in sensitive individuals,
tapioca flour/tapioca starch — CAUTION in processed products. Filler with minimal nutritional value,
milk protein concentrate/MPC — CAUTION. Heavily processed dairy derivative. Often imported with minimal quality oversight. A marker of ultra-processed food,
enriched flour/enriched wheat flour/enriched macaroni/enriched pasta/enriched grain — CAUTION. Flag clearly: "The word enriched means the natural nutrients were stripped out during processing and inferior synthetic versions were added back in. This is not a whole food. Choose 100% whole grain or organic whole grain instead.",
bleached flour/white flour/refined flour — CAUTION. Same concerns as enriched flour,
synthetic vitamins and minerals added to food including niacin/thiamin mononitrate/riboflavin/folic acid/ferrous sulfate/pyridoxine hydrochloride/cyanocobalamin/zinc oxide/cupric sulfate and similar — CAUTION. Flag clearly: "These are synthetic versions of vitamins and minerals added back after processing stripped out the natural ones. While technically better than no nutrition at all, synthetic isolated nutrients do not behave the same way in the body as nutrients from whole foods. Their presence is a clear sign this is an ultra-processed product. Always choose whole food sources instead.",
salt plain unspecified — CAUTION. Standard table salt is heavily processed, stripped of trace minerals, and often contains synthetic anti-caking agents. Note: "Choose Celtic sea salt as the gold standard — it retains the full spectrum of trace minerals. Pink Himalayan salt is also a good option. Avoid standard table salt.",
sugar/cane sugar/beet sugar non-organic unlabeled — CAUTION. Conventional sugar is likely from GMO sugar beets treated with glyphosate. Note: "Better options include raw organic coconut sugar, raw organic honey, pure maple syrup, or medjool dates as a whole food sweetener.",
spices non-organic unlabeled — CAUTION. Non-organic spices and herbs may carry pesticide residue and are often irradiated. Note: "Choose certified organic spices whenever possible.",
herbs non-organic unlabeled — CAUTION. Same concerns as non-organic spices,
garlic powder non-organic — CAUTION. Potential pesticide residue. Choose organic,
onion powder non-organic — CAUTION. Potential pesticide residue. Choose organic,
tomato powder non-organic — CAUTION. Potential pesticide residue. Choose organic,
bell pepper powder non-organic — CAUTION. Potential pesticide residue. Choose organic,
corn/corn flour/corn starch non-organic — CAUTION. Conventional corn is almost certainly GMO and treated with glyphosate. Always choose organic,
wheat flour/durum flour non-organic — CAUTION. Conventional wheat is frequently sprayed with glyphosate as a pre-harvest desiccant. Choose organic whole grain,
vegetable powder non-organic — CAUTION. Potential pesticide residue,
rBGH/rBST/recombinant bovine growth hormone — CAUTION,
ractopamine — CAUTION,
glyphosate residues — CAUTION,
ethyl carbamate — CAUTION.

DAIRY INGREDIENT RULE:
When any dairy ingredient appears (milk, whole milk, skim milk, nonfat milk, cream, heavy cream, whey, whey protein concentrate, casein, lactose, butter, buttermilk, cheese, yogurt, dairy, dairy solids, milk solids, milk powder, condensed milk, romano cheese, cheddar cheese, milk fat, milk protein concentrate), check whether the product label also contains any of these terms: rBGH-free, rBST-free, no artificial hormones, hormone-free, certified organic, USDA organic.
If the product DOES contain one of those terms: rate the dairy ingredient as SAFE for the hormone concern and note it positively.
If the product does NOT contain any of those terms: rate each dairy ingredient as CAUTION with this reason: "Conventional dairy — rBGH (recombinant bovine growth hormone) is not required to be disclosed on US labels. Unless labeled rBGH-free, rBST-free, or certified organic, it may contain milk from hormone-treated cows. Choose rBGH-free or organic dairy when possible."

ORGANIC ABSENCE RULE:
When a food product contains any crop-based ingredient (grains, flours, vegetables, fruits, spices, herbs, oils, sugars, starches) that is not labeled organic and the product itself is not labeled USDA Organic, flag each such ingredient as CAUTION and note: "This ingredient is not listed as organic. Non-organic [ingredient] may carry pesticide residue. Choose organic when possible." Apply this rule consistently to every food scan.

SAFE — only rate as SAFE if the ingredient is: water, certified organic botanical extract in low concentration, natural tocopherols from a whole food source, rosemary extract as a natural preservative, organic sunflower lecithin, ascorbic acid from a natural source, organic aloe vera, organic apple cider vinegar raw, or another ingredient that is both whole and unprocessed and organic or wildcrafted with absolutely no documented concerns. Enzymes and cheese cultures in dairy products may be rated SAFE but note that organic and non-GMO sourced cultures are preferred. If you are not certain default to CAUTION.

GREENWASHING RULE:
If any product uses the words natural, clean, gentle, pure, non-toxic, green, eco, hypoallergenic, unscented, or fragrance-free anywhere on its label but contains ANY synthetic ingredient, preservative, fragrance, or flagged ingredient, call it out directly and firmly in the relevant flag reason. Example: "This product markets itself as natural but contains [ingredient] — this is greenwashing. A truly natural product would not contain synthetic [ingredient]. Do not be misled by front-of-label claims — always read the ingredient list."

NOTE ON SEED OILS: Always clarify this is CAUTION not AVOID. Note that cold-pressed organic versions are significantly better. Never overstate the evidence on inflammatory claims.

NOTE ON ESSENTIAL OILS: Flag as CAUTION. Always note that third-party tested oils with GC/MS results and clearly labeled botanical names from reputable suppliers used properly diluted are very different from low-quality or undiluted oils. This is about informed choice not avoidance.

NOTE ON SYNTHETIC VITAMINS: Always make it very clear these are synthetic, that they are a sign of ultra-processed food, and that whole food sources are always preferred. Do not frame them positively — they are CAUTION because they are marginally better than zero nutrition but they are not good.

NOTE ON DEXTROSE AND SUGARS: Flag dextrose and added sugars as CAUTION. Explain blood sugar and gut microbiome impact in plain English. Always suggest whole food sweetener alternatives.

NOTE ON BUNDLED INGREDIENTS: Always parse bundled ingredient lists completely. "Artificial Color (Including Yellow 6, Yellow 5, and Red 40)" means four separate flag entries — one for Artificial Color and one each for Yellow 6, Yellow 5, and Red 40, all rated AVOID.

NOTE ON CITRIC ACID: In virtually all processed and packaged products citric acid is synthetically produced via Aspergillus niger mold fermentation not from citrus fruit. Always flag as AVOID in processed products and explain this clearly. Only rate as SAFE if the product is a whole fresh citrus item where citric acid is naturally occurring.

FINAL MANDATORY CHECK BEFORE RETURNING JSON: Look at your summary. If it contains any negative language about the product — words like synthetic, ultra-processed, industrial, processed, concerning, phosphate, enriched, conventional, non-organic, or similar — go back through your flags array and make sure every ingredient that justifies that language has its own individual flag entry rated AVOID or CAUTION. If your flags array is empty or contains only SAFE ratings but your summary is negative, you have made a critical error. Fix it before returning.`;

  let content = [];
  if (image) {
    content.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } });
    content.push({ type: "text", text: `${FAST_PROMPT}${profileContext}\n\nRead ALL text from this ingredient label image, then analyze every ingredient including all sub-ingredients inside parentheses at every level of nesting. Include extracted_ingredients.` });
  } else {
    content.push({ type: "text", text: `${FAST_PROMPT}${profileContext}\n\nAnalyze every ingredient including all sub-ingredients inside parentheses at every level of nesting: ${ingredients}` });
  }

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{ role: "user", content }],
  });

  const text = message.content.map(i => i.text || "").join("").trim();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch(e) {
        const raw = jsonMatch[0];
        const lastCompleteFlag = raw.lastIndexOf('"}');
        if (lastCompleteFlag > 0) {
          const repaired = raw.substring(0, lastCompleteFlag + 2) + ']}';
          try {
            return JSON.parse(repaired);
          } catch(e2) {}
        }
        const summaryMatch = raw.match(/"summary"\s*:\s*"([^"]+)"/);
        const verdictMatch = raw.match(/"verdict"\s*:\s*"([^"]+)"/);
        return {
          summary: summaryMatch ? summaryMatch[1] : 'Could not fully analyze this product. Please try again.',
          verdict: verdictMatch ? verdictMatch[1] : 'CAUTION',
          flags: [],
          swap_tip: '',
          diy_recipe: ''
        };
      }
    }
  } catch(e) {
    console.error('JSON parse error:', e.message);
  }

  return {
    summary: 'The scan had trouble processing. Please try again or switch to text mode.',
    verdict: 'CAUTION',
    flags: [],
    swap_tip: '',
    diy_recipe: ''
  };
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
- For synthetic vitamins and minerals: explain clearly that synthetic isolated nutrients do not behave the same way in the body as nutrients from whole foods and that their presence is a sign of ultra-processed food
- For citric acid: explain the Aspergillus niger mold fermentation production process in plain English and note mold sensitivity concerns
- For non-organic ingredients: explain pesticide residue concerns and the difference organic certification makes
- For essential oils: include practical sourcing guidance — look for third-party tested brands that display a GC/MS test result, clearly label the full botanical name of the plant, are sold by a reputable supplier, and are used properly diluted with a carrier oil. Make clear this is about informed choice not avoidance
- For greenwashing: explain what the misleading claim is, why it is misleading, and what to look for instead
- For synthetic preservatives in beauty: explain what natural preservative alternatives exist and what to look for on labels

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
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
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
    const { ingredients, image, education_only, flags_for_education, wellness_profile } = req.body;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    if (education_only && flags_for_education) {
      const eduData = await getEducation(client, flags_for_education);
      return res.status(200).json(eduData);
    }

    const parsed = await getFastScan(client, ingredients, image, wellness_profile || []);
    if (!parsed || !parsed.summary) throw new Error("Could not analyze ingredients — please try again");

    if (parsed.flags) {
      parsed.flags = parsed.flags.map(flag => {
        if (flag.risk !== 'SAFE') {
          flag.sources = getSourcesForIngredient(flag.name);
        }
        return flag;
      });

      const flaggedIngredients = parsed.flags.filter(f => f.risk !== 'SAFE');
      const combinations = detectCombinations(flaggedIngredients);
      if (combinations.length > 0) parsed.combination_warnings = combinations;

      const hasAvoid = parsed.flags.some(f => f.risk === 'AVOID');
      const hasCaution = parsed.flags.some(f => f.risk === 'CAUTION');
      const hasDangerCombination = combinations.some(c => c.severity === 'DANGER');
      const hasCautionCombination = combinations.length > 0;

      // Safety net — if summary contains red flag language but flags came back
      // empty or all SAFE, something went wrong with the AI response.
      // Force CAUTION at minimum so we never show "you found a good one"
      // on a product the summary itself describes as problematic.
      const summaryRedFlags = parsed.summary && (
        parsed.summary.toLowerCase().includes('synthetic') ||
        parsed.summary.toLowerCase().includes('ultra-processed') ||
        parsed.summary.toLowerCase().includes('processed') ||
        parsed.summary.toLowerCase().includes('industrial') ||
        parsed.summary.toLowerCase().includes('no place') ||
        parsed.summary.toLowerCase().includes('avoid') ||
        parsed.summary.toLowerCase().includes('concern') ||
        parsed.summary.toLowerCase().includes('enriched') ||
        parsed.summary.toLowerCase().includes('conventional') ||
        parsed.summary.toLowerCase().includes('non-organic') ||
        parsed.summary.toLowerCase().includes('stripped') ||
        parsed.summary.toLowerCase().includes('additive') ||
        parsed.summary.toLowerCase().includes('chemical')
      );

      if (hasAvoid || hasDangerCombination) {
        parsed.verdict = 'PUT IT BACK';
      } else if (hasCaution || hasCautionCombination) {
        parsed.verdict = 'CAUTION';
      } else if (summaryRedFlags && flaggedIngredients.length === 0) {
        // Summary knows it is bad but flags are empty — force CAUTION
        // and add a catch-all flag so the user sees something
        parsed.verdict = 'CAUTION';
        parsed.flags.push({
          name: 'Ultra-Processed Product',
          risk: 'CAUTION',
          reason: 'This product contains multiple synthetic, processed, or industrial ingredients that have no place in a whole food diet. See summary for details.',
          found_in: 'Packaged and processed food products',
          sources: VERIFIED_SOURCES.general
        });
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