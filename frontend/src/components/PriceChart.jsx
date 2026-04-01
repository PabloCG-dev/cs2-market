import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useState, useMemo } from 'react'

const PLATFORM_COLORS = {
  steam: '#60a5fa', buff163: '#f97316', csfloat: '#10b981', skinport: '#a78bfa', dmarket: '#fbbf24'
}

export default function PriceChart({ history, title }) {
  const [period, setPeriod] = useState(30)
  const [activePlatforms, setActivePlatforms] = useState(['steam'])

  const filtered = useMemo(() => {
    if (!history?.length) return []
    const byDate = {}
    for (const h of history) {
      if (!byDate[h.date]) byDate[h.date] = { date: h.date }
      byDate[h.date][h.platform] = h.price
    }
    const sorted = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
    return sorted.slice(-period)
  }, [history, period])

  const platforms = useMemo(() => {
    if (!history?.length) return ['steam']
    return [...new Set(history.map(h => h.platform))]
  }, [history])

  const togglePlatform = p => setActivePlatforms(prev =>
    prev.includes(p) ? (prev.length > 1 ? prev.filter(x => x !== p) : prev) : [...prev, p]
  )

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#111827] border border-[#1f2d40] rounded-lg p-3 shadow-xl">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        {payload.map(p => (
          <div key={p.dataKey} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-300 capitalize">{p.dataKey}:</span>
            <span className="font-semibold text-white">€{p.value?.toFixed(2)}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {title && <div className="text-sm font-semibold text-slate-200 mb-3">{title}</div>}
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-1">
          {[30, 60, 90].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${period === p ? 'bg-orange-500 text-white' : 'bg-[#1a2235] text-slate-400 hover:text-slate-200'}`}>
              {p}d
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {platforms.map(p => (
            <button key={p} onClick={() => togglePlatform(p)}
              className={`px-2 py-0.5 text-xs rounded border font-medium transition-all capitalize ${activePlatforms.includes(p) ? 'opacity-100' : 'opacity-40'}`}
              style={{ borderColor: PLATFORM_COLORS[p], color: PLATFORM_COLORS[p], background: activePlatforms.includes(p) ? `${PLATFORM_COLORS[p]}20` : 'transparent' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={filtered} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2d40" />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false}
            tickFormatter={d => d?.slice(5)} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false}
            tickFormatter={v => `€${v}`} width={55} />
          <Tooltip content={<CustomTooltip />} />
          {activePlatforms.map(p => (
            <Line key={p} type="monotone" dataKey={p} stroke={PLATFORM_COLORS[p]}
              strokeWidth={2} dot={false} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
