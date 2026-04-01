const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');

// GET /api/alerts
router.get('/', (req, res) => {
  const db = getDB();
  const alerts = db.prepare(`
    SELECT a.*, s.name as skin_name, s.image_url, sp.steam as current_price
    FROM alerts a JOIN skins s ON s.id = a.skin_id
    LEFT JOIN skin_prices sp ON sp.skin_id = a.skin_id
    ORDER BY a.created_at DESC
  `).all();
  res.json(alerts);
});

// POST /api/alerts
router.post('/', (req, res) => {
  const db = getDB();
  const { skin_id, wear, platform, target_price, condition } = req.body;
  if (!skin_id || !target_price || !condition) {
    return res.status(400).json({ error: 'skin_id, target_price y condition son requeridos' });
  }
  const result = db.prepare(
    'INSERT INTO alerts (skin_id, wear, platform, target_price, condition) VALUES (?, ?, ?, ?, ?)'
  ).run(skin_id, wear, platform || 'steam', target_price, condition);
  res.json({ id: result.lastInsertRowid, message: 'Alerta creada' });
});

// DELETE /api/alerts/:id
router.delete('/:id', (req, res) => {
  getDB().prepare('DELETE FROM alerts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Alerta eliminada' });
});

// GET /api/alerts/check — verifica alertas activadas
router.get('/check', (req, res) => {
  const db = getDB();
  const alerts = db.prepare(`
    SELECT a.*, s.name as skin_name, sp.steam as current_price
    FROM alerts a JOIN skins s ON s.id = a.skin_id
    LEFT JOIN skin_prices sp ON sp.skin_id = a.skin_id
    WHERE a.active = 1
  `).all();

  const triggered = [];
  for (const alert of alerts) {
    const price = alert.current_price;
    const hit = (alert.condition === 'below' && price <= alert.target_price) ||
                (alert.condition === 'above' && price >= alert.target_price);
    if (hit) {
      db.prepare("UPDATE alerts SET active=0, triggered_at=datetime('now') WHERE id=?").run(alert.id);
      triggered.push({ ...alert, triggeredAt: new Date().toISOString() });
    }
  }
  res.json({ triggered, count: triggered.length });
});

module.exports = router;
