const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
require("dotenv").config();

const breachRoutes = require("./routes/breachRoutes");
const strengthRoutes = require("./routes/strengthRoutes");
const passwordRoutes = require("./routes/passwordRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// --- HTTP server + Socket.io setup ---
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server, {
  // same-origin? you can remove CORS later; leave open while testing
  cors: { origin: "*", methods: ["GET", "POST"] },
});
app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 client connected:", socket.id);
  socket.on("disconnect", () => console.log("🔌 client disconnected:", socket.id));
});

connectDB();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", breachRoutes);
app.use("/api", strengthRoutes);
app.use("/api", passwordRoutes);
app.use("/api", authRoutes);

// --- Lightweight test route to emit a demo event ---
app.post("/api/test-breach", (_req, res) => {
  io.emit("breach-detected", {
    account: "demo@example.com",
    source: "HaveIBeenPwned",
    time: Date.now(),
  });
  res.json({ ok: true });
});

// --- View routes ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/signup", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "signup.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
