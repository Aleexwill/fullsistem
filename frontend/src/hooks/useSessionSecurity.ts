import { useEffect, useRef, useState, useCallback } from 'react'
import { sessionManager, multiTabSync, SECURITY_CONFIG } from '../services/securityService'
import { useAuthStore } from '../stores/authStore'

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click']
const CHECK_INTERVAL_MS = 30_000 // Cada 30s verifica estado de sesión
const WARN_BEFORE_MINUTES = 2 // Avisar 2 minutos antes de idle timeout

export interface SessionSecurityState {
  isSessionValid: boolean
  showIdleWarning: boolean
  minutesUntilIdle: number
  dismissWarning: () => void
  extendSession: () => void
}

/**
 * Hook que supervisa la seguridad de la sesión:
 * - Registra actividad del usuario (toca el session manager)
 * - Muestra advertencia antes del idle timeout
 * - Cierra sesión automáticamente en timeout
 * - Escucha eventos cross-tab (logout sincronizado)
 */
export function useSessionSecurity(): SessionSecurityState {
  const { isAuthenticated, user, logout } = useAuthStore()
  const [showIdleWarning, setShowIdleWarning] = useState(false)
  const [minutesUntilIdle, setMinutesUntilIdle] = useState<number>(SECURITY_CONFIG.IDLE_TIMEOUT_MINUTES)
  const warningShownRef = useRef(false)

  // Registrar actividad del usuario
  useEffect(() => {
    if (!isAuthenticated) return

    const handleActivity = () => {
      if (!warningShownRef.current) {
        sessionManager.touch()
      }
    }

    ACTIVITY_EVENTS.forEach(ev => {
      window.addEventListener(ev, handleActivity, { passive: true })
    })

    return () => {
      ACTIVITY_EVENTS.forEach(ev => {
        window.removeEventListener(ev, handleActivity)
      })
    }
  }, [isAuthenticated])

  // Chequeo periódico del estado de la sesión
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const check = () => {
      const status = sessionManager.isValid()
      const remaining = sessionManager.getIdleMinutesRemaining()
      setMinutesUntilIdle(remaining)

      if (!status.valid) {
        if (status.reason === 'idle' || status.reason === 'expired') {
          warningShownRef.current = false
          setShowIdleWarning(false)
          logout()
        }
        return
      }

      if (remaining <= WARN_BEFORE_MINUTES && remaining > 0 && !warningShownRef.current) {
        warningShownRef.current = true
        setShowIdleWarning(true)
      }
    }

    // Ejecutar verificación inmediata y luego cada intervalo
    check()
    const interval = setInterval(check, CHECK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [isAuthenticated, user, logout])

  // Escuchar eventos cross-tab
  useEffect(() => {
    const unsubscribe = multiTabSync.subscribe((event) => {
      if (event === 'logout' && isAuthenticated) {
        logout()
      }
    })
    return unsubscribe
  }, [isAuthenticated, logout])

  const dismissWarning = useCallback(() => {
    warningShownRef.current = false
    setShowIdleWarning(false)
  }, [])

  const extendSession = useCallback(() => {
    sessionManager.touch()
    warningShownRef.current = false
    setShowIdleWarning(false)
  }, [])

  return {
    isSessionValid: isAuthenticated,
    showIdleWarning,
    minutesUntilIdle,
    dismissWarning,
    extendSession,
  }
}
