import { useEffect, useState } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'
import { Bell, Plus, Trash2, CheckCircle } from 'lucide-react'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [skins, setSkins] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ skin_id: '', platform: 'steam', target_price: '', condition: 'below' })

  const load = () => {
    Promise.all([api.get('/alerts'), api.get('/skins')])
      .then(([a, s]) => {
        setAlerts(Array.isArray(a) ? a : [])
        setSkins(Array.isArray(s) ? s : s.data || [])
      }).catch(console.error)
  }

  useEffect(() => {
    load()
    // Verificar alertas cada 30 segundos
    const interval = setInterval(() => {
      api.get('/alerts/check').then(r => {
        if (r.count > 0) {
          r.triggered.forEach(a => toast.success(`🔔 Alerta: ${a.skin_name} alcanzó €${a.target_price}`))
          load()
        }
      }).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const submit = async e => {
    e.preventDefault()
    if (!form.skin_id || !form.target_price) return toast.error('Rellena todos los campos')
    await api.post('/alerts', form)
    toast.success('Alerta creada')
    setShowForm(false)
    setForm({ skin_id: '', platform: 'steam', target_price: '', condition: 'below' })
    load()
  }

  const remove = async id => {
    await api.delete(`/alerts/${id}`)
    toast.success('Alerta eliminada')
    load()
  }

  const active = alerts.filter(a => a.active === 1)
  const triggered = alerts.filter(a => a.active === 0)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">🔔 Alertas de precio</h1>
          <p className="text-sm text-slate-400">Te avisamos cuando una skin alcance tu precio objetivo</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva alerta
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-6 border-orange-500/30">
          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Skin</label>
              <select value={form.skin_id} onChange={e => setForm(f => ({ ...f, skin_id: e.target.value }))} className="input-field text-sm" required>
                <option value="">Seleccionar...</option>
                {skins.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Plataforma</label>
              <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} className="input-field text-sm">
                {['steam','buff163','csfloat','skinport','dmarket'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Condición</label>
              <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} className="input-field text-sm">
                <option value="below">Baja de</option>
                <option value="above">Sube de</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Precio objetivo (€)</label>
              <input type="number" step="0.01" value={form.target_price} onChange={e => setForm(f => ({ ...f, target_price: e.target.value }))}
                className="input-field" required placeholder="ej: 25.00" />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary">Crear alerta</button>
            </div>
          </form>
        </div>
      )}

      {/* Active alerts */}
      <h2 className="font-semibold text-slate-300 mb-3">Alertas activas ({active.length})</h2>
      {active.length === 0 ? (
        <div className="card p-8 text-center mb-6">
          <Bell size={32} className="text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Sin alertas activas</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {active.map(a => (
            <AlertRow key={a.id} alert={a} onDelete={remove} />
          ))}
        </div>
      )}

      {/* Triggered alerts */}
      {triggered.length > 0 && (
        <>
          <h2 className="font-semibold text-slate-300 mb-3">Alertas activadas</h2>
          <div className="space-y-2">
            {triggered.map(a => <AlertRow key={a.id} alert={a} triggered onDelete={remove} />)}
          </div>
        </>
      )}
    </div>
  )
}

function AlertRow({ alert, triggered, onDelete }) {
  return (
    <div className={`card p-3 flex items-center gap-3 ${triggered ? 'border-green-500/30 bg-green-500/5' : ''}`}>
      {triggered ? <CheckCircle size={16} className="text-green-400 shrink-0" /> : <Bell size={16} className="text-orange-400 shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{alert.skin_name}</div>
        <div className="text-xs text-slate-400">
          {alert.platform} — {alert.condition === 'below' ? 'baja de' : 'sube de'} <span className="text-white font-medium">€{alert.target_price?.toFixed(2)}</span>
          {alert.current_price && <span className="ml-2 text-slate-500">Precio actual: €{alert.current_price?.toFixed(2)}</span>}
        </div>
      </div>
      {triggered && <span className="text-xs text-green-400 font-medium bg-green-500/20 px-2 py-0.5 rounded">¡Activada!</span>}
      <button onClick={() => onDelete(alert.id)} className="text-slate-500 hover:text-red-400 transition-colors shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  )
}
