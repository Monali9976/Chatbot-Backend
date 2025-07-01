const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./db");


dotenv.config();
const app = express();

connectDB(); // ✅ connect DB

app.use(cors());
app.use(express.json());

const chatRoute = require("./routes/chat");
app.use("/api/chats", require("./routes/chat"));

app.use("/api/chat", chatRoute);
app.use("/admin/chats", chatRoute); // optional
// app.listen(5000, () => console.log("Server running on port 5000"));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
