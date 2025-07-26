# Crypto Crash Backend

Backend for a provably fair Crash game with cryptocurrency integration and real-time multiplayer updates.

## Features
- Crash game logic with provably fair algorithm
- Real-time crypto price integration (CoinGecko)
- Simulated player wallets and transaction logs
- REST API (Express.js) and WebSocket (Socket.IO) support
- MongoDB for storage

## Setup
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment:**
   - Copy `.env.example` to `.env` and set `MONGO_URI` if needed.
   - No API key needed for CoinGecko.
3. **Start MongoDB:**
   - Ensure MongoDB is running locally or provide a remote URI.
4. **Run the server:**
   ```bash
   npm start
   ```

## API Endpoints

### Create Player
`POST /api/player`
```json
{
  "username": "sixnine",
  "wallets": { "BTC": 100, "ETH": 100 } // optional, defaults to 0
}
```

### Get Wallet Balance
`GET /api/player/wallet/:playerId`

### Place Bet
`POST /api/game/bet`
```json
{
  "playerId": "<playerId>",
  "usdAmount": 10,
  "currency": "BTC"
}
```

### Cash Out
`POST /api/game/cashout`
```json
{
  "playerId": "<playerId>"
}
```

### Get Transactions
`GET /api/transactions/:playerId`

## WebSocket Events (Socket.IO)
Connect to `ws://localhost:3000`
- `round_start`: `{ roundNumber, hash, startedAt }`
- `multiplier_update`: `{ multiplier }` (every 100ms)
- `player_cashout`: `{ playerId, cryptoPayout, usdPayout, multiplier }`
- `round_crash`: `{ crashPoint }`
- **Client emits:** `cashout`: `{ playerId }`

## Provably Fair Algorithm
Crash point is generated as:
```js
hash = sha256(seed + roundNumber)
crash = 1 + (parseInt(hash.slice(0,16),16) % (maxCrash*100-100))/100
```
Seed is random per round and hash is published for verification.

## USD-to-Crypto Conversion
- Uses CoinGecko API for live BTC/ETH prices.
- Prices cached for 10s; conversions use price at bet time.
- Example: $10 bet @ $60,000/BTC → 0.00016667 BTC.

## Game Logic
- New round every 10s.
- Bets placed in USD, converted to crypto.
- Multiplier increases until crash (provably fair).
- Players cash out before crash for winnings; else lose bet.
- All actions and outcomes logged in MongoDB.

## Security & Error Handling
- All inputs validated.
- Atomic DB updates for wallet/transactions.
- Handles API errors and rate limits (uses cache fallback).

## WebSocket Demo Client
See `ws-client.html` for a simple demo (connect, view events, send cashout).
## Contact
- For questions, contact maintainer.
