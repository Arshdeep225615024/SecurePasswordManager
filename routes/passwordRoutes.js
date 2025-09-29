// routes/passwordRoutes.js
const express = require('express');
const { savePassword, getPasswords, deletePassword } = require('../controllers/passwordController');

const router = express.Router();

router.post('/passwords', savePassword);       // <-- change made here
router.get('/passwords', getPasswords);
router.delete('/passwords/:id', deletePassword);

module.exports = router;
