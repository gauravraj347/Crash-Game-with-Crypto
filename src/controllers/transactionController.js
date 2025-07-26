const Transaction = require('../models/transaction');

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ playerId: req.params.playerId });
    res.json(transactions);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
