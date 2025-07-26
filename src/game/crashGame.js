// Crash Game Engine
// Handles round lifecycle, bets, cashouts, and emits real-time events
const { getCrashPoint, generateSeed } = require('../utils/fairCrash');
const Round = require('../models/round');
const Player = require('../models/player');
const Transaction = require('../models/transaction');
const { getCryptoPrice } = require('../utils/cryptoPrice');
const mongoose = require('mongoose');

class CrashGame {
  constructor(io) {
    this.io = io;
    this.round = null;
    this.roundNumber = 0;
    this.multiplier = 1;
    this.growthFactor = 0.03; // Multiplier growth rate
    this.isCrashed = false;
    this.bets = [];
    this.seed = '';
    this.crashPoint = 0;
    this.startTime = null;
    this.interval = null;
    this.startNextRound();
  }

  // Start a new round: generate crash point, reset state, emit event
  async startNextRound() {
    this.roundNumber += 1;
    this.multiplier = 1;
    this.isCrashed = false;
    this.bets = [];
    this.seed = generateSeed();
    const { crashPoint, hash } = getCrashPoint(this.seed, this.roundNumber, 120);
    this.crashPoint = crashPoint;
    this.hash = hash;
    this.startTime = Date.now();
    this.io.emit('round_start', {
      roundNumber: this.roundNumber,
      hash: this.hash,
      startedAt: this.startTime,
      crashPoint: null
    });
    // Save round to DB
    this.round = await Round.create({
      roundNumber: this.roundNumber,
      crashPoint: this.crashPoint,
      seed: this.seed,
      hash: this.hash,
      bets: [],
      startedAt: new Date(this.startTime)
    });
    // Start multiplier updates every 100ms
    this.interval = setInterval(() => this.updateMultiplier(), 100);
  }

  // Update multiplier and emit to clients; crash if reached
  async updateMultiplier() {
    if (this.isCrashed) return;
    const elapsed = (Date.now() - this.startTime) / 1000;
    this.multiplier = 1 + (elapsed * this.growthFactor);
    if (this.multiplier >= this.crashPoint) {
      this.crash();
    } else {
      this.io.emit('multiplier_update', { multiplier: this.multiplier });
    }
  }

  // Crash the round, update DB, emit crash event, and schedule next round
  async crash() {
    this.isCrashed = true;
    clearInterval(this.interval);
    await Round.findByIdAndUpdate(this.round._id, { endedAt: new Date(), crashPoint: this.crashPoint });
    this.io.emit('round_crash', { crashPoint: this.crashPoint });
    setTimeout(() => this.startNextRound(), 10000); // 10s until next round
  }

  // Place a bet for the current round
  async placeBet(playerId, usdAmount, currency) {
    const player = await Player.findById(playerId);
    if (!player) throw new Error('Player not found');
    const price = await getCryptoPrice(currency);
    const cryptoAmount = usdAmount / price;
    if (player.wallets[currency] < cryptoAmount) throw new Error('Insufficient balance');
    // Deduct from wallet
    player.wallets[currency] -= cryptoAmount;
    await player.save();
    // Log transaction
    await Transaction.create({
      playerId,
      usdAmount,
      cryptoAmount,
      currency,
      transactionType: 'bet',
      transactionHash: new mongoose.Types.ObjectId().toString(),
      priceAtTime: price
    });
    // Add bet to round
    this.bets.push({ playerId, usdAmount, cryptoAmount, currency, cashedOut: false });
    await Round.findByIdAndUpdate(this.round._id, { $push: { bets: { playerId, usdAmount, cryptoAmount, currency, cashedOut: false } } });
    return { cryptoAmount, price };
  }

  // Cash out a bet before crash; update wallet, log transaction, emit event
  async cashOut(playerId) {
    if (this.isCrashed) throw new Error('Cannot cash out after crash');
    const bet = this.bets.find(b => b.playerId.toString() === playerId.toString() && !b.cashedOut);
    if (!bet) throw new Error('No active bet');
    bet.cashedOut = true;
    bet.cashoutMultiplier = this.multiplier;
    bet.cashoutTime = new Date();
    // Calculate payout
    const payoutCrypto = bet.cryptoAmount * this.multiplier;
    const player = await Player.findById(playerId);
    player.wallets[bet.currency] += payoutCrypto;
    await player.save();
    // Log transaction
    const price = await getCryptoPrice(bet.currency);
    await Transaction.create({
      playerId,
      usdAmount: payoutCrypto * price,
      cryptoAmount: payoutCrypto,
      currency: bet.currency,
      transactionType: 'cashout',
      transactionHash: new mongoose.Types.ObjectId().toString(),
      priceAtTime: price
    });
    // Update round bet status
    await Round.updateOne(
      { _id: this.round._id, 'bets.playerId': playerId },
      { $set: { 'bets.$.cashedOut': true, 'bets.$.cashoutMultiplier': this.multiplier, 'bets.$.cashoutTime': new Date() } }
    );
    this.io.emit('player_cashout', {
      playerId,
      cryptoPayout: payoutCrypto,
      usdPayout: payoutCrypto * price,
      multiplier: this.multiplier
    });
    return { payoutCrypto, multiplier: this.multiplier };
  }
}

module.exports = CrashGame;
