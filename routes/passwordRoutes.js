const express = require("express");
const { savePassword, getPasswords, deletePassword } = require("../controllers/passwordController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/save-password", authMiddleware, savePassword);
router.get("/passwords", authMiddleware, getPasswords);
router.delete("/passwords/:id", authMiddleware, deletePassword);

module.exports = router;
