import { useState, useMemo, useEffect } from 'react'
import { Search, X, Ticket as TicketIcon, Link2 } from 'lucide-react'
import { ticketsService, Ticket } from '../services/tickets'

interface Props {
  value?: { ticket_id?: string; ticket_number?: string }
  onChange: (link: { ticket_id?: string; ticket_number?: string }) => void
  label?: string
  onlyOpen?: boolean // Si true, solo muestra tickets no cerrados
}

/**
 * Selector de ticket para vincular documentos financieros (facturas, compras, gastos)
 * con un trabajo específico y permitir análisis de rentabilidad por ticket.
 */
export default function TicketLinkSelector({ value, onChange, label = 'Vincular a Ticket (opcional)', onlyOpen = false }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    ticketsService.list({ per_page: '100' }).then(r => {
      const items = r.items || []
      const filtered = onlyOpen ? items.filter(t => !['closed', 'completed'].includes(t.status)) : items
      setTickets(filtered)
    })
  }, [onlyOpen])

  const selected = useMemo(() => {
    if (!value?.ticket_id) return null
    return tickets.find(t => t.id === value.ticket_id) || null
  }, [value?.ticket_id, tickets])

  const filtered = useMemo(() => {
    if (!query.trim()) return tickets.slice(0, 15)
    const q = query.toLowerCase()
    return tickets.filter(t =>
      t.ticket_number?.toLowerCase().includes(q) ||
      t.title?.toLowerCase().includes(q) ||
      t.client?.business_name?.toLowerCase().includes(q)
    ).slice(0, 15)
  }, [query, tickets])

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-600 flex items-center gap-1">
        <Link2 size={12} />
        {label}
      </label>

      {selected ? (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-indigo-900 truncate">
              {selected.ticket_number} — {selected.title}
            </p>
            <p className="text-xs text-indigo-600 truncate">
              {selected.client?.business_name || 'Sin cliente'} · {selected.status}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({})}
            className="text-indigo-400 hover:text-indigo-700"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="Buscar ticket por número, título o cliente..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {open && filtered.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {filtered.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onChange({ ticket_id: t.id, ticket_number: t.ticket_number })
                    setQuery('')
                    setOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-indigo-50 border-b last:border-b-0 border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <TicketIcon size={12} className="text-indigo-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {t.ticket_number} — {t.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {t.client?.business_name || 'Sin cliente'} · {t.status}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {open && filtered.length === 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-400 text-center">
              No hay tickets que coincidan
            </div>
          )}
        </div>
      )}
      <p className="text-[10px] text-gray-400">
        Vincular permite analizar la rentabilidad real del trabajo.
      </p>
    </div>
  )
}
