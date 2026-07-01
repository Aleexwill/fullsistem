import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore, User } from '../stores/authStore'
import { auditService, AuditLog, ACTION_LABELS, MODULE_LABELS } from '../services/audit'
import { configService, SystemConfig, WEEK_DAYS } from '../services/config'
import { ticketsService } from '../services/tickets'
import { SECURITY_CONFIG, rateLimiter, passwordStore, sessionManager, evaluatePasswordStrength } from '../services/securityService'
import { 
  Settings, Users, Shield, Activity, FileText, Download, Upload,
  ChevronRight, Save, RotateCcw, Eye, EyeOff, Mail, Lock, UserCheck,
  UserX, Edit2, Trash2, Search, Filter, Calendar, Clock, Building2,
  Phone, Globe, Palette, Bell, AlertTriangle, CheckCircle, XCircle,
  BarChart3, TrendingUp, PieChart, RefreshCw, Loader2, X, Image,
  DollarSign, FileDown, Printer, KeyRound, ShieldCheck, ShieldAlert, Timer, Fingerprint
} from 'lucide-react'

type TabType = 'users' | 'config' | 'audit' | 'security' | 'reports'

export default function AdminPanel() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('users')
  
  // Solo admin puede acceder
  if (user?.user_type !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield size={64} className="mx-auto text-red-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Acceso Restringido</h2>
          <p className="text-gray-500">Solo los administradores pueden acceder a este panel.</p>
        </div>
      </div>
    )
  }
  
  const tabs = [
    { id: 'users' as TabType, label: 'Usuarios', icon: Users },
    { id: 'config' as TabType, label: 'Configuración', icon: Settings },
    { id: 'security' as TabType, label: 'Seguridad', icon: Lock },
    { id: 'audit' as TabType, label: 'Auditoría', icon: Activity },
    { id: 'reports' as TabType, label: 'Reportes', icon: BarChart3 }
  ]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Shield size={28} />
          Panel de Administración
        </h1>
        <p className="text-purple-100 mt-1">Gestión del sistema, usuarios y configuraciones</p>
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex border-b overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-6">
          {activeTab === 'users' && <UsersManagement />}
          {activeTab === 'config' && <SystemConfiguration />}
          {activeTab === 'security' && <SecurityPanel />}
          {activeTab === 'audit' && <AuditLogs />}
          {activeTab === 'reports' && <Reports />}
        </div>
      </div>
    </div>
  )
}

// ==================== GESTIÓN DE USUARIOS ====================

function UsersManagement() {
  const { users, updateUser, deleteUser } = useAuthStore()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showResetPassword, setShowResetPassword] = useState<string | null>(null)
  
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
                         u.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = filterRole === 'all' || u.user_type === filterRole
    return matchesSearch && matchesRole
  })
  
  const handleToggleActive = (userId: string, currentStatus: boolean) => {
    updateUser(userId, { is_active: !currentStatus })
  }
  
  const handleChangeRole = (userId: string, newRole: User['user_type']) => {
    updateUser(userId, { user_type: newRole, roles: [newRole] })
  }
  
  const handleResetPassword = (userId: string) => {
    // Simular reset de contraseña
    alert(`Contraseña reseteada. Nueva contraseña temporal: temp123456`)
    setShowResetPassword(null)
  }
  
  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    technician: 'bg-blue-100 text-blue-700',
    client: 'bg-green-100 text-green-700',
    supplier: 'bg-orange-100 text-orange-700'
  }
  
  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    technician: 'Técnico',
    client: 'Cliente',
    supplier: 'Proveedor'
  }
  
  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Todos los roles</option>
          <option value="admin">Administradores</option>
          <option value="technician">Técnicos</option>
          <option value="client">Clientes</option>
          <option value="supplier">Proveedores</option>
        </select>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600">Total Usuarios</p>
          <p className="text-2xl font-bold text-purple-700">{users.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600">Activos</p>
          <p className="text-2xl font-bold text-green-700">{users.filter(u => u.is_active !== false).length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600">Técnicos</p>
          <p className="text-2xl font-bold text-blue-700">{users.filter(u => u.user_type === 'technician').length}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-orange-600">Proveedores</p>
          <p className="text-2xl font-bold text-orange-700">{users.filter(u => u.user_type === 'supplier').length}</p>
        </div>
      </div>
      
      {/* Lista de usuarios */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rol</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.map(u => (
              <tr key={u.id} className={`hover:bg-gray-50 ${u.is_active === false ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                      u.user_type === 'admin' ? 'bg-purple-500' :
                      u.user_type === 'technician' ? 'bg-blue-500' :
                      u.user_type === 'supplier' ? 'bg-orange-500' : 'bg-green-500'
                    }`}>
                      {u.first_name[0]}{u.last_name[0]}
                    </div>
                    <div>
                      <p className="font-medium">{u.full_name}</p>
                      <p className="text-xs text-gray-500">{u.phone || 'Sin teléfono'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.user_type}
                    onChange={(e) => handleChangeRole(u.id, e.target.value as User['user_type'])}
                    className={`text-xs px-2 py-1 rounded-full border-0 ${roleColors[u.user_type]} cursor-pointer`}
                    disabled={u.id === '1'} // No cambiar rol del admin principal
                  >
                    <option value="admin">Administrador</option>
                    <option value="technician">Técnico</option>
                    <option value="client">Cliente</option>
                    <option value="supplier">Proveedor</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggleActive(u.id, u.is_active !== false)}
                    disabled={u.id === '1'}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      u.is_active !== false
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    } ${u.id === '1' ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {u.is_active !== false ? (
                      <><UserCheck size={14} /> Activo</>
                    ) : (
                      <><UserX size={14} /> Inactivo</>
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowResetPassword(u.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Resetear contraseña"
                    >
                      <Lock size={16} />
                    </button>
                    <button
                      onClick={() => setEditingUser(u)}
                      className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    {u.id !== '1' && (
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar este usuario?')) {
                            deleteUser(u.id)
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Modal Reset Password */}
      {showResetPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="text-blue-600" size={20} />
              Resetear Contraseña
            </h3>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de resetear la contraseña de este usuario? Se generará una contraseña temporal.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetPassword(null)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleResetPassword(showResetPassword)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirmar Reset
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Editar Usuario */}
      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />
      )}
    </div>
  )
}

function EditUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { updateUser } = useAuthStore()
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone || '',
    company_name: user.company_name || ''
  })
  
  const handleSave = () => {
    updateUser(user.id, {
      ...form,
      full_name: `${form.first_name} ${form.last_name}`
    })
    onClose()
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Editar Usuario</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== CONFIGURACIÓN DEL SISTEMA ====================

function SystemConfiguration() {
  const queryClient = useQueryClient()
  const { data: config, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => configService.get()
  })
  
  const [form, setForm] = useState<Partial<SystemConfig>>({})
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<SystemConfig>) => configService.update(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      alert('Configuración guardada correctamente')
    }
  })
  
  const resetMutation = useMutation({
    mutationFn: () => configService.reset(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
      setForm({})
      setLogoPreview(null)
      alert('Configuración reseteada a valores por defecto')
    }
  })
  
  if (isLoading || !config) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
  }
  
  const currentConfig = { ...config, ...form }
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      setLogoPreview(base64)
      setForm({ ...form, logo: base64 })
    }
    reader.readAsDataURL(file)
  }
  
  const handleSave = () => {
    updateMutation.mutate(form)
  }
  
  return (
    <div className="space-y-6">
      {/* Datos de la empresa */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Building2 size={18} />
          Datos de la Empresa
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
            <input
              type="text"
              value={currentConfig.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
            <input
              type="text"
              value={currentConfig.company_legal_name}
              onChange={(e) => setForm({ ...form, company_legal_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
            <input
              type="text"
              value={currentConfig.tax_id}
              onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={currentConfig.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={currentConfig.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={currentConfig.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
            <input
              type="text"
              value={currentConfig.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {/* Logo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo de la Empresa</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                {(logoPreview || currentConfig.logo) ? (
                  <img 
                    src={logoPreview || currentConfig.logo} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image size={32} className="text-gray-400" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                >
                  <Upload size={18} />
                  Subir Logo
                </label>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG hasta 2MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Colores del tema */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Palette size={18} />
          Colores del Tema
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color Primario</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentConfig.primary_color}
                onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={currentConfig.primary_color}
                onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color Secundario</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentConfig.secondary_color}
                onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={currentConfig.secondary_color}
                onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color de Acento</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentConfig.accent_color}
                onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={currentConfig.accent_color}
                onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Notificaciones */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Bell size={18} />
          Notificaciones
        </h3>
        
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={currentConfig.notify_on_new_ticket}
              onChange={(e) => setForm({ ...form, notify_on_new_ticket: e.target.checked })}
              className="w-5 h-5 rounded text-purple-600"
            />
            <span>Notificar cuando se cree un nuevo ticket</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={currentConfig.notify_on_status_change}
              onChange={(e) => setForm({ ...form, notify_on_status_change: e.target.checked })}
              className="w-5 h-5 rounded text-purple-600"
            />
            <span>Notificar cambios de estado en tickets</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={currentConfig.require_quote_approval}
              onChange={(e) => setForm({ ...form, require_quote_approval: e.target.checked })}
              className="w-5 h-5 rounded text-purple-600"
            />
            <span>Requerir aprobación de presupuestos</span>
          </label>
        </div>
      </div>
      
      {/* Horario de trabajo */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={18} />
          Horario de Trabajo
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Días Laborales</label>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map(day => (
                <label
                  key={day.value}
                  className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                    currentConfig.work_days.includes(day.value)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={currentConfig.work_days.includes(day.value)}
                    onChange={(e) => {
                      const newDays = e.target.checked
                        ? [...currentConfig.work_days, day.value]
                        : currentConfig.work_days.filter(d => d !== day.value)
                      setForm({ ...form, work_days: newDays.sort() })
                    }}
                    className="sr-only"
                  />
                  {day.label.slice(0, 3)}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio</label>
              <input
                type="time"
                value={currentConfig.work_start_time}
                onChange={(e) => setForm({ ...form, work_start_time: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin</label>
              <input
                type="time"
                value={currentConfig.work_end_time}
                onChange={(e) => setForm({ ...form, work_end_time: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Botones */}
      <div className="flex gap-3">
        <button
          onClick={() => resetMutation.mutate()}
          disabled={resetMutation.isPending}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <RotateCcw size={18} />
          Resetear a Valores por Defecto
        </button>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending || Object.keys(form).length === 0}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
        >
          {updateMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Guardar Cambios
        </button>
      </div>
    </div>
  )
}

// ==================== AUDITORÍA / LOGS ====================

function AuditLogs() {
  const [filters, setFilters] = useState({
    search: '',
    action: '' as AuditLog['action'] | '',
    module: '' as AuditLog['module'] | '',
    page: 1
  })
  
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditService.list({
      search: filters.search || undefined,
      action: filters.action || undefined,
      module: filters.module || undefined,
      page: filters.page,
      limit: 30
    })
  })
  
  const { data: stats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: () => auditService.getStats(30)
  })
  
  const handleExport = async (format: 'json' | 'csv') => {
    const content = await auditService.export(format)
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const getActionColor = (action: AuditLog['action']) => {
    const colors: Record<AuditLog['action'], string> = {
      login: 'bg-green-100 text-green-700',
      logout: 'bg-gray-100 text-gray-700',
      create: 'bg-blue-100 text-blue-700',
      update: 'bg-yellow-100 text-yellow-700',
      delete: 'bg-red-100 text-red-700',
      view: 'bg-purple-100 text-purple-700',
      export: 'bg-indigo-100 text-indigo-700',
      assign: 'bg-cyan-100 text-cyan-700',
      status_change: 'bg-orange-100 text-orange-700',
      config_change: 'bg-pink-100 text-pink-700'
    }
    return colors[action]
  }
  
  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Acciones (30 días)</p>
            <p className="text-2xl font-bold text-blue-700">{stats.total_actions}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">Inicios de Sesión</p>
            <p className="text-2xl font-bold text-green-700">
              {stats.actions_by_type.find(a => a.action === 'login')?.count || 0}
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-600">Actualizaciones</p>
            <p className="text-2xl font-bold text-yellow-700">
              {stats.actions_by_type.find(a => a.action === 'update')?.count || 0}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600">Usuario Más Activo</p>
            <p className="text-lg font-bold text-purple-700 truncate">
              {stats.actions_by_user[0]?.user_name || '-'}
            </p>
          </div>
        </div>
      )}
      
      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en logs..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value as AuditLog['action'] | '', page: 1 })}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Todas las acciones</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select
          value={filters.module}
          onChange={(e) => setFilters({ ...filters, module: e.target.value as AuditLog['module'] | '', page: 1 })}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Todos los módulos</option>
          {Object.entries(MODULE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCw size={18} />
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <Download size={16} />
            CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <Download size={16} />
            JSON
          </button>
        </div>
      </div>
      
      {/* Lista de logs */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : logs?.items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Activity size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay registros de auditoría</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Fecha/Hora</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Usuario</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Acción</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Módulo</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs?.items.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{log.user_name}</p>
                      <p className="text-xs text-gray-500">{log.user_type}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {ACTION_LABELS[log.action]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {MODULE_LABELS[log.module]}
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-md truncate" title={log.description}>
                    {log.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Paginación */}
          {logs && logs.pages > 1 && (
            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Página {filters.page} de {logs.pages} ({logs.total} registros)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page <= 1}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page >= logs.pages}
                  className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ==================== REPORTES ====================

function Reports() {
  const { data: tickets } = useQuery({
    queryKey: ['tickets-report'],
    queryFn: () => ticketsService.list({ limit: '1000' })
  })
  
  const { data: auditStats } = useQuery({
    queryKey: ['audit-stats-report'],
    queryFn: () => auditService.getStats(30)
  })
  
  const { users } = useAuthStore()
  
  // Calcular métricas
  const ticketsList = tickets?.items || []
  
  const metrics = {
    total_tickets: ticketsList.length,
    open_tickets: ticketsList.filter(t => t.status === 'open' || t.status === 'received').length,
    in_progress: ticketsList.filter(t => t.status === 'in_progress' || t.status === 'assigned').length,
    completed: ticketsList.filter(t => t.status === 'completed' || t.status === 'closed').length,
    
    by_priority: {
      urgent: ticketsList.filter(t => t.priority === 'urgent').length,
      high: ticketsList.filter(t => t.priority === 'high').length,
      medium: ticketsList.filter(t => t.priority === 'medium').length,
      low: ticketsList.filter(t => t.priority === 'low').length
    },
    
    total_users: users.length,
    active_users: users.filter(u => u.is_active !== false).length,
    technicians: users.filter(u => u.user_type === 'technician').length,
    clients: users.filter(u => u.user_type === 'client').length
  }
  
  const handlePrint = () => {
    window.print()
  }
  
  const handleExportPDF = () => {
    // Simular exportación a PDF
    alert('Exportación a PDF en desarrollo. Por ahora, use la opción de Imprimir y seleccione "Guardar como PDF".')
  }
  
  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header de reporte */}
      <div className="flex justify-between items-center print:hidden">
        <h3 className="text-lg font-semibold">Resumen Gerencial</h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Printer size={18} />
            Imprimir
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <FileDown size={18} />
            Exportar PDF
          </button>
        </div>
      </div>
      
      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-80">Total Tickets</p>
          <p className="text-3xl font-bold">{metrics.total_tickets}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-4 text-white">
          <p className="text-sm opacity-80">En Progreso</p>
          <p className="text-3xl font-bold">{metrics.in_progress}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-4 text-white">
          <p className="text-sm opacity-80">Completados</p>
          <p className="text-3xl font-bold">{metrics.completed}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl p-4 text-white">
          <p className="text-sm opacity-80">Usuarios Activos</p>
          <p className="text-3xl font-bold">{metrics.active_users}</p>
        </div>
      </div>
      
      {/* Gráficos simulados */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tickets por estado */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-purple-600" />
            Tickets por Estado
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Abiertos/Recibidos</span>
                <span className="font-medium">{metrics.open_tickets}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${metrics.total_tickets ? (metrics.open_tickets / metrics.total_tickets * 100) : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>En Progreso</span>
                <span className="font-medium">{metrics.in_progress}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${metrics.total_tickets ? (metrics.in_progress / metrics.total_tickets * 100) : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Completados</span>
                <span className="font-medium">{metrics.completed}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${metrics.total_tickets ? (metrics.completed / metrics.total_tickets * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Tickets por prioridad */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-purple-600" />
            Tickets por Prioridad
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Urgente
                </span>
                <span className="font-medium">{metrics.by_priority.urgent}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${metrics.total_tickets ? (metrics.by_priority.urgent / metrics.total_tickets * 100) : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Alta
                </span>
                <span className="font-medium">{metrics.by_priority.high}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${metrics.total_tickets ? (metrics.by_priority.high / metrics.total_tickets * 100) : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Media
                </span>
                <span className="font-medium">{metrics.by_priority.medium}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${metrics.total_tickets ? (metrics.by_priority.medium / metrics.total_tickets * 100) : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Baja
                </span>
                <span className="font-medium">{metrics.by_priority.low}</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${metrics.total_tickets ? (metrics.by_priority.low / metrics.total_tickets * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actividad del sistema */}
      {auditStats && (
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-purple-600" />
            Actividad del Sistema (últimos 30 días)
          </h4>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Por módulo */}
            <div>
              <p className="text-sm text-gray-600 mb-3">Por Módulo</p>
              <div className="space-y-2">
                {auditStats.actions_by_module.slice(0, 5).map(item => (
                  <div key={item.module} className="flex justify-between items-center">
                    <span className="text-sm">{MODULE_LABELS[item.module as AuditLog['module']] || item.module}</span>
                    <span className="text-sm font-medium bg-gray-200 px-2 py-0.5 rounded">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Por tipo de acción */}
            <div>
              <p className="text-sm text-gray-600 mb-3">Por Tipo de Acción</p>
              <div className="space-y-2">
                {auditStats.actions_by_type.slice(0, 5).map(item => (
                  <div key={item.action} className="flex justify-between items-center">
                    <span className="text-sm">{ACTION_LABELS[item.action as AuditLog['action']] || item.action}</span>
                    <span className="text-sm font-medium bg-gray-200 px-2 py-0.5 rounded">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Usuarios más activos */}
            <div>
              <p className="text-sm text-gray-600 mb-3">Usuarios Más Activos</p>
              <div className="space-y-2">
                {auditStats.actions_by_user.slice(0, 5).map((item, idx) => (
                  <div key={item.user_name} className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs text-white ${
                        idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-gray-300'
                      }`}>
                        {idx + 1}
                      </span>
                      {item.user_name}
                    </span>
                    <span className="text-sm font-medium bg-gray-200 px-2 py-0.5 rounded">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Resumen de usuarios */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Users size={18} className="text-purple-600" />
          Distribución de Usuarios
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-lg">
            <p className="text-3xl font-bold text-purple-600">{users.filter(u => u.user_type === 'admin').length}</p>
            <p className="text-sm text-gray-600">Administradores</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{metrics.technicians}</p>
            <p className="text-sm text-gray-600">Técnicos</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <p className="text-3xl font-bold text-green-600">{metrics.clients}</p>
            <p className="text-sm text-gray-600">Clientes</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <p className="text-3xl font-bold text-orange-600">{users.filter(u => u.user_type === 'supplier').length}</p>
            <p className="text-sm text-gray-600">Proveedores</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== PANEL DE SEGURIDAD ====================

function SecurityPanel() {
  const { users, user: currentUser, resetUserPassword } = useAuthStore()
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Estadísticas de seguridad derivadas de localStorage
  const { data: stats } = useQuery({
    queryKey: ['security-stats'],
    queryFn: async () => {
      const rateLimitData = JSON.parse(localStorage.getItem('sosc-security-rate-limit') || '{}')
      const lockedAccounts = Object.entries(rateLimitData).filter(([, v]: any) => {
        return v.locked_until && new Date(v.locked_until).getTime() > Date.now()
      }).length
      const failedAttempts = Object.values(rateLimitData).reduce((acc: number, v: any) => acc + (v.attempts || 0), 0)

      const auditLogs = await auditService.list({ limit: 1000 })
      const loginFails = auditLogs.items.filter(l => l.action === 'login' && l.description.includes('fallido')).length
      const last24h = auditLogs.items.filter(l => new Date(l.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000).length

      const usersWithPassword = users.filter(u => passwordStore.has(u.id)).length
      const blockedUsers = users.filter(u => u.is_blocked).length
      const inactiveUsers = users.filter(u => !u.is_active).length

      const session = sessionManager.current()
      const idleMinutesRemaining = sessionManager.getIdleMinutesRemaining()

      return {
        lockedAccounts,
        failedAttempts,
        loginFails,
        last24h,
        usersWithPassword,
        blockedUsers,
        inactiveUsers,
        totalUsers: users.length,
        session,
        idleMinutesRemaining,
      }
    },
    refetchInterval: 30_000,
  })

  const handleSetPassword = async () => {
    if (!selectedUserId || !newPassword) return
    const strength = evaluatePasswordStrength(newPassword)
    if (!strength.valid) {
      alert(`Contraseña débil: ${strength.warnings.join(', ')}`)
      return
    }
    await passwordStore.set(selectedUserId, newPassword, true)
    setSuccessMsg(`Contraseña establecida correctamente. El usuario deberá cambiarla en su próximo acceso.`)
    setNewPassword('')
    setSelectedUserId('')
    queryClient.invalidateQueries({ queryKey: ['security-stats'] })
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  const handleGeneratePassword = () => {
    if (!selectedUserId) return
    const tempPwd = resetUserPassword(selectedUserId, currentUser?.full_name || 'admin')
    setSuccessMsg(`Contraseña temporal generada: ${tempPwd} (cópiela y entréguela al usuario)`)
    queryClient.invalidateQueries({ queryKey: ['security-stats'] })
  }

  const handleClearRateLimits = () => {
    if (!confirm('¿Limpiar todos los bloqueos temporales por intentos fallidos?')) return
    localStorage.removeItem('sosc-security-rate-limit')
    queryClient.invalidateQueries({ queryKey: ['security-stats'] })
    setSuccessMsg('Bloqueos temporales eliminados.')
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const strength = newPassword ? evaluatePasswordStrength(newPassword) : null

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-lg p-5 text-white">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} />
          <div>
            <h3 className="text-lg font-bold">Centro de Seguridad</h3>
            <p className="text-sm text-slate-300">Supervisa y gestiona la seguridad del sistema en tiempo real.</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={16} />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* KPIs de seguridad */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Lock size={18} className="text-red-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bloqueados</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.lockedAccounts ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">Cuentas con bloqueo temporal</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fallidos</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.loginFails ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">Intentos fallidos (total)</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <KeyRound size={18} className="text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Protegidos</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.usersWithPassword ?? 0}/{stats?.totalUsers ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">Usuarios con contraseña</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity size={18} className="text-blue-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Eventos 24h</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.last24h ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">Acciones auditadas</p>
        </div>
      </div>

      {/* Configuración de seguridad */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Settings size={16} />
            Política de Seguridad Vigente
          </h4>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="text-slate-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Intentos máximos</p>
              <p className="text-xs text-slate-600">{SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS} intentos antes de bloqueo temporal</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Timer size={18} className="text-slate-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Bloqueo temporal</p>
              <p className="text-xs text-slate-600">{SECURITY_CONFIG.LOCKOUT_MINUTES} minutos tras intentos fallidos</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={18} className="text-slate-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Cierre por inactividad</p>
              <p className="text-xs text-slate-600">{SECURITY_CONFIG.IDLE_TIMEOUT_MINUTES} minutos sin actividad</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Fingerprint size={18} className="text-slate-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Sesión máxima</p>
              <p className="text-xs text-slate-600">{SECURITY_CONFIG.MAX_SESSION_HOURS} horas por sesión</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Lock size={18} className="text-slate-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Longitud mínima de contraseña</p>
              <p className="text-xs text-slate-600">{SECURITY_CONFIG.MIN_PASSWORD_LENGTH} caracteres</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="text-emerald-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Hash de contraseñas</p>
              <p className="text-xs text-slate-600">SHA-256 + salt aleatorio (16 bytes)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gestión de contraseñas */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <KeyRound size={16} />
            Gestión de Contraseñas
          </h4>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Seleccionar usuario
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            >
              <option value="">— Elige un usuario —</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name} · {u.email} {passwordStore.has(u.id) ? '🔒' : '🔓'}
                </option>
              ))}
            </select>
          </div>

          {selectedUserId && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {strength && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            strength.score <= 1 ? 'bg-red-500' :
                            strength.score === 2 ? 'bg-amber-500' :
                            strength.score === 3 ? 'bg-blue-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${(strength.score / 4) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${
                        strength.score <= 1 ? 'text-red-600' :
                        strength.score === 2 ? 'text-amber-600' :
                        strength.score === 3 ? 'text-blue-600' : 'text-emerald-600'
                      }`}>
                        {strength.label}
                      </span>
                    </div>
                    {strength.warnings.length > 0 && (
                      <p className="text-xs text-slate-500">{strength.warnings.join(' · ')}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSetPassword}
                  disabled={!newPassword || (strength && !strength.valid) || false}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <KeyRound size={14} />
                  Establecer contraseña
                </button>
                <button
                  onClick={handleGeneratePassword}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm font-semibold hover:bg-slate-50 flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  Generar temporal
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Acciones administrativas */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Activity size={16} />
            Acciones Administrativas
          </h4>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div>
              <p className="text-sm font-semibold text-slate-900">Limpiar bloqueos temporales</p>
              <p className="text-xs text-slate-600">Elimina los bloqueos activos de cuentas por intentos fallidos ({stats?.lockedAccounts ?? 0} activos)</p>
            </div>
            <button
              onClick={handleClearRateLimits}
              className="px-3 py-1.5 bg-amber-600 text-white rounded-md text-xs font-semibold hover:bg-amber-700"
            >
              Limpiar
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div>
              <p className="text-sm font-semibold text-slate-900">Sesión actual</p>
              <p className="text-xs text-slate-600">
                {stats?.session
                  ? `Iniciada ${new Date(stats.session.started_at).toLocaleString('es-PY')} · Idle en ${stats.idleMinutesRemaining} min`
                  : 'Sin sesión activa'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

