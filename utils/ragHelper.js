// const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
// const { MemoryVectorStore } = require("langchain/vectorstores/memory");
// const { OpenAI } = require("langchain/llms/openai");
// const { RetrievalQAChain } = require("langchain/chains");
// const { Document } = require("langchain/document");
// require("dotenv").config();

// const extractTextFromPDF = require("./pdfLoader");

// let qaChain;

// async function setupRAG() {
//   const rawText = await extractTextFromPDF("./data/company-profile.pdf");

//   const docs = [new Document({ pageContent: rawText })];

//   const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
//   const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

//   const model = new OpenAI({ temperature: 0, openAIApiKey: process.env.OPENAI_API_KEY });

//   qaChain = await RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
// }

// async function askFromPDF(query) {
//   if (!qaChain) await setupRAG();
//   const result = await qaChain.call({ query });
//   return result.text;
// }

// module.exports = askFromPDF;


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

  const prompt = `
You are a transport domain assistant. Based on the following PDF content, answer the question:
====================
${rawText.slice(0, 15000)}  // Sarvam accepts max ~16k tokens
====================
Question: ${query}
`;

  try {
    const response = await axios.post(
      "https://api.sarvam.ai/v1/chat/completions",
      {
        model: "sarvam-m",
        messages: [
          { role: "system", content: "You answer only transport-related queries using the provided PDF content." },
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

    return response.data.choices[0].message.content;
  } catch (err) {
    console.error("❌ Sarvam API error:", err.message);
    return "Sorry, I couldn't process that using the document.";
  }
}

module.exports = askFromPDF;
