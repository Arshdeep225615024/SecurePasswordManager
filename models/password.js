const mongoose = require("mongoose");

const passwordSchema = new mongoose.Schema({
  appName: { type: String, required: true },
  username: { type: String, required: true },
  password: {
    iv: { type: String, required: true },
    content: { type: String, required: true },
    tag: { type: String, required: true },
  },
});

module.exports = mongoose.model("Password", passwordSchema);