import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import RecommendationBadge from '../components/RecommendationBadge'
import ArbitrageCard from '../components/ArbitrageCard'
import { TrendingUp, TrendingDown, Target, Zap, DollarSign, BarChart2, Rocket, ArrowRight } from 'lucide-react'
import { FALLBACK_IMG } from '../api/images'

export default function Dashboard() {
  const [recs, setRecs] = useState([])
  const [arbitrage, setArbitrage] = useState([])
  const [movers, setMovers] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [topAction, setTopAction] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const capital = parseFloat(localStorage.getItem('userCapital')) || 100
    Promise.all([
      api.get('/recommendations?limit=5'),
      api.get('/arbitrage?minProfit=5'),
      api.get('/skins?sort=name&order=asc'),
      api.get('/portfolio/summary'),
      api.get(`/action-plan?capital=${capital}`)
    ]).then(([r, a, s, p, ap]) => {
      setRecs(Array.isArray(r) ? r : r.data || [])
      setArbitrage(Array.isArray(a) ? a : (a.data || []).slice(0, 3))
      const skins = Array.isArray(s) ? s : s.data || []
      const sorted = [...skins].sort((a, b) => Math.abs(b.change24h || 0) - Math.abs(a.change24h || 0))
      setMovers(sorted.slice(0, 8))
      setPortfolio(p)
      setTopAction(ap?.plans?.[0] || null)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Resumen del mercado CS2 · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* "Actúa Ahora" highlight banner */}
      {topAction && (
        <Link to="/actua-ahora" className="block mb-6 rounded-xl border border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/10 transition-colors p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <Rocket size={20} className="text-orange-400" />
              <span className="font-bold text-orange-400 text-sm">MEJOR OPORTUNIDAD AHORA</span>
            </div>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img src={topAction.skin.image_url} alt={topAction.skin.name}
                className="w-12 h-9 object-contain bg-[#0a0e1a] rounded shrink-0"
                onError={e => { e.target.src = FALLBACK_IMG }} />
              <div className="min-w-0">
                <span className="font-semibold text-white truncate block">{topAction.skin.name}</span>
                <span className="text-xs text-slate-400">
                  Compra en <strong className="text-orange-300">{topAction.action.buy.platformName}</strong> por €{topAction.action.buy.price} →{' '}
                  Vende en <strong className="text-blue-300">{topAction.action.sell.platformName}</strong> por €{topAction.action.sell.targetPrice}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-lg font-bold text-green-400">+€{topAction.action.grossProfitPerUnit}</div>
                <div className="text-xs text-green-500">+{topAction.action.roiPct}% en {topAction.action.horizon}</div>
              </div>
              <ArrowRight size={18} className="text-orange-400" />
            </div>
          </div>
        </Link>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<BarChart2 size={18} className="text-blue-400" />} label="Skins analizadas" value={movers.length > 0 ? '60+' : '–'} />
        <StatCard icon={<Target size={18} className="text-green-400" />} label="Oportunidades compra" value={recs.length} color="text-green-400" />
        <StatCard icon={<Zap size={18} className="text-orange-400" />} label="Arbitrajes detectados" value={arbitrage.length} color="text-orange-400" />
        <StatCard icon={<DollarSign size={18} className="text-purple-400" />} label="P&L portafolio"
          value={portfolio?.totalPnL !== undefined ? `${portfolio.totalPnL >= 0 ? '+' : ''}€${portfolio.totalPnL.toFixed(2)}` : '–'}
          color={portfolio?.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top buy opportunities */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-200">🎯 Mejores oportunidades de compra</h2>
            <Link to="/catalog" className="text-xs text-orange-400 hover:text-orange-300">Ver todas →</Link>
          </div>
          <div className="space-y-2">
            {recs.slice(0, 5).map(skin => (
              <Link key={skin.id} to={`/skin/${skin.id}`} className="card p-3 flex items-center gap-3 hover:border-orange-500/30 transition-all">
                <img src={skin.image_url} alt={skin.name}
                  className="w-12 h-9 object-contain bg-[#0a0e1a] rounded p-0.5 shrink-0"
                  onError={e => { e.target.src = FALLBACK_IMG }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{skin.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <RecommendationBadge label={skin.recommendation?.label} score={skin.recommendation?.score} />
                    {skin.recommendation?.estimatedROI > 0 && (
                      <span className="text-xs text-green-400">ROI estimado: +{skin.recommendation.estimatedROI}%</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-white">€{skin.steam?.toFixed(2)}</div>
                  <div className="text-xs text-slate-400">Steam</div>
                </div>
              </Link>
            ))}
            {recs.length === 0 && (
              <div className="card p-8 text-center text-slate-500">
                <p>No hay recomendaciones activas en este momento</p>
              </div>
            )}
          </div>
        </div>

        {/* Portfolio summary */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-200">💼 Mi portafolio</h2>
            <Link to="/portfolio" className="text-xs text-orange-400 hover:text-orange-300">Ver →</Link>
          </div>
          {portfolio && portfolio.itemCount > 0 ? (
            <div className="card p-4 space-y-3">
              <PortfolioRow label="Invertido" value={`€${portfolio.totalInvested?.toFixed(2)}`} />
              <PortfolioRow label="Valor actual" value={`€${portfolio.currentValue?.toFixed(2)}`} />
              <div className={`flex justify-between items-center font-bold text-sm rounded-lg p-2 ${portfolio.totalPnL >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                <span>P&L Total</span>
                <span>{portfolio.totalPnL >= 0 ? '+' : ''}€{portfolio.totalPnL?.toFixed(2)} ({portfolio.totalPnLPercent}%)</span>
              </div>
            </div>
          ) : (
            <div className="card p-6 text-center">
              <p className="text-slate-500 text-sm mb-3">Sin skins en portafolio</p>
              <Link to="/portfolio" className="btn-primary text-sm">Añadir skins</Link>
            </div>
          )}
        </div>
      </div>

      {/* Arbitrage */}
      {arbitrage.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-200">⚡ Top Arbitrajes</h2>
            <Link to="/arbitrage" className="text-xs text-orange-400 hover:text-orange-300">Ver todos →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {arbitrage.slice(0, 3).map((opp, i) => <ArbitrageCard key={i} opp={opp} />)}
          </div>
        </div>
      )}

      {/* Market movers */}
      <div className="mt-6">
        <h2 className="font-semibold text-slate-200 mb-3">📊 Movimientos de mercado (24h)</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-[#1f2d40]">
                <th className="text-left px-4 py-2">Skin</th>
                <th className="text-right px-4 py-2">Precio Steam</th>
                <th className="text-right px-4 py-2">CSFloat</th>
                <th className="text-right px-4 py-2 hidden md:table-cell">Cambio 24h</th>
              </tr>
            </thead>
            <tbody>
              {movers.map(skin => (
                <tr key={skin.id} className="border-b border-[#1f2d40]/50 hover:bg-[#1a2235] transition-colors">
                  <td className="px-4 py-2">
                    <Link to={`/skin/${skin.id}`} className="text-slate-200 hover:text-orange-400 font-medium transition-colors">{skin.name}</Link>
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-white">€{skin.steam?.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-green-400">€{skin.csfloat?.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right hidden md:table-cell">
                    <span className={`flex items-center justify-end gap-1 font-medium ${(skin.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(skin.change24h || 0) >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {(skin.change24h || 0) >= 0 ? '+' : ''}{(skin.change24h || 0).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color = 'text-white' }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-slate-400">{label}</span></div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  )
}

function PortfolioRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-[#1a2235] rounded w-48" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-[#1a2235] rounded-xl" />)}</div>
        <div className="h-48 bg-[#1a2235] rounded-xl" />
      </div>
    </div>
  )
}
