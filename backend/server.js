require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { initializeDB, getDB } = require('./src/db/database');
const { seedAllSkins } = require('./src/jobs/skinSeeder');
const skinsRouter = require('./src/routes/skins');
const portfolioRouter = require('./src/routes/portfolio');
const recommendationsRouter = require('./src/routes/recommendations');
const arbitrageRouter = require('./src/routes/arbitrage');
const alertsRouter = require('./src/routes/alerts');
const casesRouter = require('./src/routes/cases');
const imagesRouter = require('./src/routes/images');
const actionPlanRouter = require('./src/routes/actionplan');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:4173',
      process.env.FRONTEND_URL,         // tu URL de Vercel, p.ej. https://cs2-market.vercel.app
    ].filter(Boolean);
    if (!origin || allowed.some(a => origin.startsWith(a))) {
      callback(null, true);
    } else {
      callback(new Error(`CORS bloqueado: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/skins', skinsRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/arbitrage', arbitrageRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/cases', casesRouter);
app.use('/api/images', imagesRouter);
app.use('/api/action-plan', actionPlanRouter);

app.get('/api/health', (req, res) => {
  try {
    const skinCount = getDB().prepare('SELECT COUNT(*) as c FROM skins').get().c;
    res.json({ status: 'ok', skins: skinCount, timestamp: new Date().toISOString() });
  } catch {
    res.json({ status: 'starting', skins: 0, timestamp: new Date().toISOString() });
  }
});

// Actualización de precios cada hora
cron.schedule('0 * * * *', () => {
  console.log('[CRON] Actualizando precios...');
  runPriceUpdate();
});

async function start() {
  // Escuchar PRIMERO — Render necesita que el puerto responda rápido o mata el proceso
  app.listen(PORT, () => {
    console.log(`\n🎮 CS2 Market API corriendo en http://localhost:${PORT}`);
    console.log(`📊 Dashboard disponible en http://localhost:5173\n`);
  });

  // Inicializar BD en background para no bloquear el puerto
  setTimeout(() => {
    try {
      initializeDB();
      console.log('[DB] Inicializada correctamente');
    } catch (err) {
      console.error('[DB] Error al inicializar:', err.message);
    }
  }, 100);

  // Cargar catálogo completo en background (no bloquea el servidor)
  setTimeout(async () => {
    try {
      const before = getDB().prepare('SELECT COUNT(*) as c FROM skins').get().c;
      console.log(`[Startup] BD tiene ${before} skins. Descargando catálogo completo...`);
      await seedAllSkins();
    } catch (err) {
      console.warn('[Startup] No se pudo cargar el catálogo completo:', err.message);
      console.log('[Startup] Continuando con las skins ya cargadas en la BD.');
    }
  }, 2000);
}

start();
