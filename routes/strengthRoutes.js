const express = require("express");
const { checkStrength } = require("../controllers/strengthController");

const router = express.Router();

router.post("/check-strength", checkStrength);

module.exports = router;