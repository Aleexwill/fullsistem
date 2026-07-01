// ==================== ALMACENAMIENTO SEGURO / OFUSCACIÓN ====================
// Wrapper para localStorage con ofuscación opcional de datos sensibles.
// NOTA: en un cliente browser, la "encriptación" real no protege contra el propio usuario,
// pero sí dificulta lectura casual (DevTools) y protege ante XSS leyendo texto plano.

const OBFUSCATION_KEY = 'sosc-secure-v1'

/**
 * Ofuscación XOR simple con clave derivada. No es criptografía fuerte
 * pero evita lectura casual de datos sensibles en DevTools.
 */
function xorObfuscate(text: string, key: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return result
}

function toBase64(str: string): string {
  try {
    return typeof btoa !== 'undefined'
      ? btoa(unescape(encodeURIComponent(str)))
      : str
  } catch { return str }
}

function fromBase64(str: string): string {
  try {
    return typeof atob !== 'undefined'
      ? decodeURIComponent(escape(atob(str)))
      : str
  } catch { return str }
}

const PREFIX = '__s:' // Marca datos protegidos

export const safeStorage = {
  /**
   * Guardar datos protegidos (ofuscados).
   */
  setSecure(key: string, value: unknown): void {
    try {
      const json = JSON.stringify(value)
      const obfuscated = xorObfuscate(json, OBFUSCATION_KEY)
      localStorage.setItem(key, PREFIX + toBase64(obfuscated))
    } catch (e) {
      console.warn('safeStorage.setSecure failed', e)
    }
  },

  /**
   * Leer datos protegidos. Compatible con datos no-protegidos (lectura JSON directa).
   */
  getSecure<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return fallback
      if (raw.startsWith(PREFIX)) {
        const obfuscated = fromBase64(raw.slice(PREFIX.length))
        const json = xorObfuscate(obfuscated, OBFUSCATION_KEY)
        return JSON.parse(json) as T
      }
      // Legacy: JSON sin proteger
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  },

  /**
   * Guardar datos como JSON plano (no sensible).
   */
  setPlain(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.warn('safeStorage.setPlain failed', e)
    }
  },

  /**
   * Leer datos como JSON plano.
   */
  getPlain<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  },

  remove(key: string): void {
    try { localStorage.removeItem(key) } catch { /* noop */ }
  },

  /**
   * Verifica si un key contiene datos protegidos.
   */
  isSecure(key: string): boolean {
    try {
      const raw = localStorage.getItem(key)
      return !!raw && raw.startsWith(PREFIX)
    } catch {
      return false
    }
  }
}
