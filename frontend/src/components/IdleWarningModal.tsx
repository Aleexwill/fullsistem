import { useEffect, useState } from 'react'
import { Clock, LogOut, Shield } from 'lucide-react'

interface IdleWarningModalProps {
  isOpen: boolean
  minutesRemaining: number
  onExtend: () => void
  onLogout: () => void
}

export default function IdleWarningModal({
  isOpen,
  minutesRemaining,
  onExtend,
  onLogout,
}: IdleWarningModalProps) {
  const [countdown, setCountdown] = useState<number>(minutesRemaining * 60)

  useEffect(() => {
    if (!isOpen) return
    setCountdown(Math.max(1, minutesRemaining * 60))

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) return null

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Sesión por expirar</h3>
            <p className="text-xs text-amber-700 uppercase tracking-wide font-semibold">Inactividad detectada</p>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-slate-700 leading-relaxed">
            Por seguridad, tu sesión se cerrará automáticamente si no hay actividad.
          </p>

          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-md p-4 flex items-center justify-center gap-3">
            <Clock size={20} className="text-slate-500" />
            <span className="text-3xl font-bold text-slate-900 tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={onLogout}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
            <button
              onClick={onExtend}
              className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
            >
              <Shield size={14} />
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
