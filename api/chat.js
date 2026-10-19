// Vercel серверлік функциясы: браузерден сұрақты алып, Gemini API-ге жібереді.
// API кілті тек серверде сақталады (Vercel → Settings → Environment Variables → GEMINI_API_KEY).

const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

const RULES = `You help residents of Kazakhstan with government services: eGov.kz and the eGov Mobile app, Public Service Centers (ХҚКО / ЦОН), and related official portals.

Answer in the same language as the user's latest message (Kazakh or Russian). When writing Kazakh, use natural, correct literary Kazakh.

Format (plain text with these markers only):
- one short opening sentence;
- then sections, each starting with "### " and a heading: where to apply (online via eGov.kz / eGov Mobile, or in person at ХҚКО), required documents (a "- " list), steps (a "1. " numbered list), time and cost, a useful tip;
- use **bold** sparingly; no tables, no links in markdown syntax.
Keep it under about 250 words.

Accuracy: do not invent precise fees, deadlines, amounts or law article numbers you are not sure of; say the user should check on egov.kz or by calling 1414. Procedures change, so be honest when unsure.
Safety: never ask for IIN, passwords or SMS codes. If the user shares such data, warn them not to share it.
If the question is unrelated to government services or documents, say briefly that you help only with those topics and suggest an example question.`;

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ code: "method" });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ code: "no_key" });

  let turns = (req.body && req.body.turns) || [];
  if (!Array.isArray(turns) || !turns.length) return res.status(400).json({ code: "invalid_request" });
  turns = turns.slice(-8).filter(t => t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string");
  if (turns.some(t => t.content.length > 2000)) return res.status(400).json({ code: "prompt_too_large" });

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: RULES }] },
        contents: turns.map(t => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] })),
        generationConfig: { temperature: 0.4 }
      })
    });
    const data = await r.json();
    if (r.status === 429) return res.status(429).json({ code: "rate_limited" });
    if (!r.ok) { console.error(data); return res.status(502).json({ code: "upstream_error" }); }
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim();
    if (!text) return res.status(502).json({ code: "refused" });
    return res.status(200).json({ text });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ code: "upstream_error" });
  }
};
