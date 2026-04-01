const express = require('express');
const router = express.Router();
const { getDB } = require('../db/database');
const { calculateBuyScore } = require('../services/recommendation');

const PLATFORM_FEES = {
  steam: 0.15, buff163: 0.025, csfloat: 0.02, skinport: 0.12, dmarket: 0.05
};
const PLATFORM_NAMES = {
  steam: 'Steam Market', buff163: 'Buff163', csfloat: 'CSFloat', skinport: 'Skinport', dmarket: 'DMarket'
};
const PLATFORM_URLS = {
  steam: 'https://steamcommunity.com/market/',
  buff163: 'https://buff.163.com',
  csfloat: 'https://csfloat.com/market',
  skinport: 'https://skinport.com/market',
  dmarket: 'https://dmarket.com/ingame-items/item-list/csgo-skins'
};

// GET /api/action-plan?capital=100
router.get('/', (req, res) => {
  try {
    const db = getDB();
    const capital = parseFloat(req.query.capital) || 200;

    // Limitar a top 500 skins por precio — suficiente para buenas recomendaciones
    const skins = db.prepare(`
      SELECT s.*, sp.steam, sp.buff163, sp.csfloat, sp.skinport, sp.dmarket
      FROM skins s
      LEFT JOIN skin_prices sp ON s.id = sp.skin_id
      WHERE sp.steam >= 2.0
      ORDER BY sp.steam DESC
      LIMIT 500
    `).all();

    if (skins.length === 0) return res.json({ plans: [], totalCapital: capital });

    // Batch: traer historial solo de las skins que vamos a analizar
    const ids = skins.map(s => `'${s.id.replace(/'/g, "''")}'`).join(',');
    const history = db.prepare(
      `SELECT skin_id, date, price, volume FROM price_history WHERE skin_id IN (${ids}) ORDER BY skin_id, date`
    ).all();

    // Agrupar historial por skin
    const historyMap = {};
    for (const h of history) {
      if (!historyMap[h.skin_id]) historyMap[h.skin_id] = [];
      historyMap[h.skin_id].push(h);
    }

    const plans = [];

    for (const skin of skins) {
      const ph = historyMap[skin.id] || [];
      if (ph.length < 14) continue;

      const prices = { steam: skin.steam, buff163: skin.buff163, csfloat: skin.csfloat, skinport: skin.skinport, dmarket: skin.dmarket };
      const rec = calculateBuyScore(ph, prices);

      if (rec.label !== 'COMPRAR') continue;

      // Excluir buff163 de las opciones de compra (mercado chino, menor fiabilidad)
      const buyOptions = Object.entries(prices)
        .filter(([p, price]) => p !== 'buff163' && price && price > 0)
        .sort(([, a], [, b]) => a - b);
      const [buyPlatform, buyPrice] = buyOptions[0];

      // ── Mejor plataforma de VENTA (mayor ingreso neto) ────────────────────────
      const sellOptions = Object.entries(prices)
        .filter(([p, price]) => p !== 'buff163' && price && price > 0)
        .map(([platform, price]) => ({
          platform,
          price,
          netRevenue: Math.round(price * (1 - PLATFORM_FEES[platform]) * 100) / 100
        }))
        .sort((a, b) => b.netRevenue - a.netRevenue);
      const bestSell = sellOptions[0];

      // ── Precio objetivo (máximo de 30 días del historial) ────────────────────
      const last30Prices = ph.slice(-30).map(h => h.price);
      const last90Prices = ph.slice(-90).map(h => h.price);
      const max30 = Math.max(...last30Prices);
      const max90 = Math.max(...last90Prices);
      const avg90 = last90Prices.reduce((a, b) => a + b, 0) / last90Prices.length;

      // Objetivo conservador: media de 30d high y 90d avg
      const targetSellPrice = Math.round(((max30 + avg90) / 2) * 100) / 100;
      const targetNetRevenue = Math.round(targetSellPrice * (1 - PLATFORM_FEES[bestSell.platform]) * 100) / 100;

      // ── Stop-loss: 8% por debajo del precio de compra ─────────────────────────
      const stopLoss = Math.round(buyPrice * 0.92 * 100) / 100;

      // ── Cálculo de beneficio ──────────────────────────────────────────────────
      const grossProfit = targetNetRevenue - buyPrice;
      const roiPct = Math.round((grossProfit / buyPrice) * 1000) / 10;

      // ── Horizonte temporal estimado ──────────────────────────────────────────
      const distanceToTarget = targetSellPrice > buyPrice ? (targetSellPrice - buyPrice) / buyPrice : 0;
      let horizon, horizonDays;
      if (distanceToTarget < 0.08) { horizon = '1-2 semanas'; horizonDays = 10; }
      else if (distanceToTarget < 0.15) { horizon = '2-4 semanas'; horizonDays = 21; }
      else if (distanceToTarget < 0.30) { horizon = '1-3 meses'; horizonDays = 60; }
      else { horizon = '3-6 meses'; horizonDays = 120; }

      // ── Unidades recomendadas con el capital disponible ───────────────────────
      // No meter más del 25% del capital en una sola skin (diversificación)
      const maxPerSkin = capital * 0.25;
      const recommendedUnits = Math.max(1, Math.floor(maxPerSkin / buyPrice));
      const totalInvestment = Math.round(recommendedUnits * buyPrice * 100) / 100;
      const totalProfit = Math.round(recommendedUnits * grossProfit * 100) / 100;
      const annualROI = Math.round((roiPct / horizonDays) * 365 * 10) / 10;

      // ── Score compuesto para ranking ──────────────────────────────────────────
      // Prioriza ROI anualizado y score de recomendación
      const compositeScore = (rec.score * 0.4) + (Math.min(annualROI, 200) * 0.4) + ((1 / (rec.riskLevel === 'bajo' ? 1 : rec.riskLevel === 'medio' ? 1.5 : 2.5)) * 20);

      plans.push({
        rank: 0, // se asigna después de ordenar
        skin: {
          id: skin.id,
          name: skin.name,
          weapon: skin.weapon,
          category: skin.category,
          rarity: skin.rarity,
          wear: skin.wear,
          image_url: skin.image_url
        },
        recommendation: {
          score: rec.score,
          label: rec.label,
          riskLevel: rec.riskLevel,
          reasons: rec.reasons
        },
        action: {
          // COMPRA
          buy: {
            platform: buyPlatform,
            platformName: PLATFORM_NAMES[buyPlatform],
            platformUrl: PLATFORM_URLS[buyPlatform],
            price: buyPrice,
            fee: `${(PLATFORM_FEES[buyPlatform] * 100).toFixed(1)}%`
          },
          // VENTA
          sell: {
            platform: bestSell.platform,
            platformName: PLATFORM_NAMES[bestSell.platform],
            platformUrl: PLATFORM_URLS[bestSell.platform],
            targetPrice: targetSellPrice,
            netRevenue: targetNetRevenue,
            fee: `${(PLATFORM_FEES[bestSell.platform] * 100).toFixed(1)}%`
          },
          // SEGURIDAD
          stopLoss,
          // TIMING
          horizon,
          horizonDays,
          // CAPITAL
          recommendedUnits,
          totalInvestment,
          totalProfit,
          // RENTABILIDAD
          roiPct,
          annualROI,
          grossProfitPerUnit: Math.round(grossProfit * 100) / 100
        },
        steps: buildSteps(skin.name, buyPlatform, buyPrice, bestSell.platform, targetSellPrice, targetNetRevenue, stopLoss, horizon, recommendedUnits),
        compositeScore: Math.round(compositeScore * 10) / 10
      });
    }

    // Ordenar por compositeScore y asignar ranking
    plans.sort((a, b) => b.compositeScore - a.compositeScore);
    plans.forEach((p, i) => { p.rank = i + 1; });

    // Resumen del mercado
    const totalOpportunities = plans.length;
    const avgROI = plans.length > 0
      ? Math.round(plans.slice(0, 5).reduce((s, p) => s + p.action.roiPct, 0) / Math.min(5, plans.length) * 10) / 10
      : 0;

    const marketPulse = avgROI > 15 ? 'ALCISTA' : avgROI > 5 ? 'NEUTRO' : 'BAJISTA';
    const marketPulseColor = avgROI > 15 ? 'green' : avgROI > 5 ? 'yellow' : 'red';
    const marketAdvice = avgROI > 15
      ? 'Buen momento para invertir. Hay oportunidades claras de beneficio.'
      : avgROI > 5
      ? 'Mercado lateral. Invierte solo en las mejores oportunidades.'
      : 'Mercado bajista. Mantén posiciones pequeñas y espera rebote.';

    // Distribución óptima del capital
    const topPlans = plans.slice(0, 5);
    const capitalAllocation = distributeCapital(capital, topPlans);

    res.json({
      marketSummary: {
        pulse: marketPulse,
        pulseColor: marketPulseColor,
        advice: marketAdvice,
        totalOpportunities,
        avgROI,
        bestROI: plans[0]?.action.roiPct || 0,
        timestamp: new Date().toISOString()
      },
      capitalAllocation,
      plans: plans.slice(0, 7)
    });
  } catch (err) {
    console.error('[ActionPlan]', err);
    res.status(500).json({ error: err.message });
  }
});

function buildSteps(name, buyPlatform, buyPrice, sellPlatform, targetPrice, netRevenue, stopLoss, horizon, units) {
  const unitStr = units > 1 ? `${units} unidades de ` : '';
  const totalBuy = Math.round(units * buyPrice * 100) / 100;
  const totalNet = Math.round(units * netRevenue * 100) / 100;
  const profit = Math.round((totalNet - totalBuy) * 100) / 100;

  return [
    {
      step: 1,
      icon: '🔍',
      title: 'Busca la skin',
      description: `Busca "${name}" en ${PLATFORM_NAMES[buyPlatform]}`,
      url: PLATFORM_URLS[buyPlatform],
      detail: `Precio objetivo de compra: ≤ €${buyPrice}`
    },
    {
      step: 2,
      icon: '🛒',
      title: 'Compra ahora',
      description: `Compra ${unitStr}"${name}" por €${totalBuy} total en ${PLATFORM_NAMES[buyPlatform]}`,
      url: PLATFORM_URLS[buyPlatform],
      detail: `${units > 1 ? units + ' × ' : ''}€${buyPrice} = €${totalBuy} inversión total`
    },
    {
      step: 3,
      icon: '⏳',
      title: `Espera ${horizon}`,
      description: `Mantén la skin y espera a que el precio suba a €${targetPrice}`,
      detail: `Si el precio cae por debajo de €${stopLoss}, considera vender para limitar pérdidas (stop-loss)`
    },
    {
      step: 4,
      icon: '💸',
      title: 'Vende cuando llegue al objetivo',
      description: `Vende en ${PLATFORM_NAMES[sellPlatform]} cuando el precio llegue a €${targetPrice}`,
      url: PLATFORM_URLS[sellPlatform],
      detail: `Recibirás €${totalNet} netos (después del fee). Beneficio: +€${profit}`
    }
  ];
}

function distributeCapital(capital, plans) {
  if (!plans.length) return [];

  // Ponderación por compositeScore normalizado
  const totalScore = plans.reduce((s, p) => s + p.compositeScore, 0);
  return plans.map(p => {
    const weight = p.compositeScore / totalScore;
    const allocated = Math.round(capital * weight * 100) / 100;
    const units = Math.max(1, Math.floor(allocated / p.action.buy.price));
    const actualInvest = Math.round(units * p.action.buy.price * 100) / 100;
    const expectedProfit = Math.round(units * p.action.grossProfitPerUnit * 100) / 100;
    return {
      skinId: p.skin.id,
      skinName: p.skin.name,
      image_url: p.skin.image_url,
      allocated,
      units,
      actualInvest,
      buyPlatform: p.action.buy.platformName,
      buyPrice: p.action.buy.price,
      sellPlatform: p.action.sell.platformName,
      targetPrice: p.action.sell.targetPrice,
      expectedProfit,
      roiPct: p.action.roiPct,
      horizon: p.action.horizon,
      rank: p.rank
    };
  });
}

module.exports = router;
