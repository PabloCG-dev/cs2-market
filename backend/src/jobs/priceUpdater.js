const { getDB } = require('../db/database');

function runPriceUpdate() {
  const db = getDB();
  const skins = db.prepare('SELECT id FROM skins').all();

  const updatePrice = db.prepare(
    'UPDATE skin_prices SET steam=?, buff163=?, csfloat=?, skinport=?, dmarket=?, timestamp=CURRENT_TIMESTAMP WHERE skin_id=?'
  );
  const insertHistory = db.prepare(
    "INSERT INTO price_history (skin_id, platform, price, volume, date) VALUES (?, ?, ?, ?, date('now'))"
  );

  try {
    db.exec('BEGIN');
    for (const { id } of skins) {
      const current = db.prepare('SELECT steam, buff163, csfloat, skinport, dmarket, volume FROM skin_prices WHERE skin_id=?').get(id);
      if (!current) continue;

      const factor = 1 + (Math.random() - 0.5) * 0.04;
      const newSteam = Math.round(current.steam * factor * 100) / 100;
      const newBuff = Math.round(newSteam * 0.76 * 100) / 100;
      const newCsFloat = Math.round(newSteam * 0.81 * 100) / 100;
      const newSkinport = Math.round(newSteam * 0.87 * 100) / 100;
      const newDmarket = Math.round(newSteam * 0.84 * 100) / 100;

      updatePrice.run(newSteam, newBuff, newCsFloat, newSkinport, newDmarket, id);

      const todayEntry = db.prepare(
        "SELECT id FROM price_history WHERE skin_id=? AND platform='steam' AND date=date('now')"
      ).get(id);
      if (!todayEntry) {
        insertHistory.run(id, 'steam', newSteam, current.volume || 30, null);
      }
    }
    db.exec('COMMIT');
    console.log(`[CRON] Precios actualizados para ${skins.length} skins`);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('[CRON] Error actualizando precios:', err.message);
  }
}

module.exports = { runPriceUpdate };
