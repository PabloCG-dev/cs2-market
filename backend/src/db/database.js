const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { SKINS_DATA, CASES_DATA } = require('../data/skins');

const DB_PATH = path.join(process.cwd(), 'cs2market.db');

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initializeDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS skins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      weapon TEXT NOT NULL,
      category TEXT NOT NULL,
      rarity TEXT NOT NULL,
      wear TEXT,
      image_url TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skin_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skin_id TEXT NOT NULL,
      steam REAL,
      buff163 REAL,
      csfloat REAL,
      skinport REAL,
      dmarket REAL,
      volume INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (skin_id) REFERENCES skins(id)
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skin_id TEXT NOT NULL,
      platform TEXT NOT NULL DEFAULT 'steam',
      price REAL NOT NULL,
      volume INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      FOREIGN KEY (skin_id) REFERENCES skins(id)
    );

    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skin_id TEXT NOT NULL,
      wear TEXT,
      float_value REAL,
      pattern_id INTEGER,
      purchase_price REAL NOT NULL,
      purchase_platform TEXT NOT NULL DEFAULT 'steam',
      purchase_date TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (skin_id) REFERENCES skins(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skin_id TEXT NOT NULL,
      wear TEXT,
      platform TEXT DEFAULT 'steam',
      target_price REAL NOT NULL,
      condition TEXT NOT NULL CHECK(condition IN ('below','above')),
      active INTEGER DEFAULT 1,
      triggered_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (skin_id) REFERENCES skins(id)
    );

    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      image_url TEXT,
      current_price REAL,
      is_active INTEGER DEFAULT 1,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS case_price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id TEXT NOT NULL,
      price REAL NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (case_id) REFERENCES cases(id)
    );

    -- Índices para acelerar las queries de recomendaciones y action-plan
    CREATE INDEX IF NOT EXISTS idx_skin_prices_steam ON skin_prices(steam);
    CREATE INDEX IF NOT EXISTS idx_skin_prices_skin_id ON skin_prices(skin_id);
    CREATE INDEX IF NOT EXISTS idx_price_history_skin_id ON price_history(skin_id);
    CREATE INDEX IF NOT EXISTS idx_price_history_platform ON price_history(platform);
  `);

  // Populate with seed data if empty
  const skinCount = db.prepare('SELECT COUNT(*) as c FROM skins').get().c;
  if (skinCount === 0) {
    console.log('[DB] Cargando datos iniciales...');
    seedSkins(db);
    seedCases(db);
    console.log('[DB] Datos cargados correctamente');
  }
}

function seedSkins(db) {
  const insertSkin = db.prepare(
    'INSERT OR IGNORE INTO skins (id, name, weapon, category, rarity, wear, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertPrice = db.prepare(
    'INSERT INTO skin_prices (skin_id, steam, buff163, csfloat, skinport, dmarket, volume) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertHistory = db.prepare(
    'INSERT INTO price_history (skin_id, platform, price, volume, date) VALUES (?, ?, ?, ?, ?)'
  );

  db.exec('BEGIN');
  try {
    for (const skin of SKINS_DATA) {
      insertSkin.run(skin.id, skin.name, skin.weapon, skin.category, skin.rarity, skin.wear, skin.image_url);
      const p = skin.platforms;
      insertPrice.run(skin.id, p.steam, p.buff163, p.csfloat, p.skinport, p.dmarket, skin.volume);
      for (const h of skin.priceHistory) {
        insertHistory.run(skin.id, 'steam', h.price, h.volume || skin.volume, h.date);
        if (skin.platforms.buff163) {
          insertHistory.run(skin.id, 'buff163', h.price * 0.78 + (Math.random() - 0.5) * h.price * 0.02, h.volume || skin.volume, h.date);
        }
      }
    }
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}

function seedCases(db) {
  const insertCase = db.prepare(
    'INSERT OR IGNORE INTO cases (id, name, image_url, current_price, is_active, notes) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertCaseHistory = db.prepare(
    'INSERT INTO case_price_history (case_id, price, date) VALUES (?, ?, ?)'
  );

  db.exec('BEGIN');
  try {
    for (const c of CASES_DATA) {
      insertCase.run(c.id, c.name, c.image_url, c.currentPrice, c.isActive ? 1 : 0, c.notes);
      for (const h of c.priceHistory) {
        insertCaseHistory.run(c.id, h.price, h.date);
      }
    }
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
}

module.exports = { getDB, initializeDB };
