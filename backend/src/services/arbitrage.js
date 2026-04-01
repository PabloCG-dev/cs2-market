// Fees por plataforma (porcentaje que se cobra al vender)
const PLATFORM_FEES = {
  steam: 0.15,     // 15% Steam + Valve
  buff163: 0.025,  // 2.5%
  csfloat: 0.02,   // 2%
  skinport: 0.12,  // 12%
  dmarket: 0.05    // 5%
};

const PLATFORM_LABELS = {
  steam: 'Steam',
  buff163: 'Buff163',
  csfloat: 'CSFloat',
  skinport: 'Skinport',
  dmarket: 'DMarket'
};

function findArbitrageOpportunities(skins) {
  const opportunities = [];

  for (const skin of skins) {
    if (!skin.steam) continue;

    const prices = [
      { platform: 'steam', price: skin.steam },
      { platform: 'buff163', price: skin.buff163 },
      { platform: 'csfloat', price: skin.csfloat },
      { platform: 'skinport', price: skin.skinport },
      { platform: 'dmarket', price: skin.dmarket }
    ].filter(p => p.price && p.price > 0).sort((a, b) => a.price - b.price);

    if (prices.length < 2) continue;

    // Buscar la mejor combinación compra/venta
    let bestOpp = null;
    for (let b = 0; b < prices.length; b++) {
      for (let s = b + 1; s < prices.length; s++) {
        const buy = prices[b];
        const sell = prices[s];

        // Nota: en Steam no se puede "comprar" directamente con dinero real fácilmente
        // pero sí se puede vender. En Buff/CSFloat se compra barato.
        const buyCost = buy.price * (1 + (buy.platform === 'buff163' ? 0.02 : 0));
        const sellRevenue = sell.price * (1 - PLATFORM_FEES[sell.platform]);

        const grossProfit = sell.price - buy.price;
        const fees = buy.price * (buy.platform === 'buff163' ? 0.02 : 0) + sell.price * PLATFORM_FEES[sell.platform];
        const netProfit = sellRevenue - buyCost;
        const profitPercent = (netProfit / buyCost) * 100;

        if (profitPercent > 3 && (!bestOpp || profitPercent > bestOpp.profitPercent)) {
          bestOpp = {
            skinId: skin.id,
            skinName: skin.name,
            buyPlatform: buy.platform,
            buyPlatformLabel: PLATFORM_LABELS[buy.platform],
            buyPrice: Math.round(buy.price * 100) / 100,
            sellPlatform: sell.platform,
            sellPlatformLabel: PLATFORM_LABELS[sell.platform],
            sellPrice: Math.round(sell.price * 100) / 100,
            grossProfit: Math.round(grossProfit * 100) / 100,
            fees: Math.round(fees * 100) / 100,
            netProfit: Math.round(netProfit * 100) / 100,
            profitPercent: Math.round(profitPercent * 10) / 10,
            volume: skin.volume || 0,
            risk: getRisk(skin.volume || 0, profitPercent),
            image_url: skin.image_url
          };
        }
      }
    }
    if (bestOpp) opportunities.push(bestOpp);
  }

  return opportunities.sort((a, b) => b.profitPercent - a.profitPercent);
}

function getRisk(volume, profitPercent) {
  if (volume > 50 && profitPercent > 10) return 'bajo';
  if (volume > 20) return 'medio';
  return 'alto';
}

module.exports = { findArbitrageOpportunities, PLATFORM_FEES, PLATFORM_LABELS };
