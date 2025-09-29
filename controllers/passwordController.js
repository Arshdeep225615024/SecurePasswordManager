const Password = require("../models/password");
const { encryptPassword, decryptPassword } = require("../utils/encryption");


const savePassword = async (req, res) => {
  try {
    const { appName, username, password } = req.body;
    if (!appName || !username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const encrypted = encryptPassword(password);

    const newPwd = new Password({
      appName,
      username,
      password: encrypted,
      userId: req.user.id, // attach logged-in user ID
    });

    await newPwd.save();
    res.status(201).json({ message: "✅ Password saved securely" });
  } catch (err) {
    console.error("Save password error:", err.message);
    res.status(500).json({ error: "Failed to save password" });
  }
};


const getPasswords = async (req, res) => {
  try {
    const saved = await Password.find({ userId: req.user.id }); // only this user's passwords

    const decrypted = saved.map((entry) => ({
      id: entry._id,
      appName: entry.appName,
      username: entry.username,
      password: decryptPassword(entry.password),
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
    const deleted = await Password.findOneAndDelete({ _id: id, userId: req.user.id }); 
    if (!deleted) {
      return res.status(404).json({ error: "Password not found or unauthorized" });
    }
    res.json({ message: "🗑️ Password deleted successfully" });
  } catch (err) {
    console.error("Delete password error:", err.message);
    res.status(500).json({ error: "Failed to delete password" });
  }
};

  

module.exports = { savePassword, getPasswords, deletePassword };