// controllers/passwordController.js
const Password = require("../models/password");
const { encryptPassword, decryptPassword } = require("../utils/encryption");
const { checkPasswordPwnedCount } = require("../services/breachService");

/**
 * Save password.
 * Expects in body: { appName, username, password, userId }
 */
const savePassword = async (req, res) => {
  try {
    const { appName, username, password, userId } = req.body;
    if (!appName || !username || !password || !userId) {
      return res.status(400).json({ error: "appName, username, password and userId are required" });
    }

    const encrypted = encryptPassword(password); // keep your AES util

    // initial pwned check
    const pwnedCount = await checkPasswordPwnedCount(password);

    const newPwd = new Password({
      appName,
      username,
      password: encrypted,
      owner: req.user.id ,
      pwnedCount,
      lastChecked: new Date(),
    });

    const saved = await newPwd.save();

    // respond with minimal safe info (include id)
    res.status(201).json({
      message: "✅ Password saved securely",
      id: saved._id,
      appName: saved.appName,
      username: saved.username,
      pwnedCount: saved.pwnedCount
    });
  } catch (err) {
    console.error("Save password error:", err.message);
    res.status(500).json({ error: "Failed to save password" });
  }
};

/**
 * Get passwords for a user.
 * Accepts userId as query param: /api/passwords?userId=...
 * Returns decrypted password and id (so frontend can delete).
 */
const getPasswords = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const saved = await Password.find({ owner: userId }).sort({ createdAt: -1 }).lean();

    const decrypted = saved.map((entry) => ({
      id: entry._id,
      appName: entry.appName,
      username: entry.username,
      password: decryptPassword(entry.password),
      pwnedCount: entry.pwnedCount || 0,
      lastChecked: entry.lastChecked
    }));

    res.json(decrypted);
  } catch (err) {
    console.error("Fetch passwords error:", err.message);
    res.status(500).json({ error: "Failed to fetch passwords" });
  }
};

const deletePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Password.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ message: "🗑️ Password deleted successfully" });
  } catch (err) {
    console.error("Delete password error:", err.message);
    res.status(500).json({ error: "Failed to delete password" });
  }
};

module.exports = { savePassword, getPasswords, deletePassword };
