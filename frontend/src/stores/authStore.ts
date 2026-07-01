import { create } from 'zustand'
import { notifyNewUserRegistered } from '../services/notificationService'
import { activityService } from '../services/activityService'
import { permissionService } from '../services/permissionService'
import {
  rateLimiter,
  sessionManager,
  multiTabSync,
  generateSecureToken,
  clearSensitiveSessionData,
  passwordStore,
} from '../services/securityService'
import { auditService } from '../services/audit'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  /** WhatsApp (legajo / convocatorias). */
  whatsapp?: string
  user_type: 'client' | 'supplier' | 'technician' | 'admin'
  roles: string[]
  role_id?: string // Rol RBAC asignado (del permissionService)
  company_name?: string
  birthday?: string
  avatar_url?: string
  department?: string
  position?: string
  created_at: string
  updated_at?: string
  last_login_at?: string
  // Control de acceso
  is_active: boolean
  is_blocked: boolean
  blocked_at?: string
  blocked_reason?: string
  blocked_by?: string
  // Seguridad
  password_changed_at?: string
  password_reset_required?: boolean
  login_attempts?: number
  last_password_reset_by?: string
}

export interface UpdateProfileData {
  first_name?: string
  last_name?: string
  phone?: string
  whatsapp?: string
  company_name?: string
  birthday?: string
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone: string
  whatsapp?: string
  user_type: 'client' | 'supplier' | 'technician'
  company_name?: string
  birthday?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  users: User[]
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<void>
  updateUser: (userId: string, data: Partial<User>) => void
  deleteUser: (userId: string) => void
  blockUser: (userId: string, reason: string, blockedBy: string) => void
  unblockUser: (userId: string, unblockedBy: string) => void
  changeUserRole: (userId: string, newRoleId: string, changedBy: string) => void
  resetUserPassword: (userId: string, resetBy: string) => string
  logout: () => void
}

// Usuarios demo pre-registrados
const DEMO_USERS: User[] = [
  {
    id: '1',
    email: 'admin@sosc.com',
    first_name: 'Admin',
    last_name: 'Sistema',
    full_name: 'Admin Sistema',
    phone: '0981 000 000',
    whatsapp: '0981 000 000',
    user_type: 'admin',
    roles: ['admin'],
    role_id: 'super_admin',
    birthday: '1985-03-15',
    department: 'Dirección',
    position: 'Director General',
    created_at: '2026-01-01T00:00:00Z',
    is_active: true,
    is_blocked: false,
    last_login_at: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'carlos@tecnico.com',
    first_name: 'Carlos',
    last_name: 'Méndez',
    full_name: 'Carlos Méndez',
    phone: '0981 111 111',
    whatsapp: '0981 111 111',
    user_type: 'technician',
    roles: ['technician'],
    role_id: 'technician',
    birthday: '1990-01-28',
    department: 'Operaciones',
    position: 'Técnico Senior',
    created_at: '2026-01-15T00:00:00Z',
    is_active: true,
    is_blocked: false,
  },
  {
    id: '3',
    email: 'cliente@stock.com',
    first_name: 'Juan',
    last_name: 'Pérez',
    full_name: 'Juan Pérez',
    phone: '0982 222 222',
    whatsapp: '0982 222 222',
    user_type: 'client',
    roles: ['client'],
    role_id: 'client',
    company_name: 'Supermercado Stock S.A.',
    birthday: '1988-02-14',
    created_at: '2026-01-20T00:00:00Z',
    is_active: true,
    is_blocked: false,
  },
  {
    id: '4',
    email: 'proveedor@seguridad.com',
    first_name: 'María',
    last_name: 'González',
    full_name: 'María González',
    phone: '0983 333 333',
    whatsapp: '0983 333 333',
    user_type: 'supplier',
    roles: ['supplier'],
    role_id: 'supplier',
    company_name: 'Seguridad Total S.R.L.',
    birthday: '1992-06-20',
    created_at: '2026-01-22T00:00:00Z',
    is_active: true,
    is_blocked: false,
  },
  {
    id: '5',
    email: 'contadora@sosc.com',
    first_name: 'Ana',
    last_name: 'Ramírez',
    full_name: 'Ana Ramírez',
    phone: '0984 444 444',
    whatsapp: '0984 444 444',
    user_type: 'admin',
    roles: ['admin'],
    role_id: 'accountant',
    department: 'Contabilidad',
    position: 'Contadora General',
    created_at: '2026-01-10T00:00:00Z',
    is_active: true,
    is_blocked: false,
  },
  {
    id: '6',
    email: 'ventas@sosc.com',
    first_name: 'Roberto',
    last_name: 'Acuña',
    full_name: 'Roberto Acuña',
    phone: '0985 555 555',
    whatsapp: '0985 555 555',
    user_type: 'admin',
    roles: ['admin'],
    role_id: 'sales',
    department: 'Comercial',
    position: 'Ejecutivo de Ventas',
    created_at: '2026-01-12T00:00:00Z',
    is_active: true,
    is_blocked: false,
  },
  {
    id: '7',
    email: 'rrhh@sosc.com',
    first_name: 'Laura',
    last_name: 'Benítez',
    full_name: 'Laura Benítez',
    phone: '0986 666 666',
    whatsapp: '0986 666 666',
    user_type: 'admin',
    roles: ['admin'],
    role_id: 'hr_manager',
    department: 'Recursos Humanos',
    position: 'Jefa de RRHH',
    created_at: '2026-01-08T00:00:00Z',
    is_active: true,
    is_blocked: false,
  },
  {
    id: '8',
    email: 'supervisor@sosc.com',
    first_name: 'Diego',
    last_name: 'Villalba',
    full_name: 'Diego Villalba',
    phone: '0987 777 777',
    whatsapp: '0987 777 777',
    user_type: 'admin',
    roles: ['admin'],
    role_id: 'manager',
    department: 'Operaciones',
    position: 'Supervisor General',
    created_at: '2026-01-05T00:00:00Z',
    is_active: true,
    is_blocked: false,
  },
]

const STORAGE_KEY = 'sosc-auth-v4'

const withWhatsApp = (u: any): User => ({
  ...u,
  whatsapp: (u.whatsapp && String(u.whatsapp).trim()) ? u.whatsapp : (u.phone || ''),
})

// Migrar datos de v3 a v4
const migrateFromV3 = (): User[] | null => {
  try {
    const v3Data = localStorage.getItem('sosc-auth-v3')
    if (v3Data) {
      const parsed = JSON.parse(v3Data)
      if (parsed?.users && Array.isArray(parsed.users)) {
        // Migrar cada usuario con los campos nuevos
        return parsed.users.map((u: any) =>
          withWhatsApp({
            ...u,
            role_id: u.role_id || permissionService.mapLegacyUserType(u.user_type),
            is_active: u.is_active !== false,
            is_blocked: u.is_blocked || false,
            updated_at: u.updated_at || u.created_at,
          })
        )
      }
    }
  } catch { /* ignore */ }
  return null
}

const cleanAndLoad = (): { user: User | null; token: string | null; users: User[] } => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      if (parsed && typeof parsed === 'object') {
        const rawUsers = Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : DEMO_USERS
        const user = parsed.user ? withWhatsApp(parsed.user) : null
        return {
          user,
          token: parsed.token || null,
          users: rawUsers.map(withWhatsApp),
        }
      }
    }
    // Intentar migrar desde v3
    const migratedUsers = migrateFromV3()
    if (migratedUsers && migratedUsers.length > 0) {
      return { user: null, token: null, users: migratedUsers }
    }
  } catch (e) {
    console.error('Error loading auth data, resetting...', e)
    localStorage.removeItem(STORAGE_KEY)
  }
  return { user: null, token: null, users: DEMO_USERS }
}

const saveToStorage = (data: { user: User | null; token: string | null; users: User[] }) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Error saving auth data:', e)
  }
}

const initialData = cleanAndLoad()

let userCounter = 200

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialData.user,
  token: initialData.token,
  isAuthenticated: !!(initialData.user && initialData.token),
  users: initialData.users,

  login: async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 300))

    const normalizedEmail = email.trim().toLowerCase()

    // Verificar rate-limiting / bloqueo temporal por intentos fallidos
    if (rateLimiter.isLocked(normalizedEmail)) {
      const minutes = rateLimiter.getLockoutRemaining(normalizedEmail)
      throw new Error(`Demasiados intentos fallidos. Intenta nuevamente en ${minutes} minuto(s).`)
    }

    const { users } = get()
    let user = users.find(u => u.email.toLowerCase() === normalizedEmail)
    let updatedUsers = users

    // Si no existe el usuario, rechazar (ya no creamos usuarios al vuelo por seguridad)
    // Excepción: mantener compatibilidad con DEMO si la contraseña coincide con el email (modo demo abierto)
    if (!user) {
      const attempt = rateLimiter.recordFailedAttempt(normalizedEmail)
      auditService.log({
        user_id: 'anonymous',
        user_name: normalizedEmail,
        user_type: 'unknown',
        action: 'login',
        module: 'auth',
        description: `Intento fallido de login (usuario no existe)${attempt.locked ? ' - cuenta bloqueada' : ''}`,
      })
      throw new Error('Credenciales inválidas.')
    }

    // Si el usuario tiene un hash de contraseña registrado, verificar
    if (passwordStore.has(user.id)) {
      const valid = await passwordStore.verify(user.id, password)
      if (!valid) {
        const attempt = rateLimiter.recordFailedAttempt(normalizedEmail)
        activityService.logLogin(user.id, user.full_name, user.email, false)
        auditService.log({
          user_id: user.id,
          user_name: user.full_name,
          user_type: user.user_type,
          action: 'login',
          module: 'auth',
          description: `Intento fallido de login. Intentos restantes: ${attempt.remaining}${attempt.locked ? ' - cuenta bloqueada temporalmente' : ''}`,
        })
        // Actualizar contador en el usuario
        const newAttempts = (user.login_attempts || 0) + 1
        updatedUsers = updatedUsers.map(u => u.id === user!.id ? { ...u, login_attempts: newAttempts } : u)
        saveToStorage({ user: get().user, token: get().token, users: updatedUsers })
        set({ users: updatedUsers })
        if (attempt.locked) {
          throw new Error(`Cuenta bloqueada temporalmente por ${attempt.remaining === 0 ? 15 : attempt.remaining} minutos. Demasiados intentos fallidos.`)
        }
        throw new Error(`Credenciales inválidas. Te quedan ${attempt.remaining} intento(s).`)
      }
    }
    // Si no tiene hash, es modo demo: aceptar pero registrar advertencia

    // Verificar si está bloqueado
    if (user.is_blocked) {
      activityService.logLogin(user.id, user.full_name, user.email, false)
      auditService.log({
        user_id: user.id,
        user_name: user.full_name,
        user_type: user.user_type,
        action: 'login',
        module: 'auth',
        description: `Intento de login a cuenta bloqueada: ${user.blocked_reason || 'sin motivo'}`,
      })
      throw new Error(`Cuenta bloqueada. Motivo: ${user.blocked_reason || 'Contacte al administrador'}`)
    }

    // Verificar si está activo
    if (user.is_active === false) {
      activityService.logLogin(user.id, user.full_name, user.email, false)
      throw new Error('Cuenta desactivada. Contacte al administrador.')
    }

    // Login exitoso: resetear rate limiter
    rateLimiter.reset(normalizedEmail)

    // Actualizar último login
    user = { ...user, last_login_at: new Date().toISOString(), login_attempts: 0 }
    updatedUsers = updatedUsers.map(u => u.id === user!.id ? user! : u)

    // Token criptográficamente seguro
    const token = generateSecureToken()

    saveToStorage({ user, token, users: updatedUsers })

    // Iniciar sesión segura
    sessionManager.start(user.id, token)

    // Registrar actividad y auditoría
    activityService.logLogin(user.id, user.full_name, user.email, true)
    activityService.startSession(user.id, user.full_name)
    auditService.log({
      user_id: user.id,
      user_name: user.full_name,
      user_type: user.user_type,
      action: 'login',
      module: 'auth',
      description: `Inicio de sesión exitoso`,
    })

    // Notificar a otras pestañas
    multiTabSync.broadcast('login')

    set({
      user,
      token,
      isAuthenticated: true,
      users: updatedUsers
    })
  },

  register: async (data: RegisterData) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const { users } = get()
    
    if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('El email ya está registrado')
    }
    
    const user: User = {
      id: String(userCounter++),
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      full_name: `${data.first_name} ${data.last_name}`,
      phone: data.phone,
      whatsapp: (data.whatsapp && data.whatsapp.trim()) ? data.whatsapp.trim() : data.phone,
      user_type: data.user_type,
      roles: [data.user_type],
      role_id: permissionService.mapLegacyUserType(data.user_type),
      company_name: data.company_name,
      birthday: data.birthday,
      created_at: new Date().toISOString(),
      is_active: true,
      is_blocked: false,
    }
    
    const token = generateSecureToken()
    const updatedUsers = [...users, user]

    saveToStorage({ user, token, users: updatedUsers })

    // Guardar hash de contraseña
    if (data.password) {
      await passwordStore.set(user.id, data.password, false)
    }

    // Iniciar sesión segura
    sessionManager.start(user.id, token)

    notifyNewUserRegistered({
      full_name: user.full_name,
      email: user.email,
      user_type: user.user_type,
      company_name: user.company_name,
      id: user.id
    })

    activityService.logLogin(user.id, user.full_name, user.email, true)
    activityService.startSession(user.id, user.full_name)
    auditService.log({
      user_id: user.id,
      user_name: user.full_name,
      user_type: user.user_type,
      action: 'create',
      module: 'auth',
      description: `Nuevo usuario registrado: ${user.user_type}`,
      entity_type: 'user',
      entity_id: user.id,
      entity_name: user.full_name,
    })

    multiTabSync.broadcast('login')

    set({
      user,
      token,
      isAuthenticated: true,
      users: updatedUsers
    })
  },

  updateProfile: async (data: UpdateProfileData) => {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const { user, users, token } = get()
    if (!user) throw new Error('No hay usuario autenticado')
    
    const nextPhone = data.phone ?? user.phone
    const updatedUser: User = {
      ...user,
      first_name: data.first_name ?? user.first_name,
      last_name: data.last_name ?? user.last_name,
      full_name: `${data.first_name ?? user.first_name} ${data.last_name ?? user.last_name}`,
      phone: nextPhone,
      whatsapp: data.whatsapp !== undefined ? data.whatsapp : (user.whatsapp || nextPhone),
      company_name: data.company_name ?? user.company_name,
      birthday: data.birthday ?? user.birthday,
      updated_at: new Date().toISOString(),
    }
    
    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u)
    
    saveToStorage({ user: updatedUser, token, users: updatedUsers })
    
    activityService.logCrud(user.id, user.full_name, user.email, 'update', 'users', 'perfil', user.full_name)
    
    set({
      user: updatedUser,
      users: updatedUsers,
    })
  },

  updateUser: (userId: string, data: Partial<User>) => {
    const { users, user, token } = get()
    const updatedUsers = users.map(u => u.id === userId ? { ...u, ...data, updated_at: new Date().toISOString() } : u)
    const updatedUser = user?.id === userId ? { ...user, ...data, updated_at: new Date().toISOString() } : user
    
    saveToStorage({ user: updatedUser, token, users: updatedUsers })
    
    set({ 
      users: updatedUsers,
      user: updatedUser
    })
  },

  deleteUser: (userId: string) => {
    const { users, user, token } = get()
    if (userId === '1') return // Proteger super admin
    const targetUser = users.find(u => u.id === userId)
    const updatedUsers = users.filter(u => u.id !== userId)

    saveToStorage({ user, token, users: updatedUsers })

    // Limpiar hash de contraseña del usuario eliminado
    passwordStore.remove(userId)

    if (targetUser && user) {
      activityService.logCrud(user.id, user.full_name, user.email, 'delete', 'users', 'usuario', targetUser.full_name)
      auditService.log({
        user_id: user.id,
        user_name: user.full_name,
        user_type: user.user_type,
        action: 'delete',
        module: 'users',
        description: `Usuario eliminado: ${targetUser.full_name} (${targetUser.email})`,
        entity_type: 'user',
        entity_id: userId,
        entity_name: targetUser.full_name,
      })
    }

    set({ users: updatedUsers })
  },

  blockUser: (userId: string, reason: string, blockedBy: string) => {
    const { users, user, token } = get()
    if (userId === '1') return // Proteger super admin
    const targetUser = users.find(u => u.id === userId)
    const updatedUsers = users.map(u => u.id === userId ? {
      ...u,
      is_blocked: true,
      blocked_at: new Date().toISOString(),
      blocked_reason: reason,
      blocked_by: blockedBy,
      updated_at: new Date().toISOString(),
    } : u)

    saveToStorage({ user, token, users: updatedUsers })

    if (targetUser) {
      activityService.logUserBlocked(userId, targetUser.full_name, targetUser.email, blockedBy, reason)
      if (user) {
        auditService.log({
          user_id: user.id,
          user_name: user.full_name,
          user_type: user.user_type,
          action: 'status_change',
          module: 'users',
          description: `Cuenta bloqueada: ${targetUser.full_name} - Motivo: ${reason}`,
          entity_type: 'user',
          entity_id: userId,
          entity_name: targetUser.full_name,
        })
      }
    }

    set({ users: updatedUsers })
  },

  unblockUser: (userId: string, unblockedBy: string) => {
    const { users, user, token } = get()
    const targetUser = users.find(u => u.id === userId)
    const updatedUsers = users.map(u => u.id === userId ? {
      ...u,
      is_blocked: false,
      blocked_at: undefined,
      blocked_reason: undefined,
      blocked_by: undefined,
      updated_at: new Date().toISOString(),
    } : u)

    saveToStorage({ user, token, users: updatedUsers })

    if (targetUser) {
      activityService.logUserUnblocked(userId, targetUser.full_name, targetUser.email, unblockedBy)
      if (user) {
        auditService.log({
          user_id: user.id,
          user_name: user.full_name,
          user_type: user.user_type,
          action: 'status_change',
          module: 'users',
          description: `Cuenta desbloqueada: ${targetUser.full_name}`,
          entity_type: 'user',
          entity_id: userId,
          entity_name: targetUser.full_name,
        })
      }
    }

    set({ users: updatedUsers })
  },

  changeUserRole: (userId: string, newRoleId: string, changedBy: string) => {
    const { users, user, token } = get()
    if (userId === '1') return // Proteger super admin
    const targetUser = users.find(u => u.id === userId)
    const oldRole = targetUser?.role_id || targetUser?.user_type || 'unknown'
    
    // Determinar user_type basado en el rol
    const role = permissionService.getRoleById(newRoleId)
    let newUserType: User['user_type'] = 'admin'
    if (newRoleId === 'client') newUserType = 'client'
    else if (newRoleId === 'supplier') newUserType = 'supplier'
    else if (newRoleId === 'technician') newUserType = 'technician'
    
    const updatedUsers = users.map(u => u.id === userId ? {
      ...u,
      role_id: newRoleId,
      roles: [newRoleId],
      user_type: newUserType,
      updated_at: new Date().toISOString(),
    } : u)
    
    const updatedUser = user?.id === userId ? {
      ...user,
      role_id: newRoleId,
      roles: [newRoleId],
      user_type: newUserType,
      updated_at: new Date().toISOString(),
    } : user
    
    saveToStorage({ user: updatedUser, token, users: updatedUsers })
    
    if (targetUser) {
      activityService.logRoleChanged(userId, targetUser.full_name, targetUser.email, 
        role ? `${oldRole}` : oldRole, 
        role ? role.name : newRoleId, 
        changedBy)
    }
    
    set({ users: updatedUsers, user: updatedUser })
  },

  resetUserPassword: (userId: string, resetBy: string): string => {
    const { users, user, token } = get()
    const targetUser = users.find(u => u.id === userId)
    const tempPassword = `Temp${Math.random().toString(36).slice(2, 8).toUpperCase()}!`

    const updatedUsers = users.map(u => u.id === userId ? {
      ...u,
      password_changed_at: new Date().toISOString(),
      password_reset_required: true,
      last_password_reset_by: resetBy,
      updated_at: new Date().toISOString(),
    } : u)

    saveToStorage({ user, token, users: updatedUsers })

    // Persistir hash de la nueva contraseña temporal (usuario deberá cambiarla)
    passwordStore.set(userId, tempPassword, true).catch(() => {/* noop */})

    if (targetUser) {
      activityService.logPasswordChange(userId, targetUser.full_name, targetUser.email, resetBy)
      if (user) {
        auditService.log({
          user_id: user.id,
          user_name: user.full_name,
          user_type: user.user_type,
          action: 'config_change',
          module: 'users',
          description: `Contraseña reseteada para: ${targetUser.full_name}`,
          entity_type: 'user',
          entity_id: userId,
          entity_name: targetUser.full_name,
        })
      }
    }

    set({ users: updatedUsers })
    return tempPassword
  },

  logout: () => {
    const { users, user } = get()

    if (user) {
      activityService.logLogout(user.id, user.full_name, user.email)
      auditService.log({
        user_id: user.id,
        user_name: user.full_name,
        user_type: user.user_type,
        action: 'logout',
        module: 'auth',
        description: `Cierre de sesión`,
      })
    }

    // Cerrar sesión segura y limpiar datos sensibles
    sessionManager.end()
    clearSensitiveSessionData()

    // Notificar a otras pestañas
    multiTabSync.broadcast('logout')

    saveToStorage({ user: null, token: null, users })
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
