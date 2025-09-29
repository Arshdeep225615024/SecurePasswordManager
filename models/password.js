const mongoose = require("mongoose");

const passwordSchema = new mongoose.Schema({
  appName: { type: String, required: true },
  username: { type: String, required: true },
  password: {
    iv: { type: String, required: true },
    content: { type: String, required: true },
    tag: { type: String, required: true },
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }
}, { timestamps: true });

module.exports = mongoose.model("Password", passwordSchema);