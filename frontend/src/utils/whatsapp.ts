/** Solo dígitos; intenta formato internacional para Paraguay (595). */
export function normalizeWhatsAppDigits(input: string): string {
  if (!input?.trim()) return ''
  let d = input.replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('0') && d.length >= 9 && d.length <= 12) {
    d = '595' + d.slice(1)
  } else if (d.length === 9 && d.startsWith('9')) {
    d = '595' + d
  }
  return d
}

export function openWhatsAppWithMessage(phone: string, message: string): boolean {
  const d = normalizeWhatsAppDigits(phone)
  if (!d) return false
  const url = `https://wa.me/${d}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}
