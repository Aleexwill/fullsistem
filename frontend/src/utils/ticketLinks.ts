/** URL absoluta al ticket con enlace directo al relevamiento (checklist paso 5). */
export function buildTicketRelevamientoUrl(ticketId: string): string {
  if (typeof window === 'undefined') return ''
  const path = `/tickets/${ticketId}?relevamiento=1`
  const base = import.meta.env.BASE_URL || '/'
  const normalized = base === '/' ? '' : (base.endsWith('/') ? base.slice(0, -1) : base)
  return `${window.location.origin}${normalized}${path}`
}
