const express = require('express');
const { getDelhiCases } = require('../controllers/delhi-court-controller');

const router = express.Router();

router.get('/', getDelhiCases);

module.exports = router;
