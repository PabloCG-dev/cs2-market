const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

// GET /api/cases
router.get('/', (req, res) => {
  const db = getDB();
  const cases = db.prepare('SELECT * FROM cases ORDER BY current_price DESC').all();
  const result = cases.map(c => {
    const history = db.prepare(
      'SELECT price, date FROM case_price_history WHERE case_id = ? ORDER BY date ASC'
    ).all(c.id);

    const prices = history.map(h => h.price);
    const change30d = prices.length >= 30
      ? ((prices[prices.length - 1] - prices[prices.length - 30]) / prices[prices.length - 30]) * 100 : 0;
    const change90d = prices.length >= 90
      ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 : 0;

    // Score de inversión para cases
    const investScore = calculateCaseScore(c, change30d, change90d);

    return { ...c, history: history.slice(-30), change30d: Math.round(change30d * 10) / 10, change90d: Math.round(change90d * 10) / 10, investScore };
  });

  res.json(result);
});

// GET /api/cases/investment — mejores oportunidades
router.get('/investment', (req, res) => {
  const db = getDB();
  const cases = db.prepare('SELECT * FROM cases').all();
  const scored = cases.map(c => {
    const history = db.prepare(
      'SELECT price, date FROM case_price_history WHERE case_id = ? ORDER BY date ASC'
    ).all(c.id);
    const prices = history.map(h => h.price);
    const change30d = prices.length >= 30
      ? ((prices[prices.length - 1] - prices[prices.length - 30]) / prices[prices.length - 30]) * 100 : 0;
    const change90d = prices.length >= 3
      ? ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 : 0;
    return { ...c, investScore: calculateCaseScore(c, change30d, change90d), change30d, change90d };
  }).sort((a, b) => b.investScore - a.investScore);

  res.json(scored);
});

function calculateCaseScore(c, change30d, change90d) {
  let score = 0;
  if (!c.is_active) score += 40; // Descontinuado = más escaso
  if (change30d > 5) score += 20;
  else if (change30d > 0) score += 10;
  if (change90d > 15) score += 25;
  else if (change90d > 5) score += 15;
  if (c.current_price < 2) score += 15; // Bajo precio = menor riesgo absoluto
  return Math.min(100, score);
}

module.exports = router;
