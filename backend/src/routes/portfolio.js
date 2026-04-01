const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

// GET /api/portfolio
router.get('/', (req, res) => {
  const db = getDB();
  const items = db.prepare(`
    SELECT p.*, s.name, s.weapon, s.image_url, s.rarity, s.category,
           sp.steam as current_price, sp.buff163, sp.csfloat, sp.skinport, sp.dmarket
    FROM portfolio p
    JOIN skins s ON s.id = p.skin_id
    LEFT JOIN skin_prices sp ON sp.skin_id = p.skin_id
    ORDER BY p.created_at DESC
  `).all();

  const enriched = items.map(item => {
    const totalInvested = item.purchase_price * item.quantity;
    const currentValue = (item.current_price || 0) * item.quantity;
    const pnl = currentValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
    // Mejor precio actual neto (después de fees)
    const bestSell = getBestSellPrice(item);
    // Señal de venta: beneficio neto real (precio venta neto - precio compra) vs inversión
    const realNetPnl = bestSell.price - item.purchase_price;
    const realNetPnlPct = item.purchase_price > 0 ? (realNetPnl / item.purchase_price) * 100 : 0;
    const sellSignal = realNetPnlPct >= 10 ? 'fuerte' : realNetPnlPct >= 5 ? 'moderada' : null;

    return {
      ...item,
      totalInvested: Math.round(totalInvested * 100) / 100,
      currentValue: Math.round(currentValue * 100) / 100,
      pnl: Math.round(pnl * 100) / 100,
      pnlPercent: Math.round(pnlPercent * 10) / 10,
      bestSellNetPrice: bestSell.price,
      bestSellPlatform: bestSell.platform,
      sellSignal,
      realNetPnlPct: Math.round(realNetPnlPct * 10) / 10
    };
  });

  res.json(enriched);
});

// GET /api/portfolio/summary
router.get('/summary', (req, res) => {
  const db = getDB();
  const items = db.prepare(`
    SELECT p.purchase_price, p.quantity, sp.steam as current_price
    FROM portfolio p LEFT JOIN skin_prices sp ON sp.skin_id = p.skin_id
  `).all();

  const totalInvested = items.reduce((s, i) => s + i.purchase_price * i.quantity, 0);
  const currentValue = items.reduce((s, i) => s + (i.current_price || 0) * i.quantity, 0);
  const totalPnL = currentValue - totalInvested;

  res.json({
    totalInvested: Math.round(totalInvested * 100) / 100,
    currentValue: Math.round(currentValue * 100) / 100,
    totalPnL: Math.round(totalPnL * 100) / 100,
    totalPnLPercent: totalInvested > 0 ? Math.round((totalPnL / totalInvested) * 1000) / 10 : 0,
    itemCount: items.length
  });
});

// POST /api/portfolio
router.post('/', (req, res) => {
  const db = getDB();
  const { skin_id, wear, float_value, pattern_id, purchase_price, purchase_platform, purchase_date, quantity, notes } = req.body;

  if (!skin_id || !purchase_price || !purchase_date) {
    return res.status(400).json({ error: 'skin_id, purchase_price y purchase_date son requeridos' });
  }

  const result = db.prepare(
    'INSERT INTO portfolio (skin_id, wear, float_value, pattern_id, purchase_price, purchase_platform, purchase_date, quantity, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(skin_id, wear, float_value, pattern_id, purchase_price, purchase_platform || 'steam', purchase_date, quantity || 1, notes);

  res.json({ id: result.lastInsertRowid, message: 'Skin añadida al portafolio' });
});

// PUT /api/portfolio/:id
router.put('/:id', (req, res) => {
  const db = getDB();
  const { purchase_price, quantity, notes, float_value, pattern_id } = req.body;
  db.prepare(
    'UPDATE portfolio SET purchase_price=?, quantity=?, notes=?, float_value=?, pattern_id=? WHERE id=?'
  ).run(purchase_price, quantity, notes, float_value, pattern_id, req.params.id);
  res.json({ message: 'Actualizado' });
});

// DELETE /api/portfolio/:id
router.delete('/:id', (req, res) => {
  getDB().prepare('DELETE FROM portfolio WHERE id = ?').run(req.params.id);
  res.json({ message: 'Eliminado' });
});

function getBestSellPrice(item) {
  const FEES = { steam: 0.15, buff163: 0.025, csfloat: 0.02, skinport: 0.12, dmarket: 0.05 };
  const platforms = ['steam', 'buff163', 'csfloat', 'skinport', 'dmarket'];
  let best = { platform: 'steam', price: 0 };
  for (const p of platforms) {
    if (item[p] > 0) {
      const net = item[p] * (1 - FEES[p]);
      if (net > best.price) best = { platform: p, price: Math.round(net * 100) / 100 };
    }
  }
  return best;
}

module.exports = router;
