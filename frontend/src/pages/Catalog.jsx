import { useEffect, useState, useCallback } from 'react'
import api from '../api/client'
import SkinCard from '../components/SkinCard'
import { Search, Filter, X } from 'lucide-react'

const WEAPONS = ['AK-47', 'AWP', 'M4A4', 'M4A1-S', 'USP-S', 'Glock-18', 'Desert Eagle', 'Karambit', 'M9 Bayonet', 'Butterfly Knife', 'Bayonet', 'Talon Knife', 'Sport Gloves', 'Driver Gloves', 'FAMAS']
const RARITIES = ['Covert', 'Classified', 'Restricted', 'Mil-Spec', 'Contraband', 'Extraordinary']
const WEARS = ['FN', 'MW', 'FT', 'WW', 'BS']

export default function Catalog() {
  const [skins, setSkins] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', weapon: '', rarity: '', wear: '', minPrice: '', maxPrice: '' })
  const [sort, setSort] = useState('name')
  const [showFilters, setShowFilters] = useState(false)

  const fetch = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => v && params.append(k, v))
    params.append('sort', sort)
    api.get(`/skins?${params}`)
      .then(r => setSkins(Array.isArray(r) ? r : r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filters, sort])

  useEffect(() => { fetch() }, [fetch])

  const clearFilters = () => setFilters({ search: '', weapon: '', rarity: '', wear: '', minPrice: '', maxPrice: '' })
  const hasFilters = Object.values(filters).some(v => v !== '')

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Catálogo de Skins</h1>
          <p className="text-sm text-slate-400">{skins.length} skins disponibles</p>
        </div>
        <div className="flex gap-2">
          <select value={sort} onChange={e => setSort(e.target.value)} className="input-field text-sm w-auto">
            <option value="name">Nombre</option>
            <option value="price">Precio</option>
            <option value="volume">Volumen</option>
          </select>
          <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary flex items-center gap-2 text-sm ${showFilters ? 'border-orange-500 text-orange-400' : ''}`}>
            <Filter size={14} /> Filtros {hasFilters && <span className="bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">!</span>}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Buscar skin..." value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="input-field pl-9" />
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Arma</label>
              <select value={filters.weapon} onChange={e => setFilters(f => ({ ...f, weapon: e.target.value }))} className="input-field text-sm">
                <option value="">Todas</option>
                {WEAPONS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Rareza</label>
              <select value={filters.rarity} onChange={e => setFilters(f => ({ ...f, rarity: e.target.value }))} className="input-field text-sm">
                <option value="">Todas</option>
                {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Wear</label>
              <select value={filters.wear} onChange={e => setFilters(f => ({ ...f, wear: e.target.value }))} className="input-field text-sm">
                <option value="">Todos</option>
                {WEARS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Precio mín. (€)</label>
              <input type="number" value={filters.minPrice} onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                className="input-field text-sm" placeholder="0" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Precio máx. (€)</label>
              <input type="number" value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                className="input-field text-sm" placeholder="∞" />
            </div>
            {hasFilters && (
              <div className="flex items-end">
                <button onClick={clearFilters} className="btn-secondary flex items-center gap-2 text-sm w-full justify-center">
                  <X size={13} /> Limpiar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {[...Array(18)].map((_, i) => <div key={i} className="card h-52 animate-pulse" />)}
        </div>
      ) : skins.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-slate-400">No se encontraron skins con esos filtros</p>
          <button onClick={clearFilters} className="btn-primary mt-4">Limpiar filtros</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {skins.map(skin => <SkinCard key={skin.id} skin={skin} />)}
        </div>
      )}
    </div>
  )
}
