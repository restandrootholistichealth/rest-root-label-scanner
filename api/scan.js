import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { ingredients, image } = req.body;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let content = [];

    if (image) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: image.mediaType,
          data: image.data,
        },
      });
      content.push({
        type: "text",
        text: `You are Lindsay Greear, a certified naturopath and HTMA practitioner at Rest & Root Holistic Health. First read all the text from this ingredient label image, then analyze the ingredients.

Respond ONLY with a valid JSON object, no markdown:
{"extracted_ingredients":"comma separated list of ingredients you found in the image","verdict":"PUT IT BACK or CAUTION or LOOKS CLEAN","summary":"2-3 sentence plain English summary a busy mom can read in 30 seconds","flags":[{"name":"ingredient name","risk":"AVOID or CAUTION or SAFE","reason":"one plain sentence why","found_in":"other products it hides in"}],"swap_tip":"one sentence on what to look for instead or empty string if clean"}

Red flags: parabens, fragrance/parfum, DMDM Hydantoin, Diazolidinyl Urea, oxybenzone, HFCS, artificial dyes (Red 40 Yellow 5 Yellow 6 Blue 1), sodium nitrate/nitrite, partially hydrogenated oil, QUATS/benzalkonium chloride, aspartame/sucralose/saccharin, canola/soybean/corn/vegetable oil, sodium hypochlorite, triclosan, SLS/SLES, BHA/BHT, carrageenan, PEGs.

Write warmly like texting a friend. Never scary, always empowering.`,
      });
    } else {
      content.push({
        type: "text",
        text: `You are Lindsay Greear, a certified naturopath and HTMA practitioner at Rest & Root Holistic Health. Analyze these ingredients: ${ingredients}

Respond ONLY with a valid JSON object, no markdown:
{"verdict":"PUT IT BACK or CAUTION or LOOKS CLEAN","summary":"2-3 sentence plain English summary a busy mom can read in 30 seconds","flags":[{"name":"ingredient name","risk":"AVOID or CAUTION or SAFE","reason":"one plain sentence why","found_in":"other products it hides in"}],"swap_tip":"one sentence on what to look for instead or empty string if clean"}

Red flags: parabens, fragrance/parfum, DMDM Hydantoin, Diazolidinyl Urea, oxybenzone, HFCS, artificial dyes (Red 40 Yellow 5 Yellow 6 Blue 1), sodium nitrate/nitrite, partially hydrogenated oil, QUATS/benzalkonium chloride, aspartame/sucralose/saccharin, canola/soybean/corn/vegetable oil, sodium hypochlorite, triclosan, SLS/SLES, BHA/BHT, carrageenan, PEGs.

Write warmly like texting a friend. Never scary, always empowering.`,
      });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content }],
    });

    const text = message.content
      .map((i) => i.text || "")
      .join("")
      .trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!parsed) throw new Error("Could not parse response");

    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
