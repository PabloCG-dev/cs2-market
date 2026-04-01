import { Link } from 'react-router-dom'
import RecommendationBadge from './RecommendationBadge'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { FALLBACK_IMG } from '../api/images'

const PLATFORM_COLORS = {
  steam: 'text-blue-400', buff163: 'text-orange-400',
  csfloat: 'text-green-400', skinport: 'text-purple-400', dmarket: 'text-yellow-400'
}

export default function SkinCard({ skin }) {
  const change = skin.change24h || 0
  const isUp = change >= 0

  return (
    <Link to={`/skin/${skin.id}`} className="card p-3 flex flex-col gap-2 hover:border-orange-500/50 hover:bg-[#1a2235] transition-all group cursor-pointer">
      {/* Image */}
      <div className="relative bg-[#0a0e1a] rounded-lg overflow-hidden h-28 flex items-center justify-center">
        <img
          src={skin.image_url}
          alt={skin.name}
          className="h-24 w-full object-contain group-hover:scale-105 transition-transform"
          onError={e => { e.target.src = FALLBACK_IMG }}
        />
        <div className="absolute top-1 right-1">
          <RarityDot rarity={skin.rarity} />
        </div>
      </div>

      {/* Name */}
      <div>
        <div className="text-xs text-slate-400 truncate">{skin.weapon}</div>
        <div className="text-sm font-semibold text-white leading-tight line-clamp-2">{skin.name}</div>
      </div>

      {/* Price row */}
      <div className="flex items-center justify-between mt-auto">
        <div>
          <div className="text-base font-bold text-white">€{skin.steam?.toFixed(2)}</div>
          {skin.lowestPlatform && skin.lowestPlatform.name !== 'steam' && (
            <div className={`text-xs ${PLATFORM_COLORS[skin.lowestPlatform.name] || 'text-slate-400'}`}>
              {skin.lowestPlatform.name}: €{skin.lowestPlatform.price?.toFixed(2)}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isUp ? '+' : ''}{change.toFixed(1)}%
          </div>
        </div>
      </div>
    </Link>
  )
}

function RarityDot({ rarity }) {
  const colors = {
    Covert: 'bg-red-500', Classified: 'bg-pink-500', Restricted: 'bg-purple-500',
    'Mil-Spec': 'bg-blue-500', Contraband: 'bg-orange-500', Extraordinary: 'bg-yellow-500'
  }
  return <div className={`w-2 h-2 rounded-full ${colors[rarity] || 'bg-slate-500'}`} title={rarity} />
}
