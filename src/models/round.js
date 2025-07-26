const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  crashPoint: { type: Number, required: true },
  seed: { type: String, required: true },
  hash: { type: String, required: true },
  bets: [
    {
      playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
      usdAmount: Number,
      cryptoAmount: Number,
      currency: String,
      cashedOut: { type: Boolean, default: false },
      cashoutMultiplier: Number,
      cashoutTime: Date
    }
  ],
  startedAt: { type: Date, required: true },
  endedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Round', roundSchema);
