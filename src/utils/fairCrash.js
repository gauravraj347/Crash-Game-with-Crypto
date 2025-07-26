// Provably fair crash point generator
const crypto = require('crypto');

function getCrashPoint(seed, roundNumber, maxCrash = 100) {
  const hash = crypto.createHash('sha256').update(seed + roundNumber).digest('hex');
  // Use hash as a deterministic random number
  const hex = hash.slice(0, 16);
  const intVal = parseInt(hex, 16);
  const crash = 1 + (intVal % (maxCrash * 100 - 100)) / 100; // e.g., between 1.00 and 100.00
  return { crashPoint: crash, hash };
}

function generateSeed() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = { getCrashPoint, generateSeed };
