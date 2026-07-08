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
  if (n.includes('natural flavor')) return VERIFIED_SOURCES.natural_flavors;
  if (n.includes('essential oil') || n.includes('lavender oil') || n.includes('tea tree oil') || n.includes('citrus oil') || n.includes('peppermint oil') || n.includes('eucalyptus oil')) return VERIFIED_SOURCES.essential_oils;
  if (n.includes('milk') || n.includes('cream') || n.includes('whey') || n.includes('casein') || n.includes('lactose') || n.includes('butter') || n.includes('cheese') || n.includes('dairy')) return VERIFIED_SOURCES.dairy;
  if (n.includes('potassium bromate') || n.includes('azodicarbonamide') || n.includes('tbhq') || n.includes('titanium dioxide') || n.includes('propylparaben') || n.includes('bvo') || n.includes('brominated vegetable')) return VERIFIED_SOURCES.eu_banned;
  return VERIFIED_SOURCES.general;
}

async function getFastScan(client, ingredients, image, wellnessProfile) {

  // Build personalized context based on wellness profile
  // All health claims below are based on peer-reviewed research
  const profileContextMap = {
    hormone: `HORMONE HEALTH PRIORITY: Research published in Frontiers in Reproductive Health (2025) confirms that endocrine-disrupting chemicals (EDCs) in personal care products, including parabens, phthalates, and triclosan, can mimic, block, or interfere with hormone signaling even at low concentrations (PMC12289576). The NIH NIEHS confirms even low doses may be unsafe because the body's normal endocrine functioning involves very small changes in hormone levels (niehs.nih.gov/health/topics/agents/endocrine). Flag any EDC with extra priority and explain specific hormone pathway affected.`,

    thyroid: `THYROID / AUTOIMMUNE PRIORITY: Research in Toxics (2021) identified EDCs including triclosan, phthalates, and bisphenols as particularly concerning for thyroid hormone regulation (doi:10.3390/toxics9010014). A 2025 cross-sectional study in Journal of Environmental Science found human exposure to mixtures of endocrine disruptors was associated with altered serum levels of thyroid hormones (doi:10.1016/j.jes.2022.01.017). For autoimmune conditions, SLS has been shown to disrupt mucosal barriers which may exacerbate immune reactivity. Flag any ingredient with thyroid or autoimmune relevance and explain the specific mechanism.`,

    pregnancy: `PREGNANCY / FERTILITY PRIORITY: A 2025 review in Frontiers in Reproductive Health (PMC12289576) found EDCs primarily influence the hypothalamus-pituitary-gonadal axis and embryonic growth. Research in Environmental Research (2024) confirmed that phthalate exposure during key stages of in utero development may affect female reproductive development. The NIH notes pregnant women and young children are more susceptible populations. Flag any ingredient of concern during pregnancy with extra urgency and practical avoidance guidance.`,

    kids: `CHILDREN / BABIES PRIORITY: A 2024 NPR-covered study found personal care products including lotions, ointments, and hair conditioners are linked to higher levels of phthalates in young children (NIH / NPR, September 2024). Research confirms children face unique risks during key developmental windows and that phthalates may impair brain development and contribute to early puberty in girls. Always flag any potentially harmful ingredient as especially concerning for children and suggest the safest possible alternatives.`,

    gut: `GUT HEALTH PRIORITY: Carrageenan has been linked in peer-reviewed research to intestinal inflammation and disruption of gut microbiome integrity (PubMed 23538004, Cornucopia Institute). SLS may damage the gut mucosal lining with repeated exposure. Research suggests emulsifiers and certain preservatives may negatively impact gut microbiome diversity. Flag any ingredient with gut health relevance and explain the specific mechanism of concern.`,

    skin: `SENSITIVE SKIN PRIORITY: For eczema, psoriasis, rosacea, or contact dermatitis, SLS is a well-documented skin barrier disruptor (PubMed 3401788). Fragrance is the most common cause of allergic contact dermatitis (American Contact Dermatitis Society). Parabens can cause skin sensitization reactions. Phenoxyethanol may cause irritation at higher concentrations. Flag any skin sensitizer with extra urgency and note specifically which skin conditions are most affected.`,

    fragrance: `FRAGRANCE-FREE PRIORITY: This user wants to avoid all fragrance. Flag any form of fragrance (fragrance, parfum, fragrance oil, natural fragrance, essential oils) as an immediate priority concern. A 2025 Frontiers in Toxicology review confirmed synthetic fragrance compounds are associated with allergic reactions, respiratory issues, endocrine disruption, and neurological effects. Note that even "natural fragrance" can hide undisclosed compounds.`,

    pfas: `PFAS / FOREVER CHEMICALS PRIORITY: Per- and polyfluoroalkyl substances (PFAS) are highly persistent synthetic chemicals. FDA Commissioner confirmed in 2026 that FDA continues working to update recommendations on PFAS. Research in Toxics (2024) links PFAS exposure to female reproductive health impacts (doi:10.3390/toxics12090678). Flag any PTFE, fluoropolymer, polyfluoro, or perfluoro ingredient with high urgency and note their persistence in both the body and environment.`,

    environment: `ENVIRONMENTAL IMPACT PRIORITY: Flag ingredients that are persistent in the environment, bioaccumulative, or toxic to aquatic life. Note biodegradability concerns where relevant. PFAS are particularly persistent. Microplastics from polyethylene, polypropylene, or nylon in scrubs or glitter are non-biodegradable. Triclosan has been flagged for aquatic toxicity. Flag environmental concerns alongside health concerns.`,

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

RED FLAGS — ALWAYS rate as AVOID: parabens, fragrance/parfum, DMDM Hydantoin, Diazolidinyl Urea, Imidazolidinyl Urea, Quaternium-15, oxybenzone, HFCS/high fructose corn syrup, Red 40, Yellow 5, Yellow 6, Blue 1, Red 3, Blue 2, Green 3, artificial colors/artificial dyes, sodium nitrate, sodium nitrite, partially hydrogenated oils, trans fats, QUATS/benzalkonium chloride, aspartame, sucralose, saccharin, acesulfame potassium/acesulfame-k/ace-k, sodium hypochlorite, triclosan, triclocarban, SLS/sodium lauryl sulfate, SLES/sodium laureth sulfate, BHA/butylated hydroxyanisole, BHT/butylated hydroxytoluene, carrageenan, PEGs/polyethylene glycol, propylene glycol, formaldehyde releasers, phthalates, coal tar, toluene, ammonia, titanium dioxide in food/E171 (banned in EU food products since 2022 — EU cited DNA and chromosomal damage concerns; still permitted in US food), hydroquinone, mercury/thimerosal, lead acetate, potassium bromate (classified as possible human carcinogen — banned in EU, UK, Canada, and most countries; still used in US bread products), brominated vegetable oil/BVO (FDA banned in 2024 after decades of use — contains bromine which accumulates in body tissue; linked to thyroid effects), azodicarbonamide/ADA (banned in EU food as a carcinogen — used in US to whiten flour and condition bread dough), TBHQ/tertiary butylhydroquinone (banned or restricted in EU — linked to vision disturbances, immune effects, and possible carcinogenicity at high doses), propylparaben in food (banned in EU food since 2006 due to endocrine disruption concerns — may still appear in US processed foods), sodium benzoate when combined with vitamin C (forms benzene, a known carcinogen — flag as AVOID when both are present in same product), artificial sweeteners including acesulfame-K, aspartame, sucralose, saccharin, neotame, advantame (linked to gut microbiome disruption, metabolic effects, and in some studies increased cancer risk), dimethyl dicarbonate/DMDC, calcium disodium EDTA (chelating agent — may deplete essential minerals), butane/isobutane/propane as food propellants.

CAUTION — ALWAYS rate as CAUTION: phenoxyethanol, dimethicone, carbomer, tocopheryl acetate (synthetic), retinyl palmitate, aluminum compounds, fluoride, sodium benzoate (alone), natural flavors/natural flavor (broad term hiding undisclosed ingredients), artificial flavors/artificial flavor (synthetic compounds not required to be individually disclosed), citric acid (high concentrations), ethanol in skincare, mineral oil, petrolatum, talc, styrene, heavy metals in cosmetics, nanoparticles, essential oils (CAUTION with nuance — sourcing and dilution matters; properly diluted generally well tolerated; concentrated use can cause sensitization), botanical extracts in high concentration, MSG/monosodium glutamate (some people sensitive — linked to headaches, flushing, chest tightening; FDA considers generally safe but sensitivity is real), maltodextrin (highly processed, high glycemic index, may disrupt gut microbiome), modified food starch (similar glycemic concerns to maltodextrin), autolyzed yeast extract/hydrolyzed vegetable protein/HVP (hidden glutamate sources similar to MSG), disodium inosinate, disodium guanylate (synergistic with MSG — indicates hidden MSG), carnauba wax, seed oils/vegetable oils in food including sunflower oil/safflower oil/soybean oil/corn oil/cottonseed oil/rapeseed oil (CAUTION not AVOID — current peer-reviewed human research does NOT confirm inflammatory effects; these are highly refined oils with imbalanced omega-6 ratio; from naturopathic perspective minimizing highly processed oils is reasonable; flag with honest nuance), xanthan gum (can cause digestive issues in sensitive individuals), carboxymethylcellulose/cellulose gum (linked in some research to gut microbiome disruption), polysorbate 80/polysorbate 60 (emulsifiers linked in animal research to gut microbiome disruption — human research limited), silicon dioxide in high amounts, calcium propionate (preservative — some research links to behavioral effects in children), rBGH/rBST/recombinant bovine growth hormone/recombinant bovine somatotropin (synthetic dairy hormone — banned in EU, Canada, Japan, Australia; increases IGF-1 in milk which some studies link to breast, prostate and colorectal cancer risk though American Cancer Society calls evidence inconclusive; not required to be labeled in US; recommend choosing rBGH-free or organic dairy), ractopamine (growth promoter used in US pork and beef — banned in over 160 countries including EU, China, and Russia due to cardiovascular concerns; not required to be labeled in US), glyphosate residues (herbicide on US crops — IARC classified as probable human carcinogen in 2015; EPA maintains safe; ongoing scientific debate; worth noting on non-organic grain and oat products), titanium dioxide in food/E171 (banned in EU food since 2022 — DNA and chromosomal damage concerns; still permitted in US food), ethyl carbamate (naturally occurring in fermented foods — IARC Group 2A probable carcinogen at high levels).

DAIRY INGREDIENT RULE: When any dairy ingredient appears in the scan (milk, whole milk, skim milk, nonfat milk, cream, heavy cream, whey, casein, lactose, butter, cheese, yogurt, ice cream, dairy, dairy solids, milk solids, milk powder, condensed milk), check whether the product label also contains any of these terms: rBGH-free, rBST-free, no artificial hormones, hormone-free, certified organic, USDA organic.

If the product DOES contain one of those terms: rate the dairy ingredient as SAFE for the hormone concern and note it positively.

If the product does NOT contain any of those terms: rate the dairy ingredient as CAUTION with this reason: "Conventional dairy — rBGH (recombinant bovine growth hormone) is not required to be disclosed on US labels. Unless this product is labeled rBGH-free, rBST-free, or certified organic, it may contain milk from hormone-treated cows. The EU, Canada, Japan, and Australia have all banned rBGH use. Some research links elevated IGF-1 levels in rBGH milk to increased risk of breast, prostate, and colorectal cancers, though the American Cancer Society states the evidence is not conclusive. Choose rBGH-free or organic dairy when possible."

CRITICAL: Apply the dairy rule consistently every time dairy ingredients appear without a hormone-free label.

SAFE — only rate as SAFE if the ingredient is water, a basic preservative-free botanical extract in low concentration, a vitamin, a mineral, basic emulsifiers like glycerin or vegetable glycerin, aloe, citric acid in low concentration, sunflower lecithin, ascorbic acid/vitamin C, tocopherols (natural vitamin E), rosemary extract (natural preservative), or another ingredient with no documented concerns at normal use levels. If you are not certain, default to CAUTION rather than SAFE.

CRITICAL CONSISTENCY RULE: Same ingredient ALWAYS gets same risk rating every single scan, no exceptions. Never rate a RED FLAG as anything other than AVOID. Never rate an unlisted ingredient as SAFE — default to CAUTION when uncertain. Never put DIY recipes in the summary field.

NOTE ON SEED OILS: When flagging seed oils, always clarify this is a CAUTION not AVOID, explain that current peer-reviewed human research does not confirm the inflammatory claims, but note that from a naturopathic whole-food perspective minimizing highly refined oils is still reasonable advice. Never overstate the evidence.

NOTE ON ESSENTIAL OILS: When flagging, never sound as alarming as synthetic ingredients. Focus on sourcing, dilution, and individual sensitivity rather than blanket avoidance.

NOTE ON MSG: Use "some people are sensitive to" language rather than "causes" — FDA considers it generally safe but sensitivity reactions are real and documented.`;

  let content = [];
  if (image) {
    content.push({ type: "image", source: { type: "base64", media_type: image.mediaType, data: image.data } });
    content.push({ type: "text", text: `${FAST_PROMPT}${profileContext}\n\nRead ALL text from this ingredient label image, then analyze every ingredient. Include extracted_ingredients.` });
  } else {
    content.push({ type: "text", text: `${FAST_PROMPT}${profileContext}\n\nAnalyze: ${ingredients}` });
  }

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [{ role: "user", content }],
  });

  const text = message.content.map(i => i.text || "").join("").trim();

  // Robust JSON parsing with multiple fallback strategies
  try {
    // Strategy 1 — extract JSON block and parse
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch(e) {
        // Strategy 2 — truncated JSON, try to repair by finding last complete flag
        const raw = jsonMatch[0];
        // Find the last complete flag object
        const lastCompleteFlag = raw.lastIndexOf('"}');
        if (lastCompleteFlag > 0) {
          const repaired = raw.substring(0, lastCompleteFlag + 2) + ']}';
          try {
            return JSON.parse(repaired);
          } catch(e2) {}
        }
        // Strategy 3 — extract just what we can
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

  // Final fallback
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
- For essential oils specifically: include practical sourcing guidance (look for third-party tested, properly labeled with botanical name, GC/MS tested if possible, sold by a reputable supplier, and used diluted with a carrier oil rather than applied undiluted). Make clear this is about informed choice, not avoidance — a quality essential oil used properly is very different from a poor quality or undiluted one.

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

    // Education only request (Call 2)
    if (education_only && flags_for_education) {
      const eduData = await getEducation(client, flags_for_education);
      return res.status(200).json(eduData);
    }

    // Fast scan (Call 1)
    const parsed = await getFastScan(client, ingredients, image, wellness_profile || []);
    if (!parsed || !parsed.summary) throw new Error("Could not analyze ingredients — please try again");

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