/**
 * Motor de recomendaciones de inversión para CS2 skins
 * Score 0-100 basado en múltiples factores
 */

function calculateBuyScore(priceHistory, currentPrices) {
  if (!priceHistory || priceHistory.length < 7) {
    return { score: 50, label: 'ESPERAR', color: 'yellow', reasons: ['Datos insuficientes'], estimatedROI: 0, riskLevel: 'medio' };
  }

  const prices = priceHistory.map(h => h.price).filter(p => p > 0);
  const steamPrice = currentPrices?.steam || prices[prices.length - 1];

  // ── 1. Posición vs mínimo de 30 días (30 pts) ──────────────────────────────
  const last30 = prices.slice(-30);
  const min30 = Math.min(...last30);
  const max30 = Math.max(...last30);
  const range30 = max30 - min30;
  const positionScore30 = range30 > 0
    ? Math.max(0, 30 * (1 - (steamPrice - min30) / range30))
    : 15;

  // ── 2. Tendencia MA7 vs MA30 (25 pts) ──────────────────────────────────────
  const ma7 = average(prices.slice(-7));
  const ma30 = average(prices.slice(-30));
  const ma90 = average(prices.slice(-90));

  let trendScore = 0;
  const trendRatio = ma30 > 0 ? (ma30 - ma7) / ma30 : 0;
  if (trendRatio > 0.05) trendScore = 25;       // MA7 muy por debajo de MA30 = precio cayendo = oportunidad compra
  else if (trendRatio > 0.02) trendScore = 18;
  else if (trendRatio > 0) trendScore = 12;
  else if (trendRatio > -0.02) trendScore = 8;
  else trendScore = 3; // precio subiendo rápido = tarde para comprar

  // ── 3. Liquidez/Volumen (25 pts) ───────────────────────────────────────────
  const avgVolume = average(priceHistory.slice(-30).map(h => h.volume || 10));
  const volumeScore = Math.min(25, Math.log10(avgVolume + 1) * 12);

  // ── 4. Volatilidad (20 pts) — menor volatilidad = más seguro ───────────────
  const stdDev = standardDeviation(last30);
  const volatility = ma30 > 0 ? stdDev / ma30 : 1;
  const volatilityScore = Math.max(0, 20 - volatility * 150);

  const totalScore = Math.round(positionScore30 + trendScore + volumeScore + volatilityScore);
  const score = Math.min(100, Math.max(0, totalScore));

  // ── ROI estimado a 30 días ──────────────────────────────────────────────────
  const estimatedROI = estimateROI(steamPrice, ma30, ma90, trendRatio);

  // ── Razones ────────────────────────────────────────────────────────────────
  const reasons = buildReasons(steamPrice, min30, max30, ma7, ma30, trendRatio, volatility, avgVolume);

  // ── Label ──────────────────────────────────────────────────────────────────
  let label, color;
  if (score >= 70) { label = 'COMPRAR'; color = 'green'; }
  else if (score >= 40) { label = 'ESPERAR'; color = 'yellow'; }
  else { label = 'EVITAR'; color = 'red'; }

  const riskLevel = volatility < 0.1 ? 'bajo' : volatility < 0.2 ? 'medio' : 'alto';

  return { score, label, color, reasons, estimatedROI: Math.round(estimatedROI * 10) / 10, riskLevel };
}

function estimateROI(currentPrice, ma30, ma90, trendRatio) {
  if (ma30 <= 0) return 0;
  // Si precio por debajo de la media de 90 días, el retorno esperado es volver a la media
  const meanReversionROI = ((ma90 - currentPrice) / currentPrice) * 100;
  // Ajustar por tendencia
  const trendBonus = trendRatio * 50;
  return Math.max(-20, Math.min(80, meanReversionROI + trendBonus));
}

function buildReasons(price, min30, max30, ma7, ma30, trendRatio, volatility, volume) {
  const reasons = [];
  if (price <= min30 * 1.03) reasons.push('🎯 Precio en mínimo de 30 días');
  else if (price >= max30 * 0.97) reasons.push('⚠️ Precio en máximo de 30 días');
  if (trendRatio > 0.05) reasons.push('📉 Corrección de precio — posible rebote');
  else if (trendRatio > 0.02) reasons.push('📊 Ligera tendencia bajista — momento favorable');
  else if (trendRatio < -0.05) reasons.push('📈 Precio en tendencia alcista fuerte');
  if (volatility < 0.08) reasons.push('🔒 Baja volatilidad — inversión segura');
  else if (volatility > 0.2) reasons.push('⚡ Alta volatilidad — mayor riesgo');
  if (volume > 50) reasons.push('💧 Alta liquidez — fácil de vender');
  else if (volume < 10) reasons.push('🔴 Baja liquidez — difícil de vender');
  if (ma30 > 0 && price < ma30 * 0.92) reasons.push('💰 Precio un 8%+ por debajo de la media mensual');
  return reasons.length > 0 ? reasons : ['ℹ️ Precio estable, sin señales claras'];
}

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function standardDeviation(arr) {
  const avg = average(arr);
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

module.exports = { calculateBuyScore };
