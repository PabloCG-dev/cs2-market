export default function RecommendationBadge({ label, score, size = 'sm' }) {
  if (!label) return null

  const config = {
    COMPRAR: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/40', dot: 'bg-green-400' },
    ESPERAR: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40', dot: 'bg-yellow-400' },
    EVITAR:  { bg: 'bg-red-500/20',    text: 'text-red-400',    border: 'border-red-500/40',    dot: 'bg-red-400'   },
  }
  const c = config[label] || config.ESPERAR
  const sizeClass = size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs'

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${c.bg} ${c.text} ${c.border} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {label}
      {score !== undefined && <span className="opacity-70">· {score}</span>}
    </span>
  )
}
