import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { permissionService, ModuleKey, Permission } from '../services/permissionService'
import { Shield, Lock, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface PermissionRouteProps {
  children: React.ReactNode
  /** Módulo cuyo permiso `.view` se requiere para acceder */
  module?: ModuleKey
  /** Permiso específico requerido (sobreescribe `module`) */
  permission?: Permission
  /** User types permitidos (fallback simple basado en user_type) */
  allowedUserTypes?: Array<'admin' | 'technician' | 'client' | 'supplier'>
  /** Ruta a la que redirigir si no está autenticado */
  redirectTo?: string
}

/**
 * Guard de rutas basado en permisos granulares del permissionService.
 * Si el usuario no tiene permiso, muestra pantalla de acceso denegado.
 */
export default function PermissionRoute({
  children,
  module,
  permission,
  allowedUserTypes,
  redirectTo = '/login'
}: PermissionRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />
  }

  // Super admin siempre pasa
  const isSuperAdmin = user.user_type === 'admin' && (
    user.role_id === 'super_admin' || user.role_id === 'admin' || !user.role_id
  )

  let hasAccess = isSuperAdmin

  if (!hasAccess && allowedUserTypes && allowedUserTypes.length > 0) {
    hasAccess = allowedUserTypes.includes(user.user_type)
  }

  if (!hasAccess && permission) {
    hasAccess = permissionService.hasPermission(user.id, user.user_type, permission, user.role_id)
  }

  if (!hasAccess && module) {
    hasAccess = permissionService.canAccessModule(user.id, user.user_type, module, user.role_id)
  }

  // Si no se especificaron restricciones explícitas, permitir (solo requiere autenticación)
  if (!module && !permission && !allowedUserTypes) {
    hasAccess = true
  }

  if (!hasAccess) {
    return <AccessDeniedScreen module={module} permission={permission} />
  }

  return <>{children}</>
}

function AccessDeniedScreen({ module, permission }: { module?: ModuleKey; permission?: Permission }) {
  const moduleName = module || (permission ? permission.split('.')[0] : 'este módulo')

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-red-50 border-b border-red-100 px-6 py-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Lock size={22} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Acceso Denegado</h2>
            <p className="text-xs text-red-700 uppercase tracking-wide font-semibold">403 · Permiso insuficiente</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-md px-4 py-3">
            <Shield size={18} className="text-slate-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">No tienes permiso para acceder a {moduleName}</p>
              <p className="text-xs text-slate-600 mt-1">
                Contacta al administrador del sistema para solicitar los permisos necesarios.
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={15} />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
