import { useEffect, useState } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Zap, ExternalLink } from 'lucide-react'

const PLATFORM_URLS = {
  steam: 'https://steamcommunity.com/market/',
  buff163: 'https://buff.163.com',
  csfloat: 'https://csfloat.com/market',
  skinport: 'https://skinport.com/market',
  dmarket: 'https://dmarket.com/ingame-items/item-list/csgo-skins'
}
const PLATFORM_NAMES = {
  steam: 'Steam', buff163: 'Buff163', csfloat: 'CSFloat', skinport: 'Skinport', dmarket: 'DMarket'
}

export default function Portfolio() {
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [skins, setSkins] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ skin_id: '', wear: '', float_value: '', pattern_id: '', purchase_price: '', purchase_platform: 'csfloat', purchase_date: new Date().toISOString().split('T')[0], quantity: 1, notes: '' })

  const load = () => {
    Promise.all([api.get('/portfolio'), api.get('/portfolio/summary'), api.get('/skins')])
      .then(([items, summary, skinsRes]) => {
        setItems(Array.isArray(items) ? items : [])
        setSummary(summary)
        setSkins(Array.isArray(skinsRes) ? skinsRes : skinsRes.data || [])
      }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const submit = async e => {
    e.preventDefault()
    if (!form.skin_id || !form.purchase_price) return toast.error('Rellena los campos obligatorios')
    try {
      await api.post('/portfolio', form)
      toast.success('Skin añadida al portafolio')
      setShowForm(false)
      setForm(f => ({ ...f, skin_id: '', float_value: '', pattern_id: '', purchase_price: '', notes: '' }))
      load()
    } catch { toast.error('Error al añadir') }
  }

  const remove = async id => {
    if (!confirm('¿Eliminar esta skin del portafolio?')) return
    await api.delete(`/portfolio/${id}`)
    toast.success('Eliminado')
    load()
  }

  if (loading) return <div className="p-6 animate-pulse"><div className="h-96 bg-[#1a2235] rounded-xl" /></div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Mi Portafolio</h1>
          <p className="text-sm text-slate-400">Seguimiento de inversiones</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Añadir skin
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard label="Invertido total" value={`€${summary.totalInvested?.toFixed(2)}`} />
          <SummaryCard label="Valor actual" value={`€${summary.currentValue?.toFixed(2)}`} />
          <SummaryCard label="P&L Total"
            value={`${summary.totalPnL >= 0 ? '+' : ''}€${summary.totalPnL?.toFixed(2)}`}
            color={summary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}
            icon={summary.totalPnL >= 0 ? <TrendingUp size={18} className="text-green-400" /> : <TrendingDown size={18} className="text-red-400" />} />
          <SummaryCard label="ROI" value={`${summary.totalPnLPercent >= 0 ? '+' : ''}${summary.totalPnLPercent}%`}
            color={summary.totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'} />
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="card p-5 mb-6 border-orange-500/30">
          <h3 className="font-semibold text-slate-200 mb-4">Añadir skin al portafolio</h3>
          <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Skin *</label>
              <select value={form.skin_id} onChange={e => setForm(f => ({ ...f, skin_id: e.target.value }))} className="input-field text-sm" required>
                <option value="">Seleccionar skin...</option>
                {skins.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Precio compra (€) *</label>
              <input type="number" step="0.01" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))}
                className="input-field text-sm" required />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Plataforma</label>
              <select value={form.purchase_platform} onChange={e => setForm(f => ({ ...f, purchase_platform: e.target.value }))} className="input-field text-sm">
                {['steam', 'buff163', 'csfloat', 'skinport', 'dmarket'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Float</label>
              <input type="number" step="0.0001" min="0" max="1" value={form.float_value} onChange={e => setForm(f => ({ ...f, float_value: e.target.value }))}
                className="input-field text-sm" placeholder="0.xxxx" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Pattern ID</label>
              <input type="number" value={form.pattern_id} onChange={e => setForm(f => ({ ...f, pattern_id: e.target.value }))}
                className="input-field text-sm" placeholder="0-1000" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Cantidad</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Fecha compra</label>
              <input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))}
                className="input-field text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Notas</label>
              <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="input-field text-sm" placeholder="Compra oportunista, esperar 3 meses..." />
            </div>
            <div className="col-span-4 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary">Añadir al portafolio</button>
            </div>
          </form>
        </div>
      )}

      {/* Sell signals banner */}
      {items.some(i => i.sellSignal) && (
        <div className="mb-6 rounded-xl border border-green-500/40 bg-green-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-green-400" />
            <span className="font-bold text-green-400 text-sm">¡SEÑALES DE VENTA ACTIVAS!</span>
          </div>
          <div className="space-y-2">
            {items.filter(i => i.sellSignal).map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img src={item.image_url} alt={item.name}
                    className="w-10 h-8 object-contain bg-[#0a0e1a] rounded shrink-0"
                    onError={e => { e.target.style.display = 'none' }} />
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{item.name}</div>
                    <div className="text-xs text-slate-400">
                      Compraste a €{item.purchase_price?.toFixed(2)} · Ahora vale €{item.current_price?.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className={`font-bold ${item.sellSignal === 'fuerte' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {item.sellSignal === 'fuerte' ? '⚡ VENDE AHORA' : '📈 Considera vender'}
                    </div>
                    <div className="text-xs text-slate-400">
                      Recibes <strong className="text-green-400">€{item.bestSellNetPrice?.toFixed(2)}</strong> netos en{' '}
                      <span className="capitalize text-blue-400">{PLATFORM_NAMES[item.bestSellPlatform] || item.bestSellPlatform}</span>
                      {' '}(+{item.realNetPnlPct?.toFixed(1)}% neto)
                    </div>
                  </div>
                  {PLATFORM_URLS[item.bestSellPlatform] && (
                    <a href={PLATFORM_URLS[item.bestSellPlatform]} target="_blank" rel="noopener noreferrer"
                      className="btn-primary text-xs flex items-center gap-1 px-3 py-1.5 whitespace-nowrap">
                      Vender <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {items.length === 0 ? (
        <div className="card p-16 text-center">
          <DollarSign size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">Tu portafolio está vacío. ¡Añade tu primera skin!</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Añadir skin</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-[#1f2d40] bg-[#0d1424]">
                  <th className="text-left px-4 py-3">Skin</th>
                  <th className="text-right px-4 py-3">Compra</th>
                  <th className="text-right px-4 py-3">Actual (Steam)</th>
                  <th className="text-right px-4 py-3">Mejor venta</th>
                  <th className="text-right px-4 py-3">P&L</th>
                  <th className="text-right px-4 py-3">P&L %</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const isProfit = item.pnl >= 0
                  return (
                    <tr key={item.id} className="border-b border-[#1f2d40]/50 hover:bg-[#1a2235] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={item.image_url} alt={item.name} className="w-10 h-8 object-contain bg-[#0a0e1a] rounded"
                            onError={e => { e.target.style.display='none' }} />
                          <div>
                            <div className="font-semibold text-white leading-tight">{item.name}</div>
                            <div className="text-xs text-slate-400 flex gap-2">
                              <span>x{item.quantity}</span>
                              {item.float_value && <span>Float: {item.float_value}</span>}
                              {item.pattern_id && <span>Pattern: #{item.pattern_id}</span>}
                              <span className="capitalize">{item.purchase_platform}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">€{item.purchase_price?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-white font-medium">€{item.current_price?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-green-400 font-medium">€{item.bestSellNetPrice?.toFixed(2)}</div>
                        <div className="text-xs text-slate-400 capitalize">{item.bestSellPlatform}</div>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        {isProfit ? '+' : ''}€{item.pnl?.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                        <div className="flex items-center justify-end gap-1">
                          {isProfit ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                          {isProfit ? '+' : ''}{item.pnlPercent?.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => remove(item.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color = 'text-white', icon }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}<span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  )
}
