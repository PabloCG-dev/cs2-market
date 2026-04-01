import { useState } from 'react'
import { Calculator } from 'lucide-react'

const FEES = { steam: 0.15, buff163: 0.025, csfloat: 0.02, skinport: 0.12, dmarket: 0.05 }
const PLATFORMS = ['steam', 'buff163', 'csfloat', 'skinport', 'dmarket']

export default function FeeCalculator({ defaultBuyPrice, defaultBuyPlatform }) {
  const [buyPrice, setBuyPrice] = useState(defaultBuyPrice || '')
  const [buyPlatform, setBuyPlatform] = useState(defaultBuyPlatform || 'csfloat')
  const [sellPlatform, setSellPlatform] = useState('steam')

  const buy = parseFloat(buyPrice) || 0
  const buyFeeAmount = buy * (FEES[buyPlatform] || 0)
  const buyCost = buy + (buyPlatform === 'buff163' ? buy * 0.02 : 0)

  const breakEven = buyCost > 0 && FEES[sellPlatform] < 1
    ? Math.ceil((buyCost / (1 - FEES[sellPlatform])) * 100) / 100 : 0

  const scenarios = [5, 10, 20, 30].map(pct => {
    const sellPrice = buyCost * (1 + pct / 100)
    const net = sellPrice * (1 - FEES[sellPlatform])
    const profit = net - buyCost
    return { pct, sellPrice: Math.round(sellPrice * 100) / 100, net: Math.round(net * 100) / 100, profit: Math.round(profit * 100) / 100 }
  })

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={16} className="text-orange-400" />
        <span className="font-semibold text-slate-200">Calculadora de beneficio</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Precio de compra (€)</label>
          <input type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)}
            className="input-field text-sm" placeholder="0.00" step="0.01" />
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Comprar en</label>
          <select value={buyPlatform} onChange={e => setBuyPlatform(e.target.value)} className="input-field text-sm capitalize">
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Vender en</label>
          <select value={sellPlatform} onChange={e => setSellPlatform(e.target.value)} className="input-field text-sm capitalize">
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {buy > 0 && (
        <>
          <div className="bg-[#0a0e1a] rounded-lg p-3 mb-3 text-sm">
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Break-even (precio mínimo de venta):</span>
              <span className="text-yellow-400 font-bold">€{breakEven.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Fee al vender ({(FEES[sellPlatform] * 100).toFixed(1)}%):</span>
              <span className="text-red-400">-€{(breakEven * FEES[sellPlatform]).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-400 mb-2">Escenarios de venta:</div>
            {scenarios.map(s => (
              <div key={s.pct} className="flex items-center justify-between text-xs py-1 border-b border-[#1f2d40]/50">
                <span className="text-slate-400">Vendes a +{s.pct}% → €{s.sellPrice}</span>
                <span className={`font-semibold ${s.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {s.profit > 0 ? '+' : ''}€{s.profit.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
