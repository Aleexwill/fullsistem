import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore, User } from '../stores/authStore'
import { permissionService, MODULES, ACTIONS, ModuleKey, ActionKey, Permission, RoleTemplate, ROLE_TEMPLATES } from '../services/permissionService'
import { activityService, UserActivity, UserProductivityReport } from '../services/activityService'
import {
  Shield, ShieldAlert, ShieldCheck, ShieldOff, Users, UserPlus, UserCog, UserX,
  Search, Filter, MoreVertical, Lock, Unlock, Key, Eye, EyeOff, Edit2, Trash2,
  Check, X, ChevronDown, ChevronRight, Clock, Activity, BarChart3, FileText,
  AlertTriangle, AlertCircle, CheckCircle, Info, Download, RefreshCw, Settings,
  Mail, Phone, Building2, Calendar, Loader2, ArrowUpDown, TrendingUp, Zap,
  Copy, Star, Hash
} from 'lucide-react'

// ==================== TIPOS ====================

type Tab = 'users' | 'roles' | 'activity' | 'reports'
type UserModalType = 'edit' | 'permissions' | 'activity' | 'block' | 'password' | null

// ==================== COMPONENTE PRINCIPAL ====================

export default function UserManagement() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('users')

  if (user?.user_type !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ShieldOff size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Acceso Restringido</h2>
          <p className="text-gray-500 mt-2">No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    )
  }

  // Generar datos demo al iniciar
  activityService.generateDemoActivities()

  const tabs = [
    { id: 'users' as Tab, label: 'Usuarios', icon: Users, count: useAuthStore.getState().users.length },
    { id: 'roles' as Tab, label: 'Roles y Permisos', icon: Shield },
    { id: 'activity' as Tab, label: 'Actividad', icon: Activity },
    { id: 'reports' as Tab, label: 'Reportes', icon: BarChart3 },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldCheck className="text-indigo-600" size={28} />
            Gestión de Usuarios y Permisos
          </h1>
          <p className="text-gray-500 text-sm mt-1">Administra usuarios, roles, permisos y monitorea actividad del sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-white shadow text-indigo-700' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'roles' && <RolesTab />}
      {activeTab === 'activity' && <ActivityTab />}
      {activeTab === 'reports' && <ReportsTab />}
    </div>
  )
}

// ==================== TAB: USUARIOS ====================

function UsersTab() {
  const { users, user: currentUser, blockUser, unblockUser, changeUserRole, resetUserPassword, deleteUser, updateUser } = useAuthStore()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortField, setSortField] = useState<'name' | 'role' | 'last_login' | 'created'>('name')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalType, setModalType] = useState<UserModalType>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const allRoles = permissionService.getAllRoles()

  const filteredUsers = useMemo(() => {
    let result = [...users]
    
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(u => 
        u.full_name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        (u.company_name || '').toLowerCase().includes(s) ||
        (u.department || '').toLowerCase().includes(s)
      )
    }

    if (filterRole !== 'all') {
      result = result.filter(u => (u.role_id || u.user_type) === filterRole)
    }

    if (filterStatus === 'active') result = result.filter(u => u.is_active !== false && !u.is_blocked)
    else if (filterStatus === 'blocked') result = result.filter(u => u.is_blocked)
    else if (filterStatus === 'inactive') result = result.filter(u => u.is_active === false)

    result.sort((a, b) => {
      if (sortField === 'name') return a.full_name.localeCompare(b.full_name)
      if (sortField === 'role') return (a.role_id || '').localeCompare(b.role_id || '')
      if (sortField === 'last_login') return (b.last_login_at || '').localeCompare(a.last_login_at || '')
      return b.created_at.localeCompare(a.created_at)
    })

    return result
  }, [users, search, filterRole, filterStatus, sortField])

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.is_active !== false && !u.is_blocked).length,
    blocked: users.filter(u => u.is_blocked).length,
    admins: users.filter(u => u.user_type === 'admin').length,
    recentLogins: users.filter(u => {
      if (!u.last_login_at) return false
      const diff = Date.now() - new Date(u.last_login_at).getTime()
      return diff < 24 * 3600000
    }).length,
  }), [users])

  const getRoleBadge = (user: User) => {
    const role = allRoles.find(r => r.id === (user.role_id || user.user_type))
    if (!role) return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">{user.user_type}</span>
    const colors: Record<string, string> = {
      red: 'bg-red-100 text-red-700', purple: 'bg-purple-100 text-purple-700',
      indigo: 'bg-indigo-100 text-indigo-700', blue: 'bg-blue-100 text-blue-700',
      orange: 'bg-orange-100 text-orange-700', emerald: 'bg-emerald-100 text-emerald-700',
      cyan: 'bg-cyan-100 text-cyan-700', pink: 'bg-pink-100 text-pink-700',
      amber: 'bg-amber-100 text-amber-700', green: 'bg-green-100 text-green-700',
      teal: 'bg-teal-100 text-teal-700', gray: 'bg-gray-100 text-gray-700',
    }
    return <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${colors[role.color] || 'bg-gray-100 text-gray-700'}`}>{role.name}</span>
  }

  const getStatusBadge = (user: User) => {
    if (user.is_blocked) return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-medium flex items-center gap-1"><Lock size={10} />Bloqueado</span>
    if (user.is_active === false) return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">Inactivo</span>
    return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle size={10} />Activo</span>
  }

  const openModal = (user: User, type: UserModalType) => {
    setSelectedUser(user)
    setModalType(type)
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total Usuarios', value: stats.total, icon: Users, color: 'indigo' },
          { label: 'Activos', value: stats.active, icon: CheckCircle, color: 'green' },
          { label: 'Bloqueados', value: stats.blocked, icon: Lock, color: 'red' },
          { label: 'Administradores', value: stats.admins, icon: Shield, color: 'purple' },
          { label: 'Login Hoy', value: stats.recentLogins, icon: Activity, color: 'blue' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={16} className={`text-${stat.color}-500`} />
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, empresa, departamento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="all">Todos los roles</option>
            {allRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="blocked">Bloqueados</option>
            <option value="inactive">Inactivos</option>
          </select>
          <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            <UserPlus size={16} />Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer" onClick={() => setSortField('role')}>
                <span className="flex items-center gap-1">Rol <ArrowUpDown size={12} /></span>
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Departamento</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer" onClick={() => setSortField('last_login')}>
                <span className="flex items-center gap-1">Último Acceso <ArrowUpDown size={12} /></span>
              </th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.map(u => (
              <tr key={u.id} className={`hover:bg-gray-50 ${u.is_blocked ? 'bg-red-50/30' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      u.is_blocked ? 'bg-red-400' : u.user_type === 'admin' ? 'bg-indigo-500' : 'bg-gray-400'
                    }`}>
                      {u.first_name[0]}{u.last_name[0]}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{u.full_name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{getRoleBadge(u)}</td>
                <td className="px-4 py-3">{getStatusBadge(u)}</td>
                <td className="px-4 py-3">
                  <div className="text-gray-700">{u.department || '-'}</div>
                  <div className="text-xs text-gray-500">{u.position || ''}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {u.last_login_at ? (
                    <div>
                      <div className="text-xs">{new Date(u.last_login_at).toLocaleDateString('es-PY')}</div>
                      <div className="text-xs text-gray-400">{new Date(u.last_login_at).toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ) : <span className="text-gray-400 text-xs">Nunca</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openModal(u, 'edit')} className="p-1.5 hover:bg-gray-100 rounded" title="Editar"><Edit2 size={14} className="text-gray-500" /></button>
                    <button onClick={() => openModal(u, 'permissions')} className="p-1.5 hover:bg-indigo-50 rounded" title="Permisos"><Shield size={14} className="text-indigo-500" /></button>
                    <button onClick={() => openModal(u, 'activity')} className="p-1.5 hover:bg-blue-50 rounded" title="Actividad"><Activity size={14} className="text-blue-500" /></button>
                    <button onClick={() => openModal(u, 'password')} className="p-1.5 hover:bg-yellow-50 rounded" title="Contraseña"><Key size={14} className="text-yellow-600" /></button>
                    {u.id !== '1' && (
                      u.is_blocked ? (
                        <button onClick={() => { unblockUser(u.id, currentUser?.full_name || '') }} className="p-1.5 hover:bg-green-50 rounded" title="Desbloquear"><Unlock size={14} className="text-green-500" /></button>
                      ) : (
                        <button onClick={() => openModal(u, 'block')} className="p-1.5 hover:bg-red-50 rounded" title="Bloquear"><Lock size={14} className="text-red-500" /></button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">No se encontraron usuarios con los filtros aplicados</div>
        )}
      </div>

      {/* Modales */}
      {selectedUser && modalType === 'edit' && <EditUserModal user={selectedUser} onClose={() => setModalType(null)} />}
      {selectedUser && modalType === 'permissions' && <PermissionsModal user={selectedUser} onClose={() => setModalType(null)} />}
      {selectedUser && modalType === 'activity' && <UserActivityModal user={selectedUser} onClose={() => setModalType(null)} />}
      {selectedUser && modalType === 'block' && <BlockUserModal user={selectedUser} onClose={() => setModalType(null)} />}
      {selectedUser && modalType === 'password' && <PasswordModal user={selectedUser} onClose={() => setModalType(null)} />}
      {showCreateForm && <CreateUserModal onClose={() => setShowCreateForm(false)} />}
    </div>
  )
}

// ==================== MODAL: EDITAR USUARIO ====================

function EditUserModal({ user: targetUser, onClose }: { user: User; onClose: () => void }) {
  const { updateUser, changeUserRole, user: currentUser } = useAuthStore()
  const allRoles = permissionService.getAllRoles()
  const [form, setForm] = useState({
    first_name: targetUser.first_name,
    last_name: targetUser.last_name,
    email: targetUser.email,
    phone: targetUser.phone,
    whatsapp: targetUser.whatsapp || targetUser.phone || '',
    company_name: targetUser.company_name || '',
    department: targetUser.department || '',
    position: targetUser.position || '',
    birthday: targetUser.birthday || '',
    role_id: targetUser.role_id || permissionService.mapLegacyUserType(targetUser.user_type),
  })

  const handleSave = () => {
    if (!form.first_name || !form.last_name || !form.email) { alert('Nombre, apellido y email son obligatorios'); return }
    
    // Si cambió el rol
    if (form.role_id !== (targetUser.role_id || permissionService.mapLegacyUserType(targetUser.user_type))) {
      changeUserRole(targetUser.id, form.role_id, currentUser?.full_name || '')
    }
    
    updateUser(targetUser.id, {
      first_name: form.first_name,
      last_name: form.last_name,
      full_name: `${form.first_name} ${form.last_name}`,
      email: form.email,
      phone: form.phone,
      whatsapp: form.whatsapp?.trim() || form.phone,
      company_name: form.company_name || undefined,
      department: form.department || undefined,
      position: form.position || undefined,
      birthday: form.birthday || undefined,
    })
    
    activityService.logCrud(
      currentUser?.id || '', currentUser?.full_name || '', currentUser?.email || '',
      'update', 'users', 'usuario', targetUser.full_name
    )
    
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between bg-indigo-50">
          <h3 className="font-semibold flex items-center gap-2"><Edit2 size={18} />Editar Usuario</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Nombre *</label>
              <input type="text" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Apellido *</label>
              <input type="text" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">Teléfono</label>
            <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">WhatsApp (legajo)</label>
            <input type="text" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Mismo que teléfono si aplica" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Empresa</label>
              <input type="text" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Fecha Nacimiento</label>
              <input type="date" value={form.birthday} onChange={e => setForm({ ...form, birthday: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Departamento</label>
              <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Cargo</label>
              <input type="text" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rol del Sistema</label>
            <select value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" disabled={targetUser.id === '1'}>
              {allRoles.map(r => <option key={r.id} value={r.id}>{r.name} - {r.description}</option>)}
            </select>
            {targetUser.id === '1' && <p className="text-xs text-gray-400 mt-1">El super administrador principal no puede cambiar de rol</p>}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Guardar Cambios</button>
        </div>
      </div>
    </div>
  )
}

// ==================== MODAL: PERMISOS ====================

function PermissionsModal({ user: targetUser, onClose }: { user: User; onClose: () => void }) {
  const { user: currentUser } = useAuthStore()
  const roleId = targetUser.role_id || permissionService.mapLegacyUserType(targetUser.user_type)
  const role = permissionService.getRoleById(roleId)
  const rolePerms = new Set(role?.permissions || [])
  
  const override = permissionService.getUserPermissionOverride(targetUser.id)
  const [customPerms, setCustomPerms] = useState<Set<string>>(new Set(override?.custom_permissions || []))
  const [deniedPerms, setDeniedPerms] = useState<Set<string>>(new Set(override?.denied_permissions || []))
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  const modules = Object.entries(MODULES) as [ModuleKey, typeof MODULES[ModuleKey]][]
  const actions = Object.entries(ACTIONS) as [ActionKey, typeof ACTIONS[ActionKey]][]

  const toggleModule = (mod: string) => {
    const next = new Set(expandedModules)
    next.has(mod) ? next.delete(mod) : next.add(mod)
    setExpandedModules(next)
  }

  const getPermState = (perm: Permission): 'role' | 'custom' | 'denied' | 'none' => {
    if (deniedPerms.has(perm)) return 'denied'
    if (customPerms.has(perm)) return 'custom'
    if (rolePerms.has(perm)) return 'role'
    return 'none'
  }

  const togglePerm = (perm: Permission) => {
    const state = getPermState(perm)
    const nextCustom = new Set(customPerms)
    const nextDenied = new Set(deniedPerms)
    
    if (state === 'none') {
      nextCustom.add(perm) // Agregar permiso extra
    } else if (state === 'role') {
      nextDenied.add(perm) // Denegar permiso del rol
    } else if (state === 'custom') {
      nextCustom.delete(perm) // Quitar permiso extra
    } else if (state === 'denied') {
      nextDenied.delete(perm) // Restaurar permiso del rol
    }
    
    setCustomPerms(nextCustom)
    setDeniedPerms(nextDenied)
  }

  const handleSave = () => {
    if (customPerms.size > 0 || deniedPerms.size > 0) {
      permissionService.setUserPermissionOverride({
        user_id: targetUser.id,
        role_id: roleId,
        custom_permissions: Array.from(customPerms) as Permission[],
        denied_permissions: Array.from(deniedPerms) as Permission[],
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.full_name || '',
      })
    } else {
      permissionService.removeUserPermissionOverride(targetUser.id)
    }
    
    activityService.logUserAction(
      currentUser?.id || '', currentUser?.full_name || '', currentUser?.email || '',
      'permission_changed', 'users', 'Cambio de permisos',
      `Permisos actualizados para ${targetUser.full_name}`,
      'critical',
      { custom: customPerms.size, denied: deniedPerms.size }
    )
    
    onClose()
  }

  const effectivePerms = permissionService.resolveUserPermissions(targetUser.id, targetUser.user_type, roleId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between bg-indigo-50">
          <div>
            <h3 className="font-semibold flex items-center gap-2"><Shield size={18} />Permisos de {targetUser.full_name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Rol base: <strong>{role?.name || roleId}</strong> · {effectivePerms.length} permisos efectivos</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded"><X size={18} /></button>
        </div>
        
        <div className="p-4 bg-blue-50 border-b">
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Del rol ({rolePerms.size})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> Extra ({customPerms.size})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" /> Denegado ({deniedPerms.size})</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-300" /> Sin acceso</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {modules.map(([modKey, modInfo]) => {
              const isExpanded = expandedModules.has(modKey)
              const modPerms = actions.map(([actKey]) => `${modKey}.${actKey}` as Permission)
              const activeCount = modPerms.filter(p => getPermState(p) === 'role' || getPermState(p) === 'custom').length
              
              return (
                <div key={modKey} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleModule(modKey)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="font-medium text-sm">{modInfo.label}</span>
                      <span className="text-xs text-gray-400">{modInfo.description}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${activeCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {activeCount}/{actions.length}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="px-4 py-3 bg-gray-50 border-t grid grid-cols-4 gap-2">
                      {actions.map(([actKey, actInfo]) => {
                        const perm = `${modKey}.${actKey}` as Permission
                        const state = getPermState(perm)
                        const stateColors = {
                          role: 'bg-green-100 border-green-300 text-green-800',
                          custom: 'bg-blue-100 border-blue-300 text-blue-800',
                          denied: 'bg-red-100 border-red-300 text-red-800 line-through',
                          none: 'bg-white border-gray-200 text-gray-500',
                        }
                        return (
                          <button
                            key={actKey}
                            onClick={() => togglePerm(perm)}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium text-center transition-all ${stateColors[state]}`}
                          >
                            {actInfo.label}
                            {state === 'role' && <CheckCircle size={10} className="inline ml-1" />}
                            {state === 'custom' && <Star size={10} className="inline ml-1" />}
                            {state === 'denied' && <X size={10} className="inline ml-1" />}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-4 border-t flex justify-between items-center">
          <span className="text-xs text-gray-500">{effectivePerms.length} permisos efectivos totales</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Guardar Permisos</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== MODAL: ACTIVIDAD DE USUARIO ====================

function UserActivityModal({ user: targetUser, onClose }: { user: User; onClose: () => void }) {
  const activities = activityService.getRecentUserActivities(targetUser.id, 50)
  const sessions = activityService.getUserSessions(targetUser.id, 20)

  const [tab, setTab] = useState<'activities' | 'sessions'>('activities')

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical') return <AlertTriangle size={14} className="text-red-500" />
    if (severity === 'warning') return <AlertCircle size={14} className="text-yellow-500" />
    return <Info size={14} className="text-blue-500" />
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      login: <CheckCircle size={14} className="text-green-500" />,
      logout: <X size={14} className="text-gray-500" />,
      create: <UserPlus size={14} className="text-blue-500" />,
      update: <Edit2 size={14} className="text-yellow-500" />,
      delete: <Trash2 size={14} className="text-red-500" />,
      view: <Eye size={14} className="text-gray-500" />,
      user_blocked: <Lock size={14} className="text-red-500" />,
      user_unblocked: <Unlock size={14} className="text-green-500" />,
      password_change: <Key size={14} className="text-yellow-500" />,
    }
    return icons[type] || <Activity size={14} className="text-gray-400" />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between bg-blue-50">
          <div>
            <h3 className="font-semibold flex items-center gap-2"><Activity size={18} />Actividad de {targetUser.full_name}</h3>
            <p className="text-xs text-gray-500">{targetUser.email}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded"><X size={18} /></button>
        </div>

        <div className="flex gap-1 p-3 bg-gray-50 border-b">
          <button onClick={() => setTab('activities')} className={`px-3 py-1.5 rounded text-sm ${tab === 'activities' ? 'bg-white shadow font-medium' : 'text-gray-600'}`}>Actividades ({activities.length})</button>
          <button onClick={() => setTab('sessions')} className={`px-3 py-1.5 rounded text-sm ${tab === 'sessions' ? 'bg-white shadow font-medium' : 'text-gray-600'}`}>Sesiones ({sessions.length})</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === 'activities' ? (
            <div className="divide-y">
              {activities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Sin actividades registradas</div>
              ) : activities.map(a => (
                <div key={a.id} className="px-4 py-3 hover:bg-gray-50 flex items-start gap-3">
                  {getTypeIcon(a.type)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800">{a.description}</div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                      <span>{new Date(a.created_at).toLocaleString('es-PY')}</span>
                      <span className="text-gray-300">·</span>
                      <span>{a.module}</span>
                    </div>
                  </div>
                  {getSeverityIcon(a.severity)}
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Sin sesiones registradas</div>
              ) : sessions.map(s => {
                const start = new Date(s.started_at)
                const end = s.ended_at ? new Date(s.ended_at) : null
                const duration = end ? Math.round((end.getTime() - start.getTime()) / 60000) : null
                return (
                  <div key={s.id} className="px-4 py-3 hover:bg-gray-50 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    <div className="flex-1">
                      <div className="text-sm">{start.toLocaleDateString('es-PY')} {start.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-xs text-gray-400">{s.actions_performed} acciones</div>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      {duration ? `${duration} min` : 'Activa'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== MODAL: BLOQUEAR USUARIO ====================

function BlockUserModal({ user: targetUser, onClose }: { user: User; onClose: () => void }) {
  const { blockUser, user: currentUser } = useAuthStore()
  const [reason, setReason] = useState('')

  const reasons = [
    'Violación de políticas de uso',
    'Actividad sospechosa detectada',
    'Solicitud del usuario',
    'Cuenta duplicada',
    'Fin de contrato laboral',
    'Acceso no autorizado',
    'Otro (especificar)',
  ]

  const handleBlock = () => {
    if (!reason) { alert('Debes especificar un motivo'); return }
    blockUser(targetUser.id, reason, currentUser?.full_name || '')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b bg-red-50">
          <h3 className="font-semibold text-red-700 flex items-center gap-2"><Lock size={18} />Bloquear Usuario</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-medium">
              {targetUser.first_name[0]}{targetUser.last_name[0]}
            </div>
            <div>
              <div className="font-medium">{targetUser.full_name}</div>
              <div className="text-xs text-gray-500">{targetUser.email}</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Motivo del bloqueo *</label>
            <select onChange={e => { if (e.target.value !== 'Otro (especificar)') setReason(e.target.value) }} className="w-full px-3 py-2 border rounded-lg text-sm mb-2">
              <option value="">Seleccionar motivo...</option>
              {reasons.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Describe el motivo del bloqueo..."
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows={3}
            />
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
            <AlertTriangle size={14} className="inline mr-1" />
            Al bloquear el usuario, no podrá iniciar sesión ni acceder al sistema. Esta acción se registra en el historial de auditoría.
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleBlock} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Bloquear Usuario</button>
        </div>
      </div>
    </div>
  )
}

// ==================== MODAL: CONTRASEÑA ====================

function PasswordModal({ user: targetUser, onClose }: { user: User; onClose: () => void }) {
  const { resetUserPassword, user: currentUser } = useAuthStore()
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleReset = () => {
    const pwd = resetUserPassword(targetUser.id, currentUser?.full_name || '')
    setTempPassword(pwd)
  }

  const copyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b bg-yellow-50">
          <h3 className="font-semibold text-yellow-700 flex items-center gap-2"><Key size={18} />Gestión de Contraseña</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-medium">
              {targetUser.first_name[0]}{targetUser.last_name[0]}
            </div>
            <div>
              <div className="font-medium">{targetUser.full_name}</div>
              <div className="text-xs text-gray-500">{targetUser.email}</div>
              {targetUser.password_changed_at && (
                <div className="text-xs text-gray-400 mt-0.5">
                  Último cambio: {new Date(targetUser.password_changed_at).toLocaleDateString('es-PY')}
                  {targetUser.last_password_reset_by && ` por ${targetUser.last_password_reset_by}`}
                </div>
              )}
            </div>
          </div>

          {tempPassword ? (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle size={24} className="mx-auto text-green-500 mb-2" />
                <p className="text-sm text-green-700 font-medium">Contraseña restablecida correctamente</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <code className="bg-white border px-4 py-2 rounded-lg text-lg font-mono tracking-wide">{tempPassword}</code>
                  <button onClick={copyPassword} className="p-2 hover:bg-green-100 rounded-lg">
                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-gray-500" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">El usuario deberá cambiar la contraseña al iniciar sesión</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                <AlertTriangle size={14} className="inline mr-1" />
                Se generará una contraseña temporal. Esta acción se registra en el historial de auditoría.
              </div>
              <button onClick={handleReset} className="w-full py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 flex items-center justify-center gap-2">
                <RefreshCw size={16} />Restablecer Contraseña
              </button>
            </div>
          )}
        </div>
        <div className="p-4 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cerrar</button>
        </div>
      </div>
    </div>
  )
}

// ==================== MODAL: CREAR USUARIO ====================

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const { updateUser, users } = useAuthStore()
  const { user: currentUser } = useAuthStore()
  const allRoles = permissionService.getAllRoles()
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', whatsapp: '', company_name: '', department: '', position: '', birthday: '', role_id: 'operator',
  })
  const [error, setError] = useState('')

  const handleCreate = () => {
    if (!form.first_name || !form.last_name || !form.email) { setError('Nombre, apellido y email son obligatorios'); return }
    if (users.find(u => u.email.toLowerCase() === form.email.toLowerCase())) { setError('Email ya registrado'); return }

    const role = permissionService.getRoleById(form.role_id)
    let userType: User['user_type'] = 'admin'
    if (form.role_id === 'client') userType = 'client'
    else if (form.role_id === 'supplier') userType = 'supplier'
    else if (form.role_id === 'technician') userType = 'technician'

    const newUser: User = {
      id: String(Date.now()),
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      full_name: `${form.first_name} ${form.last_name}`,
      phone: form.phone,
      whatsapp: (form.whatsapp && form.whatsapp.trim()) ? form.whatsapp.trim() : (form.phone || ''),
      user_type: userType,
      roles: [form.role_id],
      role_id: form.role_id,
      company_name: form.company_name || undefined,
      department: form.department || undefined,
      position: form.position || undefined,
      birthday: form.birthday || undefined,
      created_at: new Date().toISOString(),
      is_active: true,
      is_blocked: false,
      password_reset_required: true,
    }

    // Agregar directamente al store
    const updatedUsers = [...users, newUser]
    const storeData = { user: useAuthStore.getState().user, token: useAuthStore.getState().token, users: updatedUsers }
    localStorage.setItem('sosc-auth-v4', JSON.stringify(storeData))
    useAuthStore.setState({ users: updatedUsers })

    activityService.logCrud(
      currentUser?.id || '', currentUser?.full_name || '', currentUser?.email || '',
      'create', 'users', 'usuario', newUser.full_name
    )

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b bg-green-50">
          <h3 className="font-semibold flex items-center gap-2 text-green-700"><UserPlus size={18} />Crear Nuevo Usuario</h3>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Nombre *</label>
              <input type="text" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Apellido *</label>
              <input type="text" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">Teléfono</label>
            <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium mb-1">WhatsApp (legajo)</label>
            <input type="text" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Opcional; por defecto igual al teléfono" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Empresa</label>
              <input type="text" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Fecha Nacimiento</label>
              <input type="date" value={form.birthday} onChange={e => setForm({ ...form, birthday: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Departamento</label>
              <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Cargo</label>
              <input type="text" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rol del Sistema *</label>
            <select value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
              {allRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {permissionService.getRoleById(form.role_id) && (
              <p className="text-xs text-gray-500 mt-1">{permissionService.getRoleById(form.role_id)?.description}</p>
            )}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
          <button onClick={handleCreate} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Crear Usuario</button>
        </div>
      </div>
    </div>
  )
}

// ==================== TAB: ROLES Y PERMISOS ====================

function RolesTab() {
  const allRoles = permissionService.getAllRoles()
  const [selectedRole, setSelectedRole] = useState<RoleTemplate | null>(null)

  const colors: Record<string, string> = {
    red: 'border-red-200 bg-red-50', purple: 'border-purple-200 bg-purple-50',
    indigo: 'border-indigo-200 bg-indigo-50', blue: 'border-blue-200 bg-blue-50',
    orange: 'border-orange-200 bg-orange-50', emerald: 'border-emerald-200 bg-emerald-50',
    cyan: 'border-cyan-200 bg-cyan-50', pink: 'border-pink-200 bg-pink-50',
    amber: 'border-amber-200 bg-amber-50', green: 'border-green-200 bg-green-50',
    teal: 'border-teal-200 bg-teal-50', gray: 'border-gray-200 bg-gray-50',
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {allRoles.map(role => {
          const grouped = permissionService.groupPermissionsByModule(role.permissions)
          const moduleCount = Object.keys(grouped).length
          return (
            <div
              key={role.id}
              onClick={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}
              className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedRole?.id === role.id ? 'ring-2 ring-indigo-400' : ''
              } ${colors[role.color] || 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{role.name}</h3>
                {role.isSystem && <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">Sistema</span>}
              </div>
              <p className="text-xs text-gray-600 mb-3">{role.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{role.permissions.length} permisos</span>
                <span>{moduleCount} módulos</span>
                <span>Nivel {role.hierarchy}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Detalle del rol */}
      {selectedRole && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Shield size={20} className="text-indigo-500" />
            Permisos de "{selectedRole.name}"
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {(Object.entries(MODULES) as [ModuleKey, typeof MODULES[ModuleKey]][]).map(([modKey, modInfo]) => {
              const grouped = permissionService.groupPermissionsByModule(selectedRole.permissions)
              const modActions = grouped[modKey] || []
              if (modActions.length === 0) return null
              return (
                <div key={modKey} className="border rounded-lg p-3">
                  <div className="font-medium text-sm mb-2">{modInfo.label}</div>
                  <div className="flex flex-wrap gap-1">
                    {modActions.map(action => (
                      <span key={action} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                        {ACTIONS[action]?.label || action}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== TAB: ACTIVIDAD ====================

function ActivityTab() {
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)

  const { data } = useQuery({
    queryKey: ['user-activities', filterType, filterSeverity, search, page],
    queryFn: () => activityService.getActivities({
      type: filterType === 'all' ? undefined : filterType as any,
      severity: filterSeverity === 'all' ? undefined : filterSeverity as any,
      search: search || undefined,
      limit: 30,
      offset: page * 30,
    })
  })

  const summary = useQuery({
    queryKey: ['activity-summary'],
    queryFn: () => activityService.getSystemActivitySummary()
  })

  const getSeverityBadge = (severity: string) => {
    if (severity === 'critical') return <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">Crítico</span>
    if (severity === 'warning') return <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Alerta</span>
    return <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Info</span>
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      {summary.data && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-xs text-gray-500 mb-1">Total Actividades</div>
            <div className="text-2xl font-bold">{summary.data.total_activities}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-xs text-gray-500 mb-1">Sesiones</div>
            <div className="text-2xl font-bold">{summary.data.total_sessions}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-xs text-gray-500 mb-1">Usuarios Activos</div>
            <div className="text-2xl font-bold">{summary.data.active_users}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-xs text-gray-500 mb-1">Eventos Críticos</div>
            <div className="text-2xl font-bold text-red-600">{summary.data.critical_events.length}</div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg border p-4 flex gap-3 items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar actividades..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(0) }} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">Todas las acciones</option>
          <option value="login">Inicios de sesión</option>
          <option value="create">Creaciones</option>
          <option value="update">Modificaciones</option>
          <option value="delete">Eliminaciones</option>
          <option value="user_blocked">Bloqueos</option>
          <option value="password_change">Cambios de contraseña</option>
          <option value="user_role_changed">Cambios de rol</option>
        </select>
        <select value={filterSeverity} onChange={e => { setFilterSeverity(e.target.value); setPage(0) }} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">Toda severidad</option>
          <option value="info">Info</option>
          <option value="warning">Alerta</option>
          <option value="critical">Crítico</option>
        </select>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha/Hora</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Usuario</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Acción</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Descripción</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Severidad</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.items.map(a => (
              <tr key={a.id} className={`hover:bg-gray-50 ${a.severity === 'critical' ? 'bg-red-50/30' : ''}`}>
                <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{new Date(a.created_at).toLocaleString('es-PY')}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{a.user_name}</td>
                <td className="px-4 py-2.5 text-gray-600">{a.action}</td>
                <td className="px-4 py-2.5 text-gray-500 max-w-xs truncate">{a.description}</td>
                <td className="px-4 py-2.5">{getSeverityBadge(a.severity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.total > 30 && (
          <div className="p-3 border-t flex items-center justify-between">
            <span className="text-xs text-gray-500">{data.total} actividades totales</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1 border rounded text-xs disabled:opacity-50">Anterior</button>
              <span className="px-3 py-1 text-xs">Pág. {page + 1}</span>
              <button onClick={() => setPage(page + 1)} disabled={(page + 1) * 30 >= data.total} className="px-3 py-1 border rounded text-xs disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ==================== TAB: REPORTES ====================

function ReportsTab() {
  const { users } = useAuthStore()
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])
  const [report, setReport] = useState<UserProductivityReport | null>(null)

  const generateReport = () => {
    if (!selectedUserId) { alert('Selecciona un usuario'); return }
    const r = activityService.getUserProductivityReport(selectedUserId, dateFrom, dateTo + 'T23:59:59')
    setReport(r)
  }

  const formatMinutes = (min: number) => {
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${h}h ${m}m`
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-lg border p-4 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Usuario</label>
          <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Seleccionar usuario...</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Desde</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hasta</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
        </div>
        <button onClick={generateReport} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2">
          <BarChart3 size={16} />Generar Reporte
        </button>
      </div>

      {/* Reporte */}
      {report && (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border p-4">
              <div className="text-xs text-gray-500">Sesiones</div>
              <div className="text-2xl font-bold mt-1">{report.total_sessions}</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-xs text-gray-500">Tiempo Total</div>
              <div className="text-2xl font-bold mt-1">{formatMinutes(report.total_time_minutes)}</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-xs text-gray-500">Promedio Sesión</div>
              <div className="text-2xl font-bold mt-1">{formatMinutes(report.avg_session_minutes)}</div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-xs text-gray-500">Total Acciones</div>
              <div className="text-2xl font-bold mt-1">{report.total_actions}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Módulos más usados */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-sm mb-3">Módulos Más Utilizados</h4>
              {report.most_used_modules.length === 0 ? (
                <p className="text-gray-400 text-sm">Sin datos</p>
              ) : (
                <div className="space-y-2">
                  {report.most_used_modules.map(m => {
                    const maxCount = report.most_used_modules[0]?.count || 1
                    return (
                      <div key={m.module} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-28 truncate">{MODULES[m.module as ModuleKey]?.label || m.module}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(m.count / maxCount) * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{m.count}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Horas pico */}
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-sm mb-3">Distribución por Hora</h4>
              {report.peak_hours.length === 0 ? (
                <p className="text-gray-400 text-sm">Sin datos</p>
              ) : (
                <div className="flex items-end gap-1 h-32">
                  {Array.from({ length: 24 }, (_, h) => {
                    const hourData = report.peak_hours.find(p => p.hour === h)
                    const count = hourData?.count || 0
                    const maxCount = Math.max(...report.peak_hours.map(p => p.count), 1)
                    return (
                      <div key={h} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="w-full bg-indigo-200 rounded-t" style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? '4px' : '0px' }} />
                        {h % 4 === 0 && <span className="text-[8px] text-gray-400">{h}h</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Actividad diaria */}
          {report.daily_activity.length > 0 && (
            <div className="bg-white rounded-lg border p-4">
              <h4 className="font-medium text-sm mb-3">Actividad Diaria</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">Fecha</th>
                      <th className="text-right px-3 py-2">Acciones</th>
                      <th className="text-right px-3 py-2">Tiempo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.daily_activity.slice(-14).map(d => (
                      <tr key={d.date} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{new Date(d.date + 'T12:00:00').toLocaleDateString('es-PY', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                        <td className="px-3 py-2 text-right">{d.actions}</td>
                        <td className="px-3 py-2 text-right">{formatMinutes(d.minutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
