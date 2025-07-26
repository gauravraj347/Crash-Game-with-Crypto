// Utility for fetching and caching real-time crypto prices
const axios = require('axios');

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price';
const SUPPORTED = ['bitcoin', 'ethereum'];
const SYMBOL_MAP = { BTC: 'bitcoin', ETH: 'ethereum' };
let cache = {};
let lastFetch = 0;
const CACHE_DURATION = 10 * 1000; // 10 seconds

async function getCryptoPrice(symbol) {
  const now = Date.now();
  if (cache[symbol] && now - lastFetch < CACHE_DURATION) {
    return cache[symbol];
  }
  try {
    const ids = SUPPORTED.join(',');
    const res = await axios.get(COINGECKO_URL + `?ids=${ids}&vs_currencies=usd`);
    cache = {
      BTC: res.data.bitcoin.usd,
      ETH: res.data.ethereum.usd
    };
    lastFetch = now;
    return cache[symbol];
  } catch (err) {
    if (cache[symbol]) return cache[symbol]; // fallback to cache
    throw err;
  }
}

module.exports = { getCryptoPrice };
