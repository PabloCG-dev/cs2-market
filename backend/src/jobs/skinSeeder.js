/**
 * Descarga el catálogo completo de CS2 skins desde ByMykel/CSGO-API
 * y popula la base de datos con TODAS las skins + historial de precios simulado.
 *
 * ~1000-1500 diseños × wears disponibles = ~4000-6000 skins en total.
 * Las imágenes vienen directamente del CDN de Steam via ByMykel.
 */

const axios = require('axios');
const { getDB } = require('../db/database');

// Precios base por rareza (rango Steam realista en euros)
const RARITY_PRICES = {
  'consumer_grade':    { min: 0.03,  max: 0.25  },
  'industrial_grade':  { min: 0.06,  max: 1.50  },
  'mil_spec_grade':    { min: 0.20,  max: 10.00 },
  'restricted':        { min: 0.80,  max: 35.00 },
  'classified':        { min: 3.00,  max: 120.00},
  'covert':            { min: 18.00, max: 700.00 },
  'extraordinary':     { min: 50.00, max: 2500.00},
  'contraband':        { min: 800.00,max: 2000.00},
};

// Multiplicador de precio por desgaste
const WEAR_MULT = {
  'factory_new':    { mult: 1.00, code: 'FN' },
  'minimal_wear':   { mult: 0.78, code: 'MW' },
  'field_tested':   { mult: 0.62, code: 'FT' },
  'well_worn':      { mult: 0.52, code: 'WW' },
  'battle_scarred': { mult: 0.44, code: 'BS' },
};

function randBetween(min, max) {
  return min + Math.random() * (max - min);
}

function platforms(steam) {
  const j = () => 1 + (Math.random() - 0.5) * 0.04;
  return {
    steam:    Math.round(steam * 100) / 100,
    buff163:  Math.round(steam * 0.76 * j() * 100) / 100,
    csfloat:  Math.round(steam * 0.81 * j() * 100) / 100,
    skinport: Math.round(steam * 0.87 * j() * 100) / 100,
    dmarket:  Math.round(steam * 0.84 * j() * 100) / 100,
  };
}

function generateHistory(basePrice, days = 90) {
  const history = [];
  let price = basePrice * (0.88 + Math.random() * 0.24);
  const now = new Date();
  const vol = Math.max(0.04, Math.min(0.13, 0.06 + Math.random() * 0.05));
  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const noise = (Math.random() + Math.random() + Math.random() - 1.5) * vol;
    const spike = Math.random() < 0.07 ? (Math.random() - 0.45) * 0.18 : 0;
    price = Math.max(basePrice * 0.25, price * (1 + 0.0004 + noise + spike));
    history.push({
      date: d.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100,
      volume: Math.floor(Math.random() * 60 + 3),
    });
  }
  return history;
}

function makeId(name, wearId) {
  const slug = name
    .toLowerCase()
    .replace(/★\s*/g, 'knife-')
    .replace(/\s*\|\s*/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 55);
  return `${slug}-${wearId.replace(/_/g, '-')}`;
}

async function seedAllSkins() {
  const db = getDB();

  console.log('[SkinSeeder] 🌐 Descargando catálogo completo de CS2 desde ByMykel CSGO-API...');

  const res = await axios.get(
    'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json',
    { timeout: 30000, headers: { 'User-Agent': 'cs2-market-app/1.0' } }
  );

  const catalog = res.data;
  if (!Array.isArray(catalog)) throw new Error('Formato inesperado de la API');

  console.log(`[SkinSeeder] ${catalog.length} diseños en el catálogo. Generando todas las variantes de desgaste...`);

  const insertSkin    = db.prepare('INSERT OR IGNORE INTO skins (id, name, weapon, category, rarity, wear, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertPrice   = db.prepare('INSERT OR IGNORE INTO skin_prices (skin_id, steam, buff163, csfloat, skinport, dmarket, volume) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertHistory = db.prepare('INSERT INTO price_history (skin_id, platform, price, volume, date) VALUES (?, ?, ?, ?, ?)');

  // IDs ya existentes (para no duplicar ni historia)
  const existingIds = new Set(db.prepare('SELECT id FROM skins').all().map(s => s.id));

  let inserted = 0;
  let batchCount = 0;

  db.exec('BEGIN');
  try {
    for (const item of catalog) {
      if (!item.name || !item.weapon?.name || !item.rarity?.id) continue;

      const rarityId   = item.rarity.id;
      const rarityName = item.rarity.name || 'Unknown';
      const weaponName = item.weapon.name;
      const categoryId = item.category?.id || 'normal';
      const priceRange = RARITY_PRICES[rarityId] || RARITY_PRICES['mil_spec_grade'];

      // wears disponibles para esta skin según ByMykel
      const wears = (item.wears && item.wears.length > 0)
        ? item.wears
        : [{ id: 'field_tested', name: 'Field-Tested' }];

      for (const wear of wears) {
        const wearId    = wear.id || 'field_tested';
        const wearLabel = wear.name || 'Field-Tested';
        const wearInfo  = WEAR_MULT[wearId] || WEAR_MULT['field_tested'];

        // Nombre completo con desgaste
        const skinName = item.name.includes('(')
          ? item.name
          : `${item.name} (${wearLabel})`;

        const skinId = makeId(item.name, wearId);
        if (existingIds.has(skinId)) continue;
        existingIds.add(skinId);

        // Precio: aleatorio dentro del rango de rareza × multiplicador de desgaste
        const basePrice = Math.max(0.03, randBetween(priceRange.min, priceRange.max) * wearInfo.mult);
        const steamPrice = Math.round(basePrice * 100) / 100;
        const p = platforms(steamPrice);
        const vol = Math.floor(Math.random() * 80 + 5);

        // Usar imagen de ByMykel directamente (ya viene del CDN de Steam)
        const imageUrl = item.image || '';

        insertSkin.run(skinId, skinName, weaponName, categoryId, rarityName, wearInfo.code, imageUrl);
        insertPrice.run(skinId, p.steam, p.buff163, p.csfloat, p.skinport, p.dmarket, vol);

        // Solo generar historial para skins con precio >= 2€ (son las que se analizan)
        // Esto reduce los inserts de ~800k a ~75k — 10x menos carga
        if (steamPrice >= 2.0) {
          const history = generateHistory(steamPrice, 30); // 30 días es suficiente (mínimo requerido: 14)
          for (const h of history) {
            insertHistory.run(skinId, 'steam', h.price, h.volume, h.date);
          }
        }

        inserted++;
        batchCount++;

        // Commit parcial cada 300 skins + ceder el event loop para no bloquear HTTP
        if (batchCount >= 300) {
          db.exec('COMMIT');
          // Yield al event loop: las peticiones HTTP pendientes se procesan aquí
          await new Promise(resolve => setImmediate(resolve));
          db.exec('BEGIN');
          batchCount = 0;
          console.log(`[SkinSeeder]  ↳ ${inserted} skins procesadas...`);
        }
      }
    }
    db.exec('COMMIT');
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch (_) {}
    throw e;
  }

  const total = db.prepare('SELECT COUNT(*) as c FROM skins').get().c;
  console.log(`[SkinSeeder] ✅ Catálogo cargado: ${inserted} skins nuevas | ${total} skins totales en la BD`);
  return inserted;
}

module.exports = { seedAllSkins };
