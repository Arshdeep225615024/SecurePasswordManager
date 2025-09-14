const crypto = require("crypto");
const axios = require("axios");

const checkBreach = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Step 1: SHA1 hash of password
    const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    // Step 2: Call HaveIBeenPwned API
    const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);

    // Step 3: Check if suffix exists
    const lines = response.data.split("\n");
    let count = 0;
    for (let line of lines) {
      const [hashSuffix, times] = line.trim().split(":");
      if (hashSuffix === suffix) {
        count = parseInt(times, 10);
        break;
      }
    }

    if (count > 0) {
      res.json({ breached: true, count });
    } else {
      res.json({ breached: false, count: 0 });
    }
  } catch (error) {
    console.error("❌ Breach check error:", error.message);
    res.status(500).json({ error: "Error checking breach" });
  }
};

module.exports = { checkBreach }; 