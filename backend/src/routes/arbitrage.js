const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { findArbitrageOpportunities } = require('../services/arbitrage');

// GET /api/arbitrage
router.get('/', (req, res) => {
  const db = getDB();
  const minProfit = parseFloat(req.query.minProfit) || 3;

  const skins = db.prepare(`
    SELECT s.id, s.name, s.image_url, s.category,
           p.steam, p.buff163, p.csfloat, p.skinport, p.dmarket, p.volume
    FROM skins s LEFT JOIN skin_prices p ON p.skin_id = s.id
  `).all();

  const opportunities = findArbitrageOpportunities(skins)
    .filter(o => o.profitPercent >= minProfit);

  res.json({ data: opportunities, total: opportunities.length });
});

module.exports = router;
