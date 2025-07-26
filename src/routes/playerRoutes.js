const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

router.post('/', playerController.createPlayer);
router.get('/wallet/:playerId', playerController.getWallet);

module.exports = router;
