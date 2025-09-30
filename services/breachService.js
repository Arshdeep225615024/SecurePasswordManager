// services/breachService.js
const crypto = require("crypto");
const axios = require("axios");

/**
 * Returns pwned count (integer) using HIBP range API.
 * If error or not found -> returns 0.
 */
async function checkPasswordPwnedCount(plainPassword) {
  try {
    const sha1 = crypto.createHash("sha1").update(plainPassword).digest("hex").toUpperCase();
    const prefix = sha1.substring(0, 5);
    const suffix = sha1.substring(5);

    const res = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`);
    const lines = res.data.split("\n");
    for (const line of lines) {
      const [hashSuffix, countStr] = line.trim().split(":");
      if (hashSuffix === suffix) {
        return parseInt(countStr, 10) || 0;
      }
    }
    return 0;
  } catch (err) {
    console.warn("HIBP check failed:", err.message || err);
    // On fail, return 0 (no evidence). You could return null to indicate unknown.
    return 0;
  }
}

module.exports = { checkPasswordPwnedCount };
