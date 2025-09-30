// jobs/checkPasswords.js
const cron = require("node-cron");
const Password = require("../models/password");
const { decryptPassword } = require("../utils/encryption");
const { checkPasswordPwnedCount } = require("../services/breachService");
const { getIO } = require("../socket");

function startPasswordChecker(schedule = "*/1 * * * *") {
  console.log("Starting password checker job with schedule:", schedule);

  cron.schedule(schedule, async () => {
    console.log("[cron] Running password re-check job:", new Date().toISOString());
    try {
      const all = await Password.find({}).lean();
      for (const p of all) {
        try {
          const plain = decryptPassword(p.password);
          const newCount = await checkPasswordPwnedCount(plain);

          console.log(`[cron] Checked ${p.appName} (${p.username}) → breaches=${newCount}`);

          if (newCount > 0) {
            await Password.findByIdAndUpdate(
              p._id,
              { pwnedCount: newCount, lastChecked: new Date() }
            );

            const io = getIO();
            const payload = {
              appName: p.appName,
              username: p.username,
              pwnedCount: newCount,
              passwordId: p._id
            };
            io.to(String(p.owner)).emit("breachAlert", payload);
            console.log(`[cron] Emitted breachAlert to owner ${p.owner} for ${p.appName}`);
          }
        } catch (innerErr) {
          console.warn("Check failed for password id:", p._id, innerErr.message || innerErr);
        }
      }
    } catch (err) {
      console.error("[cron] Password checker failed:", err.message || err);
    }
  }, {
    scheduled: true,
    timezone: "UTC"
  });
}

module.exports = { startPasswordChecker };
