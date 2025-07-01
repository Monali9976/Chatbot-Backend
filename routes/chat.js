// const express = require("express");
// const router = express.Router();
// const axios = require("axios");
// const Chat = require("../models/Chat");
// const appendToGoogleSheet = require("./googleSheetHelper");
// const questionBank = require("../data/questionBank.json"); // 📁 Create this file

// // Keyword-based filter for fallback check
// const isTransportRelated = (message) => {
//   const keywords = [
//     "bus", "train", "flight", "transport", "taxi", "cab", "metro", "public transport",
//     "vehicle", "ticket", "schedule", "route", "map", "fare", "auto", "delivery", "shipping"
//   ];
//   return keywords.some(keyword => message.toLowerCase().includes(keyword));
// };

// // Exact or fuzzy match function (can improve later with better NLP)
// // const findAnswerInQuestionBank = (userMessage) => {
// //   const lowerMsg = userMessage.toLowerCase();
// //   for (const item of questionBank) {
// //     if (lowerMsg.includes(item.question.toLowerCase())) {
// //       return item.answer;
// //     }
// //   }
// //   return null;
// // };
// const stopWords = new Set([
//   "what", "who", "do", "does", "is", "are", "the", "your", "you", "i", "me", "we", "a", "an", "to", "of", "in", "and"
// ]);

// const findAnswerInQuestionBank = (userMessage) => {
//   const lowerMsg = userMessage.toLowerCase().split(/\W+/).filter(word => !stopWords.has(word));
//   let bestMatch = null;
//   let maxScore = 0;

//   for (const item of questionBank) {
//     const questionWords = item.question.toLowerCase().split(/\W+/).filter(word => !stopWords.has(word));
//     let score = 0;

//     for (const word of questionWords) {
//       if (lowerMsg.includes(word)) {
//         score++;
//       }
//     }

//     if (score > maxScore) {
//       maxScore = score;
//       bestMatch = item.answer;
//     }
//   }

//   return maxScore >= 2 ? bestMatch : null;
// };




// router.post("/", async (req, res) => {
//   const prompt = req.body.message;

//   // 🔍 Try to match from document first
//   const predefinedAnswer = findAnswerInQuestionBank(prompt);
//   if (predefinedAnswer) {
//     await Chat.create({ user: prompt, bot: predefinedAnswer });
//     await appendToGoogleSheet(prompt, predefinedAnswer);
//     return res.json({ reply: predefinedAnswer });
//   }

//   // ❌ Block unrelated questions
//   if (!isTransportRelated(prompt)) {
//     return res.json({ reply: "Sorry, I can only answer transport-related questions." });
//   }

//   // ✅ Use LLM API if not matched in file
//   try {
//     const response = await axios.post(
//       "https://api.sarvam.ai/v1/chat/completions",
//       {
//         model: "sarvam-m",
//         messages: [
//           { role: "system", content: "You are a helpful assistant that answers only transport-related queries. If the question is unrelated to transport, politely refuse to answer." },
//           { role: "user", content: prompt }
//         ]
//       },
//       {
//         headers: {
//           Authorization: `Bearer sk_7jbu7vne_BJw3eRGCNglP9C5vCmxDhVYM`,
//           "Content-Type": "application/json",
//         }
//       }
//     );

//     const reply = response.data.choices[0].message.content;

//     await Chat.create({ user: prompt, bot: reply });
//     await appendToGoogleSheet(prompt, reply);

//     res.json({ reply });
//   } catch (err) {
//     console.error("Chat error:", err.message);
//     res.status(500).json({ reply: "Sorry, something went wrong." });
//   }
// });
// module.exports = router;




// const express = require("express");
// const router = express.Router();
// const askFromPDF = require("../utils/ragHelper");

// router.post("/", async (req, res) => {
//   const userMessage = req.body.message;

//   try {
//     const answer = await askFromPDF(userMessage);
//     res.json({ reply: answer });
//   } catch (err) {
//     console.error("RAG error:", err);
//     res.status(500).json({ reply: "Something went wrong while answering your question." });
//   }
// });

// module.exports = router;



// const express = require("express");
// const router = express.Router();
// const askFromPDF = require("../utils/ragHelper");
// const appendToGoogleSheet = require("./googleSheetHelper");

// router.post("/", async (req, res) => {
//   const userMessage = req.body.message;

//   try {
//     const answer = await askFromPDF(userMessage);

//     // ✅ Append the message and answer to Google Sheet
//     await appendToGoogleSheet(userMessage, answer);

//     res.json({ reply: answer });
//   } catch (err) {
//     console.error("RAG error:", err);
//     res.status(500).json({ reply: "Something went wrong while answering your question." });
//   }
// });

// module.exports = router;




const express = require("express");
const router = express.Router();
const askFromPDF = require("../utils/ragHelper");
const appendToGoogleSheet = require("./googleSheetHelper");
const Chat = require("../models/Chat"); // ✅ Import Chat model

router.post("/", async (req, res) => {
  const userMessage = req.body.message;
  const userId = req.body.userId || "guest";

  console.log("👉 Received message:", userMessage);
  console.log("👉 From userId:", userId);

  try {
    const answer = await askFromPDF(userMessage);
    console.log("✅ RAG reply:", answer);
    // ✅ Append the message and answer to Google Sheet
    await appendToGoogleSheet(userMessage, answer);
    // ✅ Save to MongoDB
    await Chat.create({
      userId,
      message: userMessage,
      reply: answer
    });

    res.json({ reply: answer });
  } catch (err) {
    console.error("RAG error:", err);
    res.status(500).json({ reply: "Something went wrong while answering your question." });
  }
});


router.get("/", async (req, res) => {
  try {
    const chats = await Chat.find().sort({ createdAt: -1 }); // Latest first
    res.json(chats);
  } catch (err) {
    console.error("Chat fetch error:", err);
    res.status(500).json({ message: "Failed to load chat logs" });
  }
});

module.exports = router;
