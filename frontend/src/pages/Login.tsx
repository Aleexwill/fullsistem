import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Loader2, RefreshCw, Shield, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react'
import { rateLimiter, SECURITY_CONFIG } from '../services/securityService'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [lockoutMinutes, setLockoutMinutes] = useState<number>(0)
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null)

  const login = useAuthStore(state => state.login)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Verificar estado de bloqueo al escribir email
  useEffect(() => {
    if (!email || !email.includes('@')) {
      setLockoutMinutes(0)
      return
    }
    const remaining = rateLimiter.getLockoutRemaining(email)
    setLockoutMinutes(remaining)
  }, [email])

  const handleClearData = () => {
    if (!confirm('Esto eliminará todos los datos locales y cerrará la sesión. ¿Continuar?')) return
    localStorage.clear()
    window.location.href = '/login'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (err: any) {
      const msg = err.message || 'Error al iniciar sesión'
      setError(msg)
      // Extraer intentos restantes del mensaje si corresponde
      const match = msg.match(/(\d+) intento/)
      if (match) setAttemptsLeft(parseInt(match[1]))
      // Actualizar estado de bloqueo
      const remaining = rateLimiter.getLockoutRemaining(email)
      setLockoutMinutes(remaining)
    } finally {
      setLoading(false)
    }
  }

  const isLocked = lockoutMinutes > 0

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-blue-950 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header corporativo */}
        <div className="bg-slate-900 text-white px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">SOSC</h1>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Plataforma Corporativa</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Iniciar sesión</h2>
            <p className="text-sm text-slate-500 mt-1">Ingresa con tus credenciales corporativas</p>
          </div>

          {/* Alerta de bloqueo */}
          {isLocked && (
            <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-4 flex items-start gap-3">
              <Lock size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Cuenta bloqueada temporalmente</p>
                <p className="text-xs text-red-700 mt-0.5">
                  Intenta nuevamente en {lockoutMinutes} minuto(s) por motivos de seguridad.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !isLocked && (
            <div className="bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-4 flex items-start gap-3">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">{error}</p>
                {attemptsLeft !== null && attemptsLeft > 0 && attemptsLeft <= 3 && (
                  <p className="text-xs text-red-700 mt-0.5">
                    Quedan {attemptsLeft} intento(s) antes del bloqueo temporal.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-sm transition-colors disabled:bg-slate-100"
                placeholder="tu@email.com"
                required
                autoComplete="email"
                disabled={isLocked}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-sm transition-colors disabled:bg-slate-100"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={isLocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full bg-slate-900 text-white py-2.5 px-4 rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-sm transition-colors"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Verificando...' : isLocked ? 'Bloqueado' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-center text-sm text-slate-500">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-slate-900 hover:underline font-semibold">
                Regístrate aquí
              </Link>
            </p>
          </div>

          {/* Info de seguridad */}
          <div className="mt-5 bg-slate-50 border border-slate-200 rounded-md px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={13} className="text-slate-600" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Seguridad activa</p>
            </div>
            <ul className="text-[11px] text-slate-600 space-y-1">
              <li>• Bloqueo automático tras {SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS} intentos fallidos</li>
              <li>• Cierre por inactividad tras {SECURITY_CONFIG.IDLE_TIMEOUT_MINUTES} minutos</li>
              <li>• Sincronización entre pestañas y auditoría de accesos</li>
            </ul>
          </div>

          {/* Cuentas demo */}
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-md px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">Cuentas de prueba</p>
            <div className="text-[11px] text-slate-600 space-y-0.5 font-mono">
              <p><span className="text-slate-500">admin:</span> admin@sosc.com</p>
              <p><span className="text-slate-500">tec:</span> carlos@tecnico.com</p>
              <p><span className="text-slate-500">cli:</span> cliente@stock.com</p>
              <p><span className="text-slate-500">prov:</span> proveedor@seguridad.com</p>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">
              En modo demo cualquier contraseña funciona hasta que se establezca una.
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleClearData}
              className="text-[11px] text-slate-400 hover:text-red-600 flex items-center gap-1 mx-auto transition-colors font-medium"
            >
              <RefreshCw size={11} />
              Limpiar datos locales
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
