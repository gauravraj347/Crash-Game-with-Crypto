const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.get('/:playerId', transactionController.getTransactions);

module.exports = router;
