const axios = require('axios');
const { getDB } = require('../db/database');

// Fetch de imágenes reales desde ByMykel/CSGO-API (GitHub)
// Una sola petición para obtener todos los hashes válidos del CDN de Steam
async function autoFetchImages() {
  const db = getDB();

  try {
    console.log('[Images] Descargando catálogo de imágenes CS2...');
    const res = await axios.get(
      'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json',
      { timeout: 15000, headers: { 'User-Agent': 'cs2-market-app/1.0' } }
    );

    const catalog = res.data; // Array de { name, market_hash_name, image, ... }
    if (!Array.isArray(catalog)) throw new Error('Formato inesperado');

    // Mapa rápido: baseName (sin wear) -> image_url
    // ByMykel usa "AK-47 | Redline" pero nuestra DB tiene "AK-47 | Redline (Field-Tested)"
    const imageMap = {};
    for (const item of catalog) {
      if (item.name && item.image) {
        imageMap[item.name.trim()] = item.image;
      }
    }

    // Actualizar skins en la DB
    const skins = db.prepare('SELECT id, name FROM skins').all();
    let updated = 0;

    for (const skin of skins) {
      // Eliminar el wear del nombre: "AK-47 | Redline (Field-Tested)" -> "AK-47 | Redline"
      const baseName = skin.name.replace(/\s*\([^)]+\)$/, '').trim();
      // ByMykel usa "★ Karambit | Doppler" para cuchillos y guantes
      const imageUrl = imageMap[baseName] || imageMap['★ ' + baseName];
      if (imageUrl) {
        // Usar tamaño 360x360 para mejor calidad
        const fullUrl = imageUrl.includes('?') ? imageUrl : imageUrl + '/360fx360f';
        db.prepare('UPDATE skins SET image_url = ? WHERE id = ?').run(fullUrl, skin.id);
        updated++;
      }
    }

    console.log(`[Images] ✅ Imágenes cargadas: ${updated}/${skins.length}`);
  } catch (err) {
    console.warn('[Images] ⚠️  No se pudo cargar el catálogo:', err.message);
    console.log('[Images] Usando imágenes de Steam Market como fallback');
    await fetchFromSteamFallback();
  }
}

// Fallback: Steam Market API con rate limiting si GitHub falla
async function fetchFromSteamFallback() {
  const db = getDB();
  const skins = db.prepare(
    "SELECT id, name FROM skins WHERE image_url NOT LIKE '%community.cloudflare.steamstatic.com%' AND image_url NOT LIKE '%raw.githubusercontent.com%'"
  ).all();

  if (skins.length === 0) return;
  console.log(`[Images] Fallback Steam para ${skins.length} skins...`);
  let updated = 0;

  for (const skin of skins) {
    try {
      const res = await axios.get('https://steamcommunity.com/market/search/render/', {
        params: { query: skin.name, appid: 730, norender: 1, count: 1 },
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'es-ES,es;q=0.9'
        }
      });
      const results = res.data?.results;
      if (results?.length > 0) {
        const hash = results[0].asset_description?.icon_url;
        if (hash) {
          const url = `https://community.cloudflare.steamstatic.com/economy/image/${hash}/360fx360f`;
          db.prepare('UPDATE skins SET image_url = ? WHERE id = ?').run(url, skin.id);
          updated++;
        }
      }
      await new Promise(r => setTimeout(r, 1200));
    } catch (_) {}
  }
  console.log(`[Images] Fallback: ${updated}/${skins.length} imágenes`);
}

module.exports = { autoFetchImages };
