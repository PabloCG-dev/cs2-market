import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Search, TrendingUp, Briefcase, ArrowLeftRight, Bell, Package, Rocket } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../../api/client'

const nav = [
  { to: '/actua-ahora', icon: Rocket, label: 'Actúa Ahora', highlight: true },
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/catalog', icon: Search, label: 'Catálogo' },
  { to: '/arbitrage', icon: ArrowLeftRight, label: 'Arbitraje' },
  { to: '/portfolio', icon: Briefcase, label: 'Portafolio' },
  { to: '/alerts', icon: Bell, label: 'Alertas' },
  { to: '/cases', icon: Package, label: 'Cases' },
]

export default function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-[#0d1424] border-r border-[#1f2d40] flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#1f2d40]">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎮</span>
          <div>
            <div className="font-bold text-white text-sm leading-tight">CS2 Market</div>
            <div className="text-orange-500 text-xs font-semibold">PRO</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, icon: Icon, label, highlight }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                highlight && !isActive
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25'
                  : isActive
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a2235]'
              }`
            }
          >
            <Icon size={16} />
            {label}
            {highlight && (
              <span className="ml-auto text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold leading-none">HOT</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#1f2d40]">
        <SkinCountBadge />
      </div>
    </aside>
  )
}

function SkinCountBadge() {
  const [count, setCount] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = () => {
      api.get('/health').then(d => {
        setCount(d.skins ?? d.data?.skins ?? null)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
    fetch()
    // Mientras el seeder trabaja, actualizar cada 5s
    const interval = setInterval(fetch, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div className="text-xs text-slate-500 text-center">Cargando...</div>
  if (!count) return <div className="text-xs text-slate-500 text-center">Datos demo</div>

  const isSeeding = count < 500
  return (
    <div className="text-center">
      {isSeeding ? (
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-xs text-orange-400">Cargando skins ({count})...</span>
        </div>
      ) : (
        <span className="text-xs text-slate-500">{count.toLocaleString()} skins · Actualiz. cada hora</span>
      )}
    </div>
  )
}
