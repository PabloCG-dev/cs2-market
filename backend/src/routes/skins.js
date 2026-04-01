const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { calculateBuyScore } = require('../services/recommendation');

// GET /api/skins — listado con filtros
router.get('/', (req, res) => {
  const db = getDB();
  const { weapon, category, rarity, wear, minPrice, maxPrice, search, sort = 'name', order = 'asc' } = req.query;

  let where = ['1=1'];
  const params = [];

  if (weapon) { where.push('s.weapon = ?'); params.push(weapon); }
  if (category) { where.push('s.category = ?'); params.push(category); }
  if (rarity) { where.push('s.rarity = ?'); params.push(rarity); }
  if (wear) { where.push('s.wear = ?'); params.push(wear); }
  if (search) { where.push("s.name LIKE ?"); params.push(`%${search}%`); }
  if (minPrice) { where.push('p.steam >= ?'); params.push(parseFloat(minPrice)); }
  if (maxPrice) { where.push('p.steam <= ?'); params.push(parseFloat(maxPrice)); }

  const allowedSort = { name: 's.name', price: 'p.steam', volume: 'p.volume' };
  const sortCol = allowedSort[sort] || 's.name';
  const sortDir = order === 'desc' ? 'DESC' : 'ASC';

  const skins = db.prepare(`
    SELECT s.*, p.steam, p.buff163, p.csfloat, p.skinport, p.dmarket, p.volume, p.timestamp as price_updated
    FROM skins s
    LEFT JOIN skin_prices p ON p.skin_id = s.id
    WHERE ${where.join(' AND ')}
    GROUP BY s.id
    ORDER BY ${sortCol} ${sortDir}
  `).all(params);

  // Calcular cambio 24h y score para cada skin
  const result = skins.map(skin => {
    const history = db.prepare(
      "SELECT price FROM price_history WHERE skin_id = ? AND platform = 'steam' ORDER BY date DESC LIMIT 2"
    ).all(skin.id);

    const change24h = history.length >= 2
      ? ((history[0].price - history[1].price) / history[1].price) * 100
      : 0;

    return {
      ...skin,
      change24h: Math.round(change24h * 100) / 100,
      lowestPlatform: getLowestPlatform(skin)
    };
  });

  res.json({ data: result, total: result.length });
});

// GET /api/skins/:id — detalle completo
router.get('/:id', (req, res) => {
  const db = getDB();
  const skin = db.prepare(`
    SELECT s.*, p.steam, p.buff163, p.csfloat, p.skinport, p.dmarket, p.volume
    FROM skins s
    LEFT JOIN skin_prices p ON p.skin_id = s.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!skin) return res.status(404).json({ error: 'Skin no encontrada' });

  const priceHistory = db.prepare(
    "SELECT platform, price, volume, date FROM price_history WHERE skin_id = ? ORDER BY date ASC"
  ).all(req.params.id);

  const steamHistory = priceHistory.filter(h => h.platform === 'steam');
  const recommendation = calculateBuyScore(steamHistory, skin);

  // Stats
  const steamPrices = steamHistory.map(h => h.price);
  const stats = {
    min30d: Math.min(...steamHistory.slice(-30).map(h => h.price)),
    max30d: Math.max(...steamHistory.slice(-30).map(h => h.price)),
    min90d: Math.min(...steamPrices),
    max90d: Math.max(...steamPrices),
    avg30d: average(steamHistory.slice(-30).map(h => h.price)),
  };

  res.json({ skin, priceHistory, recommendation, stats });
});

// GET /api/skins/:id/history
router.get('/:id/history', (req, res) => {
  const db = getDB();
  const { platform = 'steam', days = 90 } = req.query;
  const history = db.prepare(
    "SELECT price, volume, date FROM price_history WHERE skin_id = ? AND platform = ? ORDER BY date ASC LIMIT ?"
  ).all(req.params.id, platform, parseInt(days));
  res.json(history);
});

function getLowestPlatform(skin) {
  const platforms = [
    { name: 'buff163', price: skin.buff163 },
    { name: 'csfloat', price: skin.csfloat },
    { name: 'dmarket', price: skin.dmarket },
    { name: 'skinport', price: skin.skinport },
    { name: 'steam', price: skin.steam }
  ].filter(p => p.price > 0).sort((a, b) => a.price - b.price);
  return platforms[0] || { name: 'steam', price: skin.steam };
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

module.exports = router;
