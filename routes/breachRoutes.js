const express = require("express");
const { checkBreach } = require("../controllers/breachController");

const router = express.Router();

router.post("/check-breach", checkBreach);

module.exports = router;