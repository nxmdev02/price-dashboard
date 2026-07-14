export function normalizePrice(value: string | number | null | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? Math.round(value) : null
  }

  if (!value) return null

  const normalized = value
    .replace(/[₩원\s,]/g, '')
    .replace(/[^0-9.-]/g, '')

  if (!normalized) return null

  const price = Number(normalized)
  return Number.isFinite(price) && price > 0 ? Math.round(price) : null
}
