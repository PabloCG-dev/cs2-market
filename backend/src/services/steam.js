const axios = require('axios');

const STEAM_BASE = 'https://steamcommunity.com/market/priceoverview/';

async function getSteamPrice(marketHashName) {
  try {
    const res = await axios.get(STEAM_BASE, {
      params: { currency: 3, appid: 730, market_hash_name: marketHashName },
      timeout: 5000
    });
    return res.data;
  } catch (err) {
    console.error(`[Steam] Error fetching ${marketHashName}:`, err.message);
    return null;
  }
}

module.exports = { getSteamPrice };
