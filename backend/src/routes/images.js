const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getDB } = require('../db/database');

// GET /api/images/refresh — actualiza image_url de todos los skins desde Steam Market
router.post('/refresh', async (req, res) => {
  const db = getDB();
  const skins = db.prepare('SELECT id, name FROM skins').all();
  let updated = 0;

  for (const skin of skins) {
    try {
      const url = `https://steamcommunity.com/market/search/render/`;
      const response = await axios.get(url, {
        params: { query: skin.name, appid: 730, norender: 1, count: 1 },
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      const items = response.data?.results;
      if (items && items.length > 0) {
        const hash = items[0].asset_description?.icon_url;
        if (hash) {
          const imageUrl = `https://community.cloudflare.steamstatic.com/economy/image/${hash}/360fx360f`;
          db.prepare('UPDATE skins SET image_url = ? WHERE id = ?').run(imageUrl, skin.id);
          updated++;
        }
      }
      await new Promise(r => setTimeout(r, 300)); // rate limit
    } catch {}
  }
  res.json({ message: `Imágenes actualizadas: ${updated}/${skins.length}` });
});

// GET /api/images/proxy?url=... — proxy para imágenes que tengan CORS issues
router.get('/proxy', async (req, res) => {
  const { url } = req.query;
  if (!url || !url.startsWith('https://community.cloudflare.steamstatic.com')) {
    return res.status(400).json({ error: 'URL no permitida' });
  }
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
    res.set('Content-Type', response.headers['content-type'] || 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(response.data);
  } catch {
    res.status(404).send();
  }
});

module.exports = router;
