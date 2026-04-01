const axios = require('axios');

const PRICEMPIRE_BASE = 'https://api.pricempire.com/v3';

async function getPricempirePrices(marketHashNames) {
  const apiKey = process.env.PRICEMPIRE_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    return null; // Sin key, usar datos mock
  }

  try {
    const res = await axios.get(`${PRICEMPIRE_BASE}/items/prices`, {
      params: { api_key: apiKey, sources: 'buff163,csfloat,skinport,dmarket,steam', currency: 'EUR' },
      timeout: 10000
    });
    return res.data;
  } catch (err) {
    console.error('[Pricempire] Error:', err.message);
    return null;
  }
}

module.exports = { getPricempirePrices };
