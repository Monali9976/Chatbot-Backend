const extractTextFromPDF = require("./pdfLoader");
const axios = require("axios");

let rawText = null;

async function setupRAG() {
  if (!rawText) {
    rawText = await extractTextFromPDF("./data/company-profile.pdf");
  }
}

async function askFromPDF(query) {
  await setupRAG();
  const cleanedQuery = query
  .toLowerCase()
  .replace(/[^a-z0-9\s]/gi, "") // remove punctuation
  .trim();

const tokens = cleanedQuery.split(/\s+/); // split into words

const hasALPL = tokens.includes("alpl");
const hasIntent = tokens.some((word) =>
  ["full", "form", "stands", "meaning", "definition", "expansion"].includes(word)
);

// ✅ If user mentions ALPL and something related to "meaning"
if (hasALPL && hasIntent) {
  console.log("🔥 Triggered manual override for ALPL full form");
  return "ALPL stands for Ashutosh Logistics Private Limited.";
}

  const prompt = `
You are a helpful assistant for a logistics company. Answer user questions using the following content.
- Be concise and clear.
- Do NOT mention "PDF", "document", or "provided content".
- If the answer is not found, say: "I'm sorry, this information isn't mentioned."
  
Context:
====================
${rawText.slice(0, 15000)}
====================

Question: ${query}
`;

  try {
    const response = await axios.post(
      "https://api.sarvam.ai/v1/chat/completions",
      {
        model: "sarvam-m",
        messages: [
          { role: "system", content: "You answer only transport-related questions using the provided context." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SARVAM_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let reply = response.data.choices[0].message.content.trim();


// Clean robotic intros
reply = reply.replace(/^Based on.*?:\s*/i, "");
reply = reply.replace(/^The (provided )?(PDF|document|content).*?:\s*/i, "");
reply = reply.replace(/^According to.*?:\s*/i, "");

// Smart fallback conversion
if (
  /no information|not mentioned|not found|not provided|not specified|does not mention/i.test(reply)
) {
  reply = "I'm sorry, I couldn't find that information in the company details.";
}

    return reply;
  } catch (err) {
    console.error("❌ Sarvam API error:", err.message);
    return "Sorry, I couldn't process that using the document.";
  }
}

module.exports = askFromPDF;
