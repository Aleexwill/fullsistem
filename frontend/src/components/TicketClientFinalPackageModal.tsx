import { useMemo, useState } from 'react'
import type { Ticket, SurveyReportData } from '../services/tickets'
import { Loader2, Send, X, FileText, ClipboardList, Printer } from 'lucide-react'

const fmtPYG = (n: number) =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(n)

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export type ClientFinalPreviewPayload = {
  report: {
    introduction: string
    findings: string
    diagnosis: string
    recommendations: string
    conclusion: string
  }
  quote: {
    validity_days: number
    notes: string
    payment_terms: string
  }
}

type Props = {
  ticket: Ticket
  onClose: () => void
  onSend: (payload: ClientFinalPreviewPayload) => Promise<void>
  sending?: boolean
}

export default function TicketClientFinalPackageModal({ ticket, onClose, onSend, sending }: Props) {
  const sr = ticket.internal_documents?.survey_report as SurveyReportData | undefined
  const quote = ticket.internal_documents?.quote_admin || ticket.internal_documents?.quote
  const approval = ticket.internal_documents?.quote_approval

  const quoteHasBody =
    !!quote &&
    (((quote.items?.length ?? 0) > 0) || ((quote as any).labor_cost ?? 0) > 0 || ((quote as any).labor_sale ?? 0) > 0)
  const canSendUnified = !!sr && quoteHasBody && approval?.status === 'approved'
  const defaultPreview = useMemo<ClientFinalPreviewPayload>(() => {
    const intro = `Visita técnica${sr?.fecha_visita ? ` del ${sr.fecha_visita}` : ''}${
      sr?.hora_inicio ? ` (${sr.hora_inicio}${sr?.hora_fin ? `–${sr.hora_fin}` : ''})` : ''
    }. Responsable: ${sr?.tecnico_responsable || '—'}.`
    const findings = sr?.resumen_hallazgos || 'Sin hallazgos detallados.'
    const diagnosis = `Estado general del sitio: ${sr?.estado_general || '—'}. Condiciones de seguridad: ${
      sr?.condiciones_seguridad || '—'
    }. Urgencia sugerida: ${sr?.urgencia || '—'}.`
    const recommendations = (sr?.recomendaciones || []).join('\n') || 'Sin recomendaciones registradas.'
    const conclusion = 'Quedamos a disposición para coordinar la propuesta económica adjunta.'
    return {
      report: { introduction: intro, findings, diagnosis, recommendations, conclusion },
      quote: {
        validity_days: Number(quote?.validity_days || 15),
        notes: String(quote?.notes || ''),
        payment_terms: String(quote?.payment_terms || ''),
      },
    }
  }, [sr, quote])

  const [preview, setPreview] = useState<ClientFinalPreviewPayload>(defaultPreview)

  const openPrintableClientDocument = () => {
    const q = quote as unknown as { labor_sale?: number } | undefined
    const items = (quote?.items || []) as Record<string, unknown>[]
    const rowHtml: string[] = []
    for (const it of items) {
      const unit = Number(it.sale_price ?? it.unit_price ?? 0)
      const lineTotal = Number(it.total_sale ?? it.total ?? 0)
      rowHtml.push(
        `<tr><td>${escapeHtml(String(it.description || '—'))}</td><td class="num">${Number(it.quantity || 0)}</td><td class="num">${fmtPYG(unit)}</td><td class="num">${fmtPYG(lineTotal)}</td></tr>`
      )
    }
    const laborSale = Number(q?.labor_sale ?? 0)
    if (laborSale > 0) {
      rowHtml.push(
        `<tr><td>${escapeHtml('Mano de obra')}</td><td class="num">1</td><td class="num">${fmtPYG(laborSale)}</td><td class="num">${fmtPYG(laborSale)}</td></tr>`
      )
    }
    const rows =
      rowHtml.length > 0
        ? rowHtml.join('')
        : '<tr><td colspan="4" class="muted">Sin detalle de ítems en el presupuesto consolidado.</td></tr>'

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Informe final — ${escapeHtml(ticket.ticket_number)}</title>
  <style>
    body { font-family: system-ui, Segoe UI, Arial, sans-serif; color: #0f172a; padding: 24px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 1.25rem; margin: 0 0 4px; }
    .meta { font-size: 0.75rem; color: #64748b; margin-bottom: 20px; }
    h2 { font-size: 0.85rem; margin: 16px 0 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    p { margin: 0 0 8px; white-space: pre-wrap; font-size: 0.8rem; line-height: 1.45; }
    table { width: 100%; border-collapse: collapse; font-size: 0.75rem; margin-top: 8px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
    th { background: #f1f5f9; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .muted { color: #94a3b8; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>INFORME FINAL DE PROPUESTA</h1>
  <div class="meta">Ticket ${escapeHtml(ticket.ticket_number)} · Cliente ${escapeHtml(ticket.client?.business_name || '—')}</div>
  <h2>1. Introducción</h2><p>${escapeHtml(preview.report.introduction || '—')}</p>
  <h2>2. Hallazgos</h2><p>${escapeHtml(preview.report.findings || '—')}</p>
  <h2>3. Diagnóstico</h2><p>${escapeHtml(preview.report.diagnosis || '—')}</p>
  <h2>4. Recomendaciones</h2><p>${escapeHtml(preview.report.recommendations || '—')}</p>
  <h2>5. Conclusión</h2><p>${escapeHtml(preview.report.conclusion || '—')}</p>
  <h2>Resumen económico</h2>
  <p><strong>Total:</strong> ${fmtPYG(Number(quote?.total || 0))} · <strong>Validez:</strong> ${preview.quote.validity_days} día(s)</p>
  <p><strong>Notas:</strong><br/>${escapeHtml(preview.quote.notes || '—')}</p>
  <p><strong>Condiciones de pago:</strong><br/>${escapeHtml(preview.quote.payment_terms || '—')}</p>
  <h2>Detalle de ítems (presupuesto)</h2>
  <table><thead><tr><th>Descripción</th><th>Cant.</th><th>P. unit. venta</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
  <p class="muted" style="margin-top:16px;font-size:0.7rem;">Documento de vista previa. Guardá como PDF desde el diálogo de impresión de tu navegador.</p>
  <script>window.onload=function(){window.print();}</script>
</body>
</html>`
    const w = window.open('', '_blank')
    if (!w) {
      alert('Permití ventanas emergentes para imprimir o exportar a PDF.')
      return
    }
    w.document.write(html)
    w.document.close()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        <div className="flex items-start justify-between gap-3 p-4 border-b bg-slate-50">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Envío al cliente para aprobación</h3>
            <p className="text-xs text-slate-600 mt-1">
              Último paso: unificá el <strong>informe de relevamiento</strong> y el <strong>presupuesto</strong> que verá el cliente en documentos.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
          <div className="flex gap-3 items-start rounded-lg border border-slate-200 p-3 bg-slate-50/40">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <ClipboardList size={16} className="text-indigo-600 shrink-0" />
                Informe de relevamiento
              </div>
              {!sr ? (
                <p className="text-xs text-amber-700 mt-1">No hay informe estructurado guardado en el ticket.</p>
              ) : (
                <p className="text-xs text-slate-600 mt-1 line-clamp-3">
                  Visita {sr.fecha_visita || '—'} · {sr.tecnico_responsable || 'Técnico'} · {sr.resumen_hallazgos?.slice(0, 220)}
                  {(sr.resumen_hallazgos?.length ?? 0) > 220 ? '…' : ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 items-start rounded-lg border border-slate-200 p-3 bg-slate-50/40">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <FileText size={16} className="text-emerald-600 shrink-0" />
                Presupuesto consolidado
              </div>
              {!quoteHasBody ? (
                <p className="text-xs text-amber-700 mt-1">No hay líneas en el presupuesto interno.</p>
              ) : (
                <>
                  <p className="text-xs text-slate-600 mt-1">
                    Total venta interno: <strong>{fmtPYG(quote!.total)}</strong> · Validez {quote!.validity_days ?? '—'} días
                  </p>
                  {approval?.status !== 'approved' && (
                    <p className="text-xs text-amber-800 mt-1">
                      El presupuesto debe estar <strong>aprobado por gerencia</strong> antes de enviarlo al cliente.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Vista previa editable del documento final</p>
            <div className="grid grid-cols-1 gap-2">
              <label className="text-[11px] text-slate-500">Introducción</label>
              <textarea
                value={preview.report.introduction}
                onChange={(e) => setPreview((p) => ({ ...p, report: { ...p.report, introduction: e.target.value } }))}
                className="w-full border rounded-lg px-2 py-1.5 text-xs min-h-[56px]"
              />
              <label className="text-[11px] text-slate-500">Hallazgos</label>
              <textarea
                value={preview.report.findings}
                onChange={(e) => setPreview((p) => ({ ...p, report: { ...p.report, findings: e.target.value } }))}
                className="w-full border rounded-lg px-2 py-1.5 text-xs min-h-[64px]"
              />
              <label className="text-[11px] text-slate-500">Diagnóstico</label>
              <textarea
                value={preview.report.diagnosis}
                onChange={(e) => setPreview((p) => ({ ...p, report: { ...p.report, diagnosis: e.target.value } }))}
                className="w-full border rounded-lg px-2 py-1.5 text-xs min-h-[56px]"
              />
              <label className="text-[11px] text-slate-500">Recomendaciones</label>
              <textarea
                value={preview.report.recommendations}
                onChange={(e) => setPreview((p) => ({ ...p, report: { ...p.report, recommendations: e.target.value } }))}
                className="w-full border rounded-lg px-2 py-1.5 text-xs min-h-[64px]"
              />
              <label className="text-[11px] text-slate-500">Conclusión</label>
              <textarea
                value={preview.report.conclusion}
                onChange={(e) => setPreview((p) => ({ ...p, report: { ...p.report, conclusion: e.target.value } }))}
                className="w-full border rounded-lg px-2 py-1.5 text-xs min-h-[56px]"
              />
              <label className="text-[11px] text-slate-500">Validez del presupuesto (días)</label>
              <input
                type="number"
                value={preview.quote.validity_days}
                onChange={(e) =>
                  setPreview((p) => ({ ...p, quote: { ...p.quote, validity_days: Math.max(1, Number(e.target.value) || 1) } }))
                }
                className="w-full border rounded-lg px-2 py-1.5 text-xs"
              />
              <label className="text-[11px] text-slate-500">Notas del presupuesto</label>
              <textarea
                value={preview.quote.notes}
                onChange={(e) => setPreview((p) => ({ ...p, quote: { ...p.quote, notes: e.target.value } }))}
                className="w-full border rounded-lg px-2 py-1.5 text-xs min-h-[56px]"
              />
              <label className="text-[11px] text-slate-500">Condiciones de pago</label>
              <textarea
                value={preview.quote.payment_terms}
                onChange={(e) => setPreview((p) => ({ ...p, quote: { ...p.quote, payment_terms: e.target.value } }))}
                className="w-full border rounded-lg px-2 py-1.5 text-xs min-h-[56px]"
              />
            </div>
          </div>

          <div id="client-final-document-print" className="rounded-lg border border-slate-300 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 gap-2 flex-wrap">
              <div>
                <p className="text-sm font-bold text-slate-900">INFORME FINAL DE PROPUESTA</p>
                <p className="text-[11px] text-slate-500">
                  Ticket {ticket.ticket_number} · Cliente {ticket.client?.business_name || '—'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openPrintableClientDocument}
                  className="text-[10px] uppercase tracking-wide font-semibold px-2 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                >
                  <Printer size={14} />
                  Imprimir / PDF
                </button>
                <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-1 rounded bg-indigo-100 text-indigo-700">
                  Vista previa cliente
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-800 space-y-2">
              <div>
                <p className="font-semibold text-slate-700">1. Introducción</p>
                <p className="whitespace-pre-line">{preview.report.introduction || '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">2. Hallazgos</p>
                <p className="whitespace-pre-line">{preview.report.findings || '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">3. Diagnóstico</p>
                <p className="whitespace-pre-line">{preview.report.diagnosis || '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">4. Recomendaciones</p>
                <p className="whitespace-pre-line">{preview.report.recommendations || '—'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700">5. Conclusión</p>
                <p className="whitespace-pre-line">{preview.report.conclusion || '—'}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 text-xs text-slate-800 space-y-1">
              <p className="font-semibold text-slate-700">Resumen económico enviado al cliente</p>
              <p>
                Total: <strong>{fmtPYG(Number(quote?.total || 0))}</strong>
              </p>
              <p>
                Validez: <strong>{preview.quote.validity_days}</strong> día(s)
              </p>
              <p className="whitespace-pre-line">
                Notas: {preview.quote.notes || '—'}
              </p>
              <p className="whitespace-pre-line">
                Condiciones de pago: {preview.quote.payment_terms || '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-slate-50 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-white">
            Cancelar
          </button>
          <button
            type="button"
            disabled={sending || !canSendUnified}
            onClick={() => void onSend(preview)}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Enviar informe final
          </button>
        </div>
      </div>
    </div>
  )
}
