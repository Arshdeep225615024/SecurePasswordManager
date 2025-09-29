const Password = require("../models/password");
const { encryptPassword, decryptPassword } = require("../utils/encryption");

// Normalize to the shape the frontend expects: {_id, app, username, password?}
function toClient(entry, includeDecryptedPw = false) {
  const base = {
    _id: entry._id,
    app: entry.appName,         // normalize: appName -> app
    username: entry.username,
  };
  if (includeDecryptedPw) {
    base.password = decryptPassword(entry.password);
  }
  return base;
}

const savePassword = async (req, res) => {
  try {
    // accept both keys from different clients
    const app = req.body.app || req.body.appName;
    const { username, password } = req.body;
    if (!app || !username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const encrypted = encryptPassword(password);

    // tolerate missing auth for demo; prefer req.user.id when available
    const userId = req.user?.id || null;

    const newPwd = await Password.create({
      appName: app,   // store as appName in DB
      username,
      password: encrypted,
      userId,         // may be null if unauthenticated demo
    });

    // respond with what UI expects
    return res.status(201).json(toClient(newPwd, false));
  } catch (err) {
    console.error("Save password error:", err);
    res.status(500).json({ error: "Failed to save password" });
  }
};

const getPasswords = async (req, res) => {
  try {
    // If authenticated, return only that user's entries; otherwise return all (demo mode)
    const userId = req.user?.id;
    const filter = userId ? { userId } : {};
    const saved = await Password.find(filter).lean();

    // normalize to {_id, app, username} (no decrypted pw in list)
    const normalized = saved.map((e) => ({
      _id: e._id,
      app: e.appName,
      username: e.username,
      // omit password in list; fetch individually if ever needed
    }));

    res.json(normalized);
  } catch (err) {
    console.error("Fetch passwords error:", err);
    res.status(500).json({ error: "Failed to fetch passwords" });
  }
};

const deletePassword = async (req, res) => {
  try {
    const { id } = req.params;

    // Prefer user-scoped delete if logged in; fallback to id-only for demo
    const userId = req.user?.id;
    const deleted = userId
      ? await Password.findOneAndDelete({ _id: id, userId })
      : await Password.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Password not found or unauthorized" });
    }
    res.status(204).end();
  } catch (err) {
    console.error("Delete password error:", err);
    res.status(500).json({ error: "Failed to delete password" });
  }
};

module.exports = { savePassword, getPasswords, deletePassword };
