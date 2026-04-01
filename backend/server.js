require('dotenv').config();

// Evitar que cualquier error inesperado mate el proceso
process.on('uncaughtException', (err) => {
  console.error('[CRASH PREVENIDO] uncaughtException:', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('[CRASH PREVENIDO] unhandledRejection:', reason);
});

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
    // Permitir: sin origin (curl/Postman), localhost, cualquier subdominio de vercel.app
    if (!origin || origin.includes('localhost') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(new Error(`CORS bloqueado: ${origin}`));
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
  try { runPriceUpdate(); } catch(e) { console.error('[CRON] Error:', e.message); }
});

// Middleware de errores global — nunca deja que un error 500 se propague sin respuesta
app.use((err, req, res, next) => {
  console.error('[EXPRESS ERROR]', err.message);
  if (!res.headersSent) res.status(500).json({ error: 'Error interno del servidor' });
});

async function start() {
  // Escuchar PRIMERO — Render necesita que el puerto responda rápido o mata el proceso
  app.listen(PORT, () => {
    console.log(`\n🎮 CS2 Market API corriendo en http://localhost:${PORT}`);
    console.log(`[Startup] Puerto ${PORT} abierto. Inicializando BD en background...`);
  });

  // Inicializar BD en background para no bloquear el puerto
  setTimeout(() => {
    try {
      initializeDB();
      console.log('[DB] Inicializada correctamente');
    } catch (err) {
      console.error('[DB] Error al inicializar:', err.message, err.stack);
    }
  }, 100);

  // Cargar catálogo completo en background (no bloquea el servidor)
  setTimeout(async () => {
    try {
      const before = getDB().prepare('SELECT COUNT(*) as c FROM skins').get().c;
      console.log(`[Seeder] BD tiene ${before} skins. ${before < 1000 ? 'Descargando catálogo completo...' : 'Catálogo ya cargado, verificando novedades...'}`);
      await seedAllSkins();
      const after = getDB().prepare('SELECT COUNT(*) as c FROM skins').get().c;
      console.log(`[Seeder] Completado. Total skins: ${after}`);
    } catch (err) {
      console.error('[Seeder] Error (servidor sigue activo):', err.message, err.stack);
    }
  }, 2000);
}

start();
