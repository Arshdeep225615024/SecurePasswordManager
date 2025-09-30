// models/password.js
const mongoose = require("mongoose");

const passwordSchema = new mongoose.Schema({
  appName: { type: String, required: true },
  username: { type: String, required: true },
  password: {
    iv: { type: String, required: true },
    content: { type: String, required: true },
    tag: { type: String, required: true },
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pwnedCount: { type: Number, default: 0 },
  lastChecked: { type: Date, default: null },
}, {
  timestamps: true
});

module.exports = mongoose.model("Password", passwordSchema);
