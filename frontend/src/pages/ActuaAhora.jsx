import { useEffect, useState, useCallback } from 'react'
import { ExternalLink, ShoppingCart, Clock, DollarSign, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import api from '../api/client'
import { FALLBACK_IMG } from '../api/images'
import Onboarding from '../components/Onboarding'

const PULSE_STYLES = {
  ALCISTA: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', dot: 'bg-green-400' },
  NEUTRO: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  BAJISTA: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-400' },
}
const RISK_LABEL = { bajo: { text: 'Riesgo bajo', color: 'text-green-400 bg-green-500/10' }, medio: { text: 'Riesgo medio', color: 'text-yellow-400 bg-yellow-500/10' }, alto: { text: 'Riesgo alto', color: 'text-red-400 bg-red-500/10' } }

export default function ActuaAhora() {
  const [capital, setCapital] = useState(() => parseFloat(localStorage.getItem('userCapital')) || null)
  const [inputCapital, setInputCapital] = useState(() => localStorage.getItem('userCapital') || '')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [expandedPlan, setExpandedPlan] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('userCapital'))

  const fetchPlan = useCallback(async (cap) => {
    if (!cap) return
    setLoading(true)
    try {
      const res = await api.get(`/action-plan?capital=${cap}`)
      setData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (capital) fetchPlan(capital)
  }, [capital, fetchPlan])

  const handleCapitalSubmit = e => {
    e.preventDefault()
    const val = parseFloat(inputCapital)
    if (val >= 10) {
      localStorage.setItem('userCapital', val)
      setCapital(val)
    }
  }

  const handleOnboardingComplete = val => {
    setCapital(val)
    setInputCapital(String(val))
    setShowOnboarding(false)
  }

  if (showOnboarding) return <Onboarding onComplete={handleOnboardingComplete} />

  const pulse = data?.marketSummary?.pulse
  const pulseStyle = PULSE_STYLES[pulse] || PULSE_STYLES.NEUTRO

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">🚀 Actúa Ahora</h1>
          <p className="text-slate-400 text-sm mt-1">Qué comprar hoy, cuándo venderlo y cuánto ganarás — sin rodeos.</p>
        </div>
        {/* Capital form */}
        <form onSubmit={handleCapitalSubmit} className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">€</span>
            <input type="number" min="10" step="10" value={inputCapital}
              onChange={e => setInputCapital(e.target.value)}
              className="input-field pl-7 w-28 text-sm font-semibold" placeholder="Capital" />
          </div>
          <button type="submit" className="btn-primary text-sm flex items-center gap-1 px-3 py-2">
            <RefreshCw size={13} /> Actualizar
          </button>
        </form>
      </div>

      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-[#1a2235] rounded-xl" />
          <div className="h-40 bg-[#1a2235] rounded-xl" />
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-[#1a2235] rounded-xl" />)}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Market pulse */}
          <div className={`rounded-xl border p-4 mb-6 flex items-start gap-4 ${pulseStyle.bg} ${pulseStyle.border}`}>
            <div className={`w-3 h-3 rounded-full mt-1 shrink-0 animate-pulse ${pulseStyle.dot}`} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-bold text-lg ${pulseStyle.text}`}>Mercado {pulse}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-400">{data.marketSummary.totalOpportunities} oportunidades · ROI medio top5: +{data.marketSummary.avgROI}%</span>
              </div>
              <p className="text-slate-300 text-sm">{data.marketSummary.advice}</p>
            </div>
          </div>

          {/* Capital distribution table */}
          {data.capitalAllocation?.length > 0 && (
            <div className="card mb-6 overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1f2d40] flex items-center justify-between">
                <h2 className="font-semibold text-slate-200 text-sm">💼 Distribución óptima de tu capital (€{capital})</h2>
                <span className="text-xs text-slate-500">Diversificado automáticamente</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 border-b border-[#1f2d40]">
                      <th className="text-left px-4 py-2">#</th>
                      <th className="text-left px-4 py-2">Skin</th>
                      <th className="text-right px-4 py-2">Invertir</th>
                      <th className="text-right px-4 py-2">Comprar en</th>
                      <th className="text-right px-4 py-2">Vender en</th>
                      <th className="text-right px-4 py-2">Ganancia</th>
                      <th className="text-right px-4 py-2">ROI</th>
                      <th className="text-right px-4 py-2">Plazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.capitalAllocation.map(alloc => (
                      <tr key={alloc.skinId} className="border-b border-[#1f2d40]/50 hover:bg-[#1a2235] transition-colors">
                        <td className="px-4 py-2.5 text-slate-500 font-medium">#{alloc.rank}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <img src={alloc.image_url} alt={alloc.skinName}
                              className="w-8 h-6 object-contain bg-[#0a0e1a] rounded shrink-0"
                              onError={e => { e.target.src = FALLBACK_IMG }} />
                            <span className="font-medium text-white truncate max-w-[160px]">{alloc.skinName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-white">€{alloc.actualInvest}</td>
                        <td className="px-4 py-2.5 text-right text-orange-400 capitalize">{alloc.buyPlatform}<br /><span className="text-xs text-slate-500">€{alloc.buyPrice}/u</span></td>
                        <td className="px-4 py-2.5 text-right text-blue-400 capitalize">{alloc.sellPlatform}<br /><span className="text-xs text-slate-500">objetivo €{alloc.targetPrice}</span></td>
                        <td className="px-4 py-2.5 text-right font-bold text-green-400">+€{alloc.expectedProfit}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-green-400">+{alloc.roiPct}%</td>
                        <td className="px-4 py-2.5 text-right text-slate-300 text-xs">{alloc.horizon}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed action plans */}
          <h2 className="font-semibold text-slate-200 mb-3 text-sm">📋 Plan detallado paso a paso</h2>
          <div className="space-y-4">
            {data.plans?.map(plan => (
              <ActionCard
                key={plan.skin.id}
                plan={plan}
                expanded={expandedPlan === plan.skin.id}
                onToggle={() => setExpandedPlan(expandedPlan === plan.skin.id ? null : plan.skin.id)}
              />
            ))}
            {(!data.plans || data.plans.length === 0) && (
              <div className="card p-10 text-center text-slate-500">
                No hay oportunidades de compra en este momento. Vuelve más tarde.
              </div>
            )}
          </div>
        </>
      )}

      {!loading && !data && !showOnboarding && (
        <div className="card p-10 text-center">
          <p className="text-slate-400 mb-4">Introduce tu capital y pulsa "Actualizar" para ver las recomendaciones.</p>
        </div>
      )}
    </div>
  )
}

function ActionCard({ plan, expanded, onToggle }) {
  const { skin, recommendation, action, steps } = plan
  const riskStyle = RISK_LABEL[recommendation.riskLevel] || RISK_LABEL.medio

  return (
    <div className="card overflow-hidden border border-[#1f2d40] hover:border-orange-500/20 transition-colors">
      {/* Card header */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Rank badge */}
        <div className="shrink-0 w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold text-sm">
          {plan.rank}
        </div>

        {/* Image + name */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img src={skin.image_url} alt={skin.name}
            className="w-16 h-12 object-contain bg-[#0a0e1a] rounded-lg p-1 shrink-0"
            onError={e => { e.target.src = FALLBACK_IMG }} />
          <div className="min-w-0">
            <div className="font-bold text-white truncate">{skin.name}</div>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskStyle.color}`}>{riskStyle.text}</span>
              <span className="text-xs text-slate-400">Score: {recommendation.score}/100</span>
            </div>
          </div>
        </div>

        {/* Key numbers */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-0.5">Compra en</div>
            <div className="font-bold text-white">€{action.buy.price}</div>
            <div className="text-xs text-orange-400 capitalize">{action.buy.platformName}</div>
          </div>
          <div className="text-center text-slate-500 text-xl">→</div>
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-0.5">Vende en</div>
            <div className="font-bold text-white">€{action.sell.targetPrice}</div>
            <div className="text-xs text-blue-400 capitalize">{action.sell.platformName}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-0.5">Ganancia</div>
            <div className="font-bold text-green-400">+€{action.grossProfitPerUnit}</div>
            <div className="text-xs text-green-500">+{action.roiPct}%</div>
          </div>
          <div className="text-center hidden md:block">
            <div className="text-xs text-slate-400 mb-0.5">Plazo</div>
            <div className="text-sm font-semibold text-slate-300">{action.horizon}</div>
          </div>
        </div>

        <button onClick={onToggle} className="shrink-0 text-slate-400 hover:text-orange-400 transition-colors ml-2">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Expanded steps */}
      {expanded && (
        <div className="border-t border-[#1f2d40] p-4">
          {/* Stop-loss warning */}
          <div className="mb-4 flex items-start gap-2 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300">
              <strong className="text-red-400">Stop-loss: €{action.stopLoss}</strong> — Si el precio cae por debajo de este nivel, vende para limitar las pérdidas.
            </p>
          </div>

          {/* Reasons */}
          {recommendation.reasons?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {recommendation.reasons.map((r, i) => (
                <span key={i} className="text-xs bg-[#1a2235] text-slate-300 px-2 py-1 rounded-lg">{r}</span>
              ))}
            </div>
          )}

          {/* Steps */}
          <div className="space-y-3">
            {steps.map(step => (
              <div key={step.step} className="flex gap-3">
                <div className="shrink-0 w-7 h-7 rounded-full bg-[#1a2235] flex items-center justify-center text-sm">{step.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white">{step.title}</span>
                    {step.url && (
                      <a href={step.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-0.5">
                        Abrir <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-slate-300">{step.description}</p>
                  {step.detail && <p className="text-xs text-slate-500 mt-0.5">{step.detail}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Summary box */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryBox icon={<ShoppingCart size={14} />} label="Inversión total" value={`€${action.totalInvestment}`} />
            <SummaryBox icon={<DollarSign size={14} />} label="Beneficio neto" value={`+€${action.totalProfit}`} color="text-green-400" />
            <SummaryBox icon={<TrendingUp size={14} />} label="ROI anualizado" value={`+${action.annualROI}%`} color="text-green-400" />
            <SummaryBox icon={<Clock size={14} />} label="Horizonte" value={action.horizon} />
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryBox({ icon, label, value, color = 'text-white' }) {
  return (
    <div className="bg-[#1a2235] rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">{icon}{label}</div>
      <div className={`font-bold text-sm ${color}`}>{value}</div>
    </div>
  )
}
