// app.js
const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
require("dotenv").config();

const breachRoutes = require("./routes/breachRoutes");
const strengthRoutes = require("./routes/strengthRoutes");
const passwordRoutes = require("./routes/passwordRoutes");
const authRoutes = require("./routes/authRoutes"); // if exists

const { init } = require("./socket");
const { startPasswordChecker } = require("./jobs/checkPasswords");

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api", breachRoutes);
app.use("/api", strengthRoutes);
app.use("/api", passwordRoutes);
if (authRoutes) app.use("/api", authRoutes);

// Serve frontend (views are in views/)
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

// Serve signup.html
app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "signup.html"));
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

const PORT = process.env.PORT || 3000;

// Create server + socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

init(io); // initialize socket helper

// start background job (use a test schedule if desired)
startPasswordChecker(process.env.CHECK_SCHEDULE || "*/1 * * * *"); // default every 5 minutes for testing

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
