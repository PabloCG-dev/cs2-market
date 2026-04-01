import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import PriceChart from '../components/PriceChart'
import RecommendationBadge from '../components/RecommendationBadge'
import PlatformPriceTable from '../components/PlatformPriceTable'
import FeeCalculator from '../components/FeeCalculator'
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react'
import { FALLBACK_IMG } from '../api/images'

const RARITY_COLORS = {
  Covert: 'border-red-500/50 text-red-400', Classified: 'border-pink-500/50 text-pink-400',
  Restricted: 'border-purple-500/50 text-purple-400', 'Mil-Spec': 'border-blue-500/50 text-blue-400',
  Contraband: 'border-orange-500/50 text-orange-400', Extraordinary: 'border-yellow-500/50 text-yellow-400'
}

export default function SkinDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/skins/${id}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-6 animate-pulse"><div className="h-96 bg-[#1a2235] rounded-xl" /></div>
  if (!data) return <div className="p-6 text-slate-400">Skin no encontrada</div>

  const { skin, priceHistory, recommendation, stats } = data
  const rarityColor = RARITY_COLORS[skin.rarity] || 'border-slate-500 text-slate-400'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Link to="/catalog" className="flex items-center gap-2 text-slate-400 hover:text-white mb-5 text-sm transition-colors">
        <ArrowLeft size={16} /> Volver al catálogo
      </Link>

      {/* Hero */}
      <div className="card p-6 mb-5 flex flex-col md:flex-row gap-6">
        <div className="bg-[#0a0e1a] rounded-xl p-4 flex items-center justify-center md:w-64 shrink-0">
          <img src={skin.image_url} alt={skin.name} className="max-h-40 object-contain"
            onError={e => { e.target.src = FALLBACK_IMG }} />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${rarityColor}`}>{skin.rarity}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded border border-[#1f2d40] text-slate-400 capitalize">{skin.category}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded border border-[#1f2d40] text-slate-400">{skin.wear}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">{skin.name}</h1>

          {/* Prices row */}
          <div className="flex flex-wrap gap-4 mb-4">
            <PriceBadge label="Steam" price={skin.steam} color="text-blue-400" />
            <PriceBadge label="CSFloat" price={skin.csfloat} color="text-green-400" tag="Recomendado" />
            <PriceBadge label="Buff163" price={skin.buff163} color="text-slate-400" />
            <PriceBadge label="Skinport" price={skin.skinport} color="text-purple-400" />
            <PriceBadge label="DMarket" price={skin.dmarket} color="text-yellow-400" />
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox label="Mín. 30d" value={`€${stats.min30d?.toFixed(2)}`} />
              <StatBox label="Máx. 30d" value={`€${stats.max30d?.toFixed(2)}`} />
              <StatBox label="Media 30d" value={`€${stats.avg30d?.toFixed(2)}`} />
              <StatBox label="vs Media"
                value={`${skin.steam > stats.avg30d ? '+' : ''}${(((skin.steam - stats.avg30d) / stats.avg30d) * 100).toFixed(1)}%`}
                color={skin.steam < stats.avg30d ? 'text-green-400' : 'text-red-400'} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart - col 2 */}
        <div className="lg:col-span-2 card p-5">
          <PriceChart history={priceHistory} title="Historial de precios" />
        </div>

        {/* Recommendation panel */}
        <div className="space-y-4">
          {recommendation && (
            <div className="card p-4">
              <div className="text-sm font-semibold text-slate-300 mb-3">Análisis de inversión</div>
              {/* Score ring */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4 ${
                  recommendation.score >= 70 ? 'border-green-500 text-green-400' :
                  recommendation.score >= 40 ? 'border-yellow-500 text-yellow-400' : 'border-red-500 text-red-400'
                }`}>
                  {recommendation.score}
                </div>
                <div>
                  <RecommendationBadge label={recommendation.label} size="lg" />
                  <div className="text-xs text-slate-400 mt-1">Riesgo: {recommendation.riskLevel}</div>
                  {recommendation.estimatedROI !== undefined && (
                    <div className={`text-sm font-semibold mt-0.5 ${recommendation.estimatedROI >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ROI estimado 30d: {recommendation.estimatedROI >= 0 ? '+' : ''}{recommendation.estimatedROI}%
                    </div>
                  )}
                </div>
              </div>
              {/* Reasons */}
              <div className="space-y-1">
                {recommendation.reasons?.map((r, i) => (
                  <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5 leading-tight">{r}</div>
                ))}
              </div>
            </div>
          )}

          {/* Platform prices */}
          <div className="card p-4">
            <div className="text-sm font-semibold text-slate-300 mb-3">Precios por plataforma</div>
            <PlatformPriceTable prices={{ steam: skin.steam, buff163: skin.buff163, csfloat: skin.csfloat, skinport: skin.skinport, dmarket: skin.dmarket }} />
          </div>
        </div>
      </div>

      {/* Fee calculator */}
      <div className="mt-5">
        <FeeCalculator defaultBuyPrice={skin.csfloat || skin.steam} defaultBuyPlatform="csfloat" />
      </div>
    </div>
  )
}

function PriceBadge({ label, price, color, tag }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label} {tag && <span className="text-green-400">(más barato)</span>}</div>
      <div className={`text-lg font-bold ${color}`}>€{price?.toFixed(2)}</div>
    </div>
  )
}

function StatBox({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-[#0a0e1a] rounded-lg p-2 text-center">
      <div className="text-xs text-slate-400 mb-0.5">{label}</div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
    </div>
  )
}
