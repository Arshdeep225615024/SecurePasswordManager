// routes/passwordRoutes.js
const express = require("express");
const { savePassword, getPasswords, deletePassword } = require("../controllers/passwordController");

const router = express.Router();

router.post("/save-password", savePassword);   // POST /api/save-password
router.get("/passwords", getPasswords);        // GET /api/passwords?userId=...
router.delete("/passwords/:id", deletePassword);

module.exports = router;
