const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("pdf"), async (req, res) => {
  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);
  const dataBuffer = fs.readFileSync(filePath);

  try {
    const data = await pdfParse(dataBuffer);
    fs.writeFileSync("data/pdf-text.txt", data.text); // Save parsed text
    res.json({ success: true, message: "PDF uploaded and processed." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to parse PDF." });
  }
});

module.exports = router;
