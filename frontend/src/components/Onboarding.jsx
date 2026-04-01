import { useState } from 'react'
import { Rocket } from 'lucide-react'

export default function Onboarding({ onComplete }) {
  const [capital, setCapital] = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    const value = parseFloat(capital)
    if (!value || value < 10) return
    localStorage.setItem('userCapital', value)
    onComplete(value)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0d1424] border border-orange-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🎮</div>
          <h2 className="text-2xl font-bold text-white mb-2">Bienvenido a CS2 Market</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Te diremos <strong className="text-orange-400">exactamente qué comprar</strong>, 
            cuándo venderlo y cuánto ganarás. Sin conocimientos previos necesarios.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            ¿Cuánto dinero quieres invertir? (€)
          </label>
          <input
            type="number"
            min="10"
            step="10"
            value={capital}
            onChange={e => setCapital(e.target.value)}
            className="input-field text-lg font-bold text-center mb-2 w-full"
            placeholder="Ej: 100"
            autoFocus
          />
          <p className="text-xs text-slate-500 mb-5 text-center">Mínimo €10 · Puedes cambiarlo en cualquier momento</p>

          <button type="submit" disabled={!capital || parseFloat(capital) < 10}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed">
            <Rocket size={18} /> Ver qué comprar ahora
          </button>
        </form>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[['€50', '50'], ['€100', '100'], ['€200', '200']].map(([label, val]) => (
            <button key={val} type="button"
              onClick={() => { localStorage.setItem('userCapital', val); onComplete(parseFloat(val)) }}
              className="bg-[#1a2235] hover:bg-[#243047] border border-[#1f2d40] rounded-lg py-2 text-sm font-semibold text-orange-400 transition-colors">
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
