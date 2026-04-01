// SVG placeholder local — no depende de servicios externos
export const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%231a2235'/%3E%3Ctext x='50%25' y='45%25' text-anchor='middle' dominant-baseline='middle' fill='%23f97316' font-family='sans-serif' font-size='28'%3E🔫%3C/text%3E%3Ctext x='50%25' y='72%25' text-anchor='middle' dominant-baseline='middle' fill='%236b7280' font-family='sans-serif' font-size='12'%3ECS2%3C/text%3E%3C/svg%3E"

// Helper para construir URL de imagen via proxy del backend
export function skinImageUrl(imageUrl) {
  if (!imageUrl) return FALLBACK_IMG
  // Si la URL ya es válida y no es placeholder, usarla directamente
  if (imageUrl.startsWith('http')) return imageUrl
  return FALLBACK_IMG
}
