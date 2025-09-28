const express = require("express");
const { savePassword, getPasswords, deletePassword } = require("../controllers/passwordController");

const router = express.Router();

router.post("/save-password", savePassword);
router.get("/passwords", getPasswords);
router.delete("/passwords/:id", deletePassword);

module.exports = router;