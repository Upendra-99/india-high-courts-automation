const express = require('express');
const { getAndhraCases } = require('../controllers/andhra-court-controller');

const router = express.Router();

router.get('/', getAndhraCases);

module.exports = router;
