const axios = require('axios');

// Obtiene la URL real de imagen de Steam Market para un skin
async function fetchSteamItemImage(marketHashName) {
  try {
    const url = `https://steamcommunity.com/market/search/render/`;
    const res = await axios.get(url, {
      params: { query: marketHashName, appid: 730, norender: 1, count: 1 },
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const items = res.data?.results;
    if (items && items.length > 0) {
      const hash = items[0].asset_description?.icon_url;
      if (hash) return `https://community.cloudflare.steamstatic.com/economy/image/${hash}/360fx360f`;
    }
  } catch (err) {
    // silencioso
  }
  return null;
}

// Construye la URL de imagen a partir del market_hash_name usando el CDN de Steam directamente
// (requiere que la skin esté listada en el market)
function getSteamMarketImageUrl(marketHashName) {
  const encoded = encodeURIComponent(marketHashName);
  return `https://community.cloudflare.steamstatic.com/economy/image/class/730/${encoded}/360fx360f`;
}

module.exports = { fetchSteamItemImage, getSteamMarketImageUrl };
