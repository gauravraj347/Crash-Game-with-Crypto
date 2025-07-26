const Player = require('../models/player');

exports.createPlayer = async (req, res) => {
  try {
    const { username, wallets } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });
    const existing = await Player.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    // If wallets provided, use them; otherwise, use defaults
    const player = await Player.create({
      username,
      wallets: wallets || { BTC: 0, ETH: 0 }
    });

    res.status(201).json(player);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getWallet = async (req, res) => {
  try {
    const player = await Player.findById(req.params.playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const { getCryptoPrice } = require('../utils/cryptoPrice');
    const prices = {
      BTC: await getCryptoPrice('BTC'),
      ETH: await getCryptoPrice('ETH')
    };
    res.json({
      BTC: {
        balance: player.wallets.BTC,
        usd: player.wallets.BTC * prices.BTC
      },
      ETH: {
        balance: player.wallets.ETH,
        usd: player.wallets.ETH * prices.ETH
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
