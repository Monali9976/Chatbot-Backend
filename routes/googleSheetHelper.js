const { google } = require("googleapis");
// const credentials = require("../google-credentials.json");
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);


const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

let spreadsheetId = "11zZrhC55ZX8hct2Xb4OY92XAodakSXRjbwZ7qP4bu94"; // get from Google Sheets URL

async function appendToGoogleSheet(user, bot) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A1:B1",
      valueInputOption: "RAW",
      requestBody: {
        values: [[user, bot]],
      },
    });

    console.log("✅ Appended to Google Sheet");
  } catch (error) {
    console.error("❌ Google Sheets API Error:", error.message);
  }
}

module.exports = appendToGoogleSheet;
