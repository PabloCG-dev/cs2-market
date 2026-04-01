import { useEffect, useState } from 'react'
import api from '../api/client'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { TrendingUp, TrendingDown, Package } from 'lucide-react'

export default function Cases() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('investScore')

  useEffect(() => {
    api.get('/cases')
      .then(data => setCases(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...cases].sort((a, b) => {
    if (sortBy === 'investScore') return b.investScore - a.investScore
    if (sortBy === 'change30d') return b.change30d - a.change30d
    if (sortBy === 'price') return a.current_price - b.current_price
    return 0
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">📦 Inversión en Cases</h1>
          <p className="text-sm text-slate-400">Los cases descontinuados suelen apreciarse un 30-100% anual</p>
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field text-sm w-auto">
          <option value="investScore">Score inversión</option>
          <option value="change30d">Variación 30d</option>
          <option value="price">Precio</option>
        </select>
      </div>

      {/* Strategy info */}
      <div className="card p-4 mb-5 bg-blue-500/5 border-blue-500/20">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">💡 Estrategia de inversión en cases</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div><span className="text-green-400 font-medium">✅ Comprar:</span> Cases que acaban de dejar de dropear (precio mínimo)</div>
          <div><span className="text-yellow-400 font-medium">⏳ Esperar:</span> Cases activos aún en rotación de drops</div>
          <div><span className="text-blue-400 font-medium">📈 Vender:</span> Cases descontinuados hace &gt;1 año (x2-x10)</div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="card h-64 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sorted.map(c => <CaseCard key={c.id} caseData={c} />)}
        </div>
      )}
    </div>
  )
}

function CaseCard({ caseData: c }) {
  const scoreColor = c.investScore >= 70 ? 'text-green-400' : c.investScore >= 40 ? 'text-yellow-400' : 'text-red-400'
  const scoreBg = c.investScore >= 70 ? 'bg-green-500/10 border-green-500/20' : c.investScore >= 40 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'

  return (
    <div className="card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <img src={c.image_url} alt={c.name} className="w-14 h-10 object-contain bg-[#0a0e1a] rounded shrink-0"
          onError={e => { e.target.style.display='none' }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white leading-tight line-clamp-2">{c.name}</div>
          <div className={`inline-flex mt-1 text-xs px-2 py-0.5 rounded border font-medium ${c.is_active ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}>
            {c.is_active ? 'Activo' : '🔒 Descontinuado'}
          </div>
        </div>
      </div>

      {/* Sparkline */}
      {c.history?.length > 0 && (
        <ResponsiveContainer width="100%" height={50}>
          <LineChart data={c.history}>
            <Line type="monotone" dataKey="price" stroke={c.change30d >= 0 ? '#10b981' : '#ef4444'} strokeWidth={1.5} dot={false} />
            <Tooltip formatter={v => [`€${v?.toFixed(2)}`, '']} contentStyle={{ background: '#111827', border: '1px solid #1f2d40', fontSize: 11 }} />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[#0a0e1a] rounded p-2 text-center">
          <div className="text-slate-400">Precio actual</div>
          <div className="font-bold text-white text-sm">€{c.current_price?.toFixed(2)}</div>
        </div>
        <div className="bg-[#0a0e1a] rounded p-2 text-center">
          <div className="text-slate-400">30 días</div>
          <div className={`font-bold text-sm flex items-center justify-center gap-1 ${c.change30d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {c.change30d >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {c.change30d >= 0 ? '+' : ''}{c.change30d?.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Score */}
      <div className={`flex items-center justify-between rounded-lg px-3 py-2 border text-sm font-semibold ${scoreBg}`}>
        <span className="text-slate-300">Score inversión</span>
        <span className={scoreColor}>{c.investScore}/100</span>
      </div>

      {/* Notes */}
      {c.notes && <p className="text-xs text-slate-400 leading-relaxed">{c.notes}</p>}
    </div>
  )
}
