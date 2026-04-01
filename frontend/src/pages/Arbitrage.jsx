import { useEffect, useState } from 'react'
import api from '../api/client'
import ArbitrageCard from '../components/ArbitrageCard'
import { RefreshCw, TrendingUp } from 'lucide-react'

export default function Arbitrage() {
  const [opps, setOpps] = useState([])
  const [loading, setLoading] = useState(true)
  const [minProfit, setMinProfit] = useState(3)

  const load = () => {
    setLoading(true)
    api.get(`/arbitrage?minProfit=${minProfit}`)
      .then(r => setOpps(Array.isArray(r) ? r : r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [minProfit])

  const totalPotential = opps.reduce((s, o) => s + o.netProfit, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">⚡ Arbitraje entre plataformas</h1>
          <p className="text-sm text-slate-400">Compra barato en una plataforma, vende caro en otra. Beneficio real después de fees.</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Info banner */}
      <div className="card p-4 mb-5 border-orange-500/20 bg-orange-500/5">
        <div className="flex flex-wrap gap-4 text-sm">
          <div><span className="text-slate-400">Oportunidades:</span> <span className="font-bold text-orange-400">{opps.length}</span></div>
          <div><span className="text-slate-400">Beneficio potencial total:</span> <span className="font-bold text-green-400">€{totalPotential.toFixed(2)}</span></div>
          <div className="ml-auto flex items-center gap-2">
            <label className="text-slate-400">Beneficio mínimo:</label>
            <select value={minProfit} onChange={e => setMinProfit(Number(e.target.value))} className="input-field text-sm w-auto py-1">
              {[3, 5, 10, 15, 20].map(v => <option key={v} value={v}>{v}%</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Fee reference */}
      <div className="card p-4 mb-5">
        <div className="text-xs text-slate-400 mb-2 font-medium">Fees por plataforma (deducidas automáticamente):</div>
        <div className="flex flex-wrap gap-3">
          {[['Steam','15%','text-blue-400'],['Buff163','2.5%','text-orange-400'],['CSFloat','2%','text-green-400'],['Skinport','12%','text-purple-400'],['DMarket','5%','text-yellow-400']].map(([p,f,c]) => (
            <div key={p} className="flex items-center gap-1.5 text-xs">
              <span className={`font-semibold ${c}`}>{p}</span>
              <span className="text-slate-500">→ {f}</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => <div key={i} className="card h-40 animate-pulse" />)}
        </div>
      ) : opps.length === 0 ? (
        <div className="card p-16 text-center">
          <TrendingUp size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No hay oportunidades de arbitraje con ≥{minProfit}% de beneficio</p>
          <button onClick={() => setMinProfit(3)} className="btn-primary mt-4">Bajar umbral a 3%</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opps.map((opp, i) => <ArbitrageCard key={i} opp={opp} />)}
        </div>
      )}
    </div>
  )
}
