// Game-related API controllers
const CrashGame = require('../game/crashGame');

// These will be set in server.js
let crashGameInstance = null;
exports.setCrashGameInstance = (instance) => { crashGameInstance = instance; };

exports.placeBet = async (req, res) => {
  try {
    const { playerId, usdAmount, currency } = req.body;
    if (!playerId || !usdAmount || !currency) return res.status(400).json({ error: 'Missing params' });
    const result = await crashGameInstance.placeBet(playerId, usdAmount, currency);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.cashOut = async (req, res) => {
  try {
    const { playerId } = req.body;
    if (!playerId) return res.status(400).json({ error: 'Missing playerId' });
    const result = await crashGameInstance.cashOut(playerId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
