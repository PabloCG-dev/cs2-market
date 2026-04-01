const FEES = { steam: 15, buff163: 2.5, csfloat: 2, skinport: 12, dmarket: 5 }
const LABELS = { steam: 'Steam', buff163: 'Buff163', csfloat: 'CSFloat', skinport: 'Skinport', dmarket: 'DMarket' }

export default function PlatformPriceTable({ prices }) {
  if (!prices) return null

  const rows = Object.entries(FEES).map(([platform, fee]) => ({
    platform,
    label: LABELS[platform],
    price: prices[platform],
    fee,
    net: prices[platform] ? Math.round(prices[platform] * (1 - fee / 100) * 100) / 100 : null
  })).filter(r => r.price > 0).sort((a, b) => a.price - b.price)

  const lowestBuy = rows[0]
  const highestSell = [...rows].sort((a, b) => b.net - a.net)[0]
  const arbitrage = lowestBuy && highestSell && lowestBuy.platform !== highestSell.platform
    ? Math.round((highestSell.net - lowestBuy.price) * 100) / 100 : null

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 text-xs border-b border-[#1f2d40]">
              <th className="text-left py-2">Plataforma</th>
              <th className="text-right py-2">Precio</th>
              <th className="text-right py-2">Fee</th>
              <th className="text-right py-2">Recibes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.platform} className={`border-b border-[#1f2d40]/50 ${row.platform === lowestBuy?.platform ? 'bg-green-500/5' : ''}`}>
                <td className="py-2 font-medium text-slate-200">{row.label}
                  {row.platform === lowestBuy?.platform && <span className="ml-2 text-xs text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded">mejor compra</span>}
                  {row.platform === highestSell?.platform && rows.length > 1 && <span className="ml-2 text-xs text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded">mejor venta</span>}
                </td>
                <td className="py-2 text-right text-white font-semibold">€{row.price?.toFixed(2)}</td>
                <td className="py-2 text-right text-slate-400">{row.fee}%</td>
                <td className="py-2 text-right text-green-400 font-medium">€{row.net?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {arbitrage !== null && (
        <div className={`mt-3 p-3 rounded-lg text-sm font-medium flex items-center justify-between ${arbitrage > 0 ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          <span>Margen de arbitraje: {lowestBuy?.label} → {highestSell?.label}</span>
          <span className="font-bold">{arbitrage > 0 ? '+' : ''}€{arbitrage.toFixed(2)}</span>
        </div>
      )}
    </div>
  )
}
