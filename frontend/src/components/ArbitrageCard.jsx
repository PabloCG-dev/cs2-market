import { ArrowRight, TrendingUp } from 'lucide-react'

const RISK_COLORS = { bajo: 'text-green-400 bg-green-500/10', medio: 'text-yellow-400 bg-yellow-500/10', alto: 'text-red-400 bg-red-500/10' }

export default function ArbitrageCard({ opp }) {
  const profitColor = opp.profitPercent >= 20 ? 'text-green-400' : opp.profitPercent >= 10 ? 'text-yellow-400' : 'text-orange-400'

  return (
    <div className="card p-4 hover:border-orange-500/30 transition-all">
      <div className="flex items-start gap-3 mb-3">
        {opp.image_url && (
          <img src={opp.image_url} alt={opp.skinName}
            className="w-14 h-10 object-contain rounded bg-[#0a0e1a] p-1 shrink-0"
            onError={e => { e.target.style.display = 'none' }} />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white leading-tight line-clamp-2">{opp.skinName}</div>
          <div className={`text-xs mt-0.5 font-medium rounded px-1.5 py-0.5 inline-block ${RISK_COLORS[opp.risk]}`}>
            Riesgo {opp.risk}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-xl font-bold ${profitColor}`}>+{opp.profitPercent}%</div>
          <div className="text-xs text-slate-400">beneficio</div>
        </div>
      </div>

      {/* Flow */}
      <div className="flex items-center gap-2 bg-[#0a0e1a] rounded-lg p-3">
        <div className="flex-1 text-center">
          <div className="text-xs text-slate-400">Comprar en</div>
          <div className="font-semibold text-white capitalize">{opp.buyPlatformLabel}</div>
          <div className="text-orange-400 font-bold">€{opp.buyPrice?.toFixed(2)}</div>
        </div>
        <ArrowRight size={18} className="text-slate-500 shrink-0" />
        <div className="flex-1 text-center">
          <div className="text-xs text-slate-400">Vender en</div>
          <div className="font-semibold text-white capitalize">{opp.sellPlatformLabel}</div>
          <div className="text-blue-400 font-bold">€{opp.sellPrice?.toFixed(2)}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
        <span>Fees: €{opp.fees?.toFixed(2)}</span>
        <span className="font-semibold text-green-400">Beneficio neto: €{opp.netProfit?.toFixed(2)}</span>
      </div>
    </div>
  )
}
