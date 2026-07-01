// ==================== VALIDACIÓN Y SANITIZACIÓN DE INPUTS ====================

import { escapeHtml, stripHtml, sanitizeUrl } from '../services/securityService'

export { escapeHtml, stripHtml, sanitizeUrl }

// ==================== VALIDADORES ====================

export const validators = {
  /**
   * Email básico RFC 5322-like
   */
  isEmail(value: string): boolean {
    if (!value) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  },

  /**
   * Teléfono paraguayo flexible (09XX XXX XXX, +595 ..., etc.)
   */
  isPhone(value: string): boolean {
    if (!value) return false
    const cleaned = value.replace(/[\s\-()]/g, '')
    return /^(\+?595|0)?\d{8,10}$/.test(cleaned)
  },

  /**
   * RUC paraguayo: 6-8 dígitos + guión + dígito verificador
   */
  isRuc(value: string): boolean {
    if (!value) return false
    return /^\d{6,8}-?\d?$/.test(value.trim())
  },

  /**
   * Cédula paraguaya: 6-8 dígitos
   */
  isCedula(value: string): boolean {
    if (!value) return false
    return /^\d{6,8}$/.test(value.trim().replace(/\./g, ''))
  },

  /**
   * Nombre: letras, espacios, tildes, apóstrofes. Min 2 caracteres.
   */
  isName(value: string): boolean {
    if (!value || value.trim().length < 2) return false
    return /^[a-záéíóúñÁÉÍÓÚÑ\s'.-]+$/i.test(value.trim())
  },

  /**
   * URL (http/https)
   */
  isUrl(value: string): boolean {
    if (!value) return false
    try {
      const u = new URL(value)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch { return false }
  },

  /**
   * Monto positivo
   */
  isPositiveAmount(value: number | string): boolean {
    const n = typeof value === 'string' ? parseFloat(value) : value
    return !isNaN(n) && isFinite(n) && n >= 0
  },

  /**
   * Fecha ISO válida
   */
  isValidDate(value: string): boolean {
    if (!value) return false
    const d = new Date(value)
    return !isNaN(d.getTime())
  },

  /**
   * Texto dentro de límite de caracteres
   */
  hasMaxLength(value: string, max: number): boolean {
    return !value || value.length <= max
  },

  hasMinLength(value: string, min: number): boolean {
    return !!value && value.length >= min
  },
}

// ==================== SANITIZADORES ====================

export const sanitizers = {
  /**
   * Normaliza un input de texto: trim, quita caracteres de control y limita longitud.
   */
  text(value: string, maxLength = 1000): string {
    if (!value) return ''
    return value
      .trim()
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
      .slice(0, maxLength)
  },

  /**
   * Sanitiza para usar en HTML (escapa entidades)
   */
  html(value: string): string {
    return escapeHtml(value)
  },

  /**
   * Sanitiza un email: lowercase, trim
   */
  email(value: string): string {
    return String(value || '').trim().toLowerCase().slice(0, 254)
  },

  /**
   * Sanitiza un teléfono: quita caracteres no numéricos excepto + y espacios
   */
  phone(value: string): string {
    return String(value || '').replace(/[^\d+\s\-()]/g, '').slice(0, 20)
  },

  /**
   * Convierte a número seguro (si falla, default)
   */
  number(value: unknown, defaultValue = 0): number {
    const n = typeof value === 'number' ? value : parseFloat(String(value))
    return isNaN(n) || !isFinite(n) ? defaultValue : n
  },

  /**
   * Sanitiza URL (elimina protocolos peligrosos)
   */
  url(value: string): string {
    return sanitizeUrl(value)
  },

  /**
   * Quita HTML de texto (para uso en displays que deban mostrar solo texto)
   */
  stripHtml(value: string): string {
    return stripHtml(value)
  },
}

// ==================== HELPER COMBINADO: formulario ====================

export interface FieldResult {
  value: string
  error?: string
}

export function validateField(
  value: string,
  rules: {
    required?: boolean
    maxLength?: number
    minLength?: number
    type?: 'email' | 'phone' | 'ruc' | 'name' | 'url' | 'amount'
    custom?: (v: string) => string | undefined
  }
): FieldResult {
  const v = sanitizers.text(value)

  if (rules.required && !v) {
    return { value: v, error: 'Este campo es obligatorio' }
  }
  if (rules.minLength && v.length < rules.minLength) {
    return { value: v, error: `Mínimo ${rules.minLength} caracteres` }
  }
  if (rules.maxLength && v.length > rules.maxLength) {
    return { value: v, error: `Máximo ${rules.maxLength} caracteres` }
  }
  if (rules.type && v) {
    const checks: Record<string, (s: string) => boolean> = {
      email: validators.isEmail,
      phone: validators.isPhone,
      ruc: validators.isRuc,
      name: validators.isName,
      url: validators.isUrl,
      amount: (s) => validators.isPositiveAmount(s),
    }
    if (checks[rules.type] && !checks[rules.type](v)) {
      const labels: Record<string, string> = {
        email: 'Email inválido',
        phone: 'Teléfono inválido',
        ruc: 'RUC inválido',
        name: 'Nombre inválido',
        url: 'URL inválida',
        amount: 'Monto inválido',
      }
      return { value: v, error: labels[rules.type] }
    }
  }
  if (rules.custom) {
    const err = rules.custom(v)
    if (err) return { value: v, error: err }
  }

  return { value: v }
}
