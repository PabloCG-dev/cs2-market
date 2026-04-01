const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { calculateBuyScore } = require('../services/recommendation');

// GET /api/recommendations — top recomendaciones
router.get('/', (req, res) => {
  const db = getDB();
  const limit = parseInt(req.query.limit) || 20;

  // Limitar a top 400 skins por precio para que la query sea rápida en Render free tier
  const skins = db.prepare(`
    SELECT s.*, p.steam, p.buff163, p.csfloat, p.skinport, p.dmarket, p.volume
    FROM skins s LEFT JOIN skin_prices p ON p.skin_id = s.id
    WHERE p.steam >= 2.0
    ORDER BY p.steam DESC
    LIMIT 400
  `).all();

  if (skins.length === 0) return res.json([]);

  // Batch: traer el historial de todas las skins de una sola query
  const ids = skins.map(s => `'${s.id.replace(/'/g, "''")}'`).join(',');
  const allHistory = db.prepare(
    `SELECT skin_id, price, volume, date FROM price_history WHERE skin_id IN (${ids}) AND platform = 'steam' ORDER BY skin_id, date ASC`
  ).all();

  const historyMap = {};
  for (const h of allHistory) {
    if (!historyMap[h.skin_id]) historyMap[h.skin_id] = [];
    historyMap[h.skin_id].push(h);
  }

  const recommendations = skins.map(skin => {
    const history = historyMap[skin.id] || [];
    const rec = calculateBuyScore(history, skin);
    return { ...skin, recommendation: rec };
  })
  .filter(s => s.recommendation.label === 'COMPRAR')
  .sort((a, b) => b.recommendation.score - a.recommendation.score)
  .slice(0, limit);

  res.json(recommendations);
});

// GET /api/recommendations/:skinId
router.get('/:skinId', (req, res) => {
  const db = getDB();
  const skin = db.prepare(`
    SELECT s.*, p.steam, p.buff163, p.csfloat, p.skinport, p.dmarket, p.volume
    FROM skins s LEFT JOIN skin_prices p ON p.skin_id = s.id WHERE s.id = ?
  `).get(req.params.skinId);

  if (!skin) return res.status(404).json({ error: 'Skin no encontrada' });

  const history = db.prepare(
    "SELECT price, volume, date FROM price_history WHERE skin_id = ? AND platform = 'steam' ORDER BY date ASC"
  ).all(req.params.skinId);

  const recommendation = calculateBuyScore(history, skin);
  res.json({ skin, recommendation });
});

module.exports = router;
