const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
require("dotenv").config();

const breachRoutes = require("./routes/breachRoutes");
const strengthRoutes = require("./routes/strengthRoutes");
const passwordRoutes = require("./routes/passwordRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();


connectDB();


app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


app.use("/api", breachRoutes);
app.use("/api", strengthRoutes);
app.use("/api", passwordRoutes);
app.use("/api", authRoutes);


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "signup.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// simple health endpoint for live smoke tests
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});
