const extractTextFromPDF = require("./pdfLoader");
const axios = require("axios");

let rawText = null;

async function setupRAG() {
  if (!rawText) {
    rawText = await extractTextFromPDF("./data/company-profile.pdf");
  }
}

// async function askFromPDF(query) {
//   await setupRAG();

//   const prompt = `
// You are a transport domain assistant. Based on the following PDF content, answer the question:
// ====================
// ${rawText.slice(0, 15000)}  // Sarvam accepts max ~16k tokens
// ====================
// Question: ${query}
// `;

//   try {
//     const response = await axios.post(
//       "https://api.sarvam.ai/v1/chat/completions",
//       {
//         model: "sarvam-m",
//         messages: [
//           { role: "system", content: "You answer only transport-related queries using the provided PDF content." },
//           { role: "user", content: prompt }
//         ]
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.SARVAM_API_KEY}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     return response.data.choices[0].message.content;
//   } catch (err) {
//     console.error("❌ Sarvam API error:", err.message);
//     return "Sorry, I couldn't process that using the document.";
//   }
// }
async function askFromPDF(query) {
  await setupRAG();

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
