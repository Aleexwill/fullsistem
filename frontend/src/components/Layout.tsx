import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useNotificationsStore } from '../stores/notificationsStore'
import { useState } from 'react'
import { 
  LayoutDashboard, Ticket, Users, Truck, LogOut, Menu, User, Bell,
  Building2, Wrench, Shield, Gift, Package, QrCode, Clock, TrendingUp,
  DollarSign, BarChart3, Boxes, ChevronDown, ChevronRight,
  Settings, Briefcase, Factory, UserCheck, ShoppingCart, FileText,
  Target, PieChart, Cog, HardHat, Layers, GitBranch, ShieldCheck,
  ClipboardCheck
} from 'lucide-react'

// Estructura de navegación organizada por módulos
interface NavCategory {
  id: string
  label: string
  icon: React.ElementType
  color: string
  roles: string[]
  items: NavItem[]
}

interface NavItem {
  path: string
  label: string
  icon: React.ElementType
  roles: string[]
}

const navigationStructure: NavCategory[] = [
  {
    id: 'main',
    label: 'Principal',
    icon: LayoutDashboard,
    color: 'indigo',
    roles: ['admin', 'client', 'supplier', 'technician'],
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'client', 'supplier', 'technician'] },
      { path: '/notifications', label: 'Notificaciones', icon: Bell, roles: ['admin', 'client', 'supplier', 'technician'] },
    ]
  },
  {
    id: 'operations',
    label: 'Operaciones',
    icon: Wrench,
    color: 'blue',
    roles: ['admin', 'client', 'supplier', 'technician'],
    items: [
      { path: '/tickets', label: 'Tickets', icon: Ticket, roles: ['admin', 'client', 'supplier', 'technician'] },
      { path: '/technicians', label: 'Técnicos', icon: HardHat, roles: ['admin'] },
      { path: '/equipment', label: 'Equipos QR', icon: QrCode, roles: ['admin', 'technician', 'supplier'] },
      { path: '/contracts', label: 'Contratos Servicio', icon: ClipboardCheck, roles: ['admin'] },
      { path: '/construction-budgets', label: 'Presupuestos Obra', icon: Building2, roles: ['admin'] },
    ]
  },
  {
    id: 'commercial',
    label: 'Comercial',
    icon: TrendingUp,
    color: 'green',
    roles: ['admin'],
    items: [
      { path: '/commercial', label: 'CRM', icon: Target, roles: ['admin'] },
      { path: '/clients', label: 'Clientes', icon: Building2, roles: ['admin'] },
      { path: '/suppliers', label: 'Proveedores', icon: Truck, roles: ['admin'] },
    ]
  },
  {
    id: 'finance',
    label: 'Financiero',
    icon: DollarSign,
    color: 'emerald',
    roles: ['admin'],
    items: [
      { path: '/administrative', label: 'ERP Financiero', icon: FileText, roles: ['admin'] },
      { path: '/bi', label: 'Business Intelligence', icon: PieChart, roles: ['admin'] },
    ]
  },
  {
    id: 'logistics',
    label: 'Logística',
    icon: Package,
    color: 'purple',
    roles: ['admin'],
    items: [
      { path: '/stock', label: 'Inventario', icon: Boxes, roles: ['admin'] },
    ]
  },
  {
    id: 'production',
    label: 'Producción',
    icon: Factory,
    color: 'orange',
    roles: ['admin'],
    items: [
      { path: '/plm', label: 'Ciclo Producto (PLM)', icon: Layers, roles: ['admin'] },
      { path: '/cmms', label: 'Mantenimiento', icon: Cog, roles: ['admin'] },
    ]
  },
  {
    id: 'hr',
    label: 'Recursos Humanos',
    icon: Users,
    color: 'pink',
    roles: ['admin', 'technician', 'supplier'],
    items: [
      { path: '/hrms', label: 'HRMS', icon: Briefcase, roles: ['admin'] },
      { path: '/employees', label: 'Funcionarios', icon: UserCheck, roles: ['admin'] },
      { path: '/attendance', label: 'Asistencia', icon: Clock, roles: ['admin', 'technician', 'supplier'] },
      { path: '/birthdays', label: 'Cumpleaños', icon: Gift, roles: ['admin'] },
    ]
  },
  {
    id: 'admin',
    label: 'Sistema',
    icon: Settings,
    color: 'gray',
    roles: ['admin'],
    items: [
      { path: '/users', label: 'Usuarios y Permisos', icon: ShieldCheck, roles: ['admin'] },
      { path: '/admin', label: 'Configuración', icon: Shield, roles: ['admin'] },
    ]
  }
]

const getColorClasses = (color: string, isActive: boolean) => {
  const colors: Record<string, { bg: string; text: string; hover: string; active: string }> = {
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', hover: 'hover:bg-indigo-500/10', active: 'bg-indigo-500/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', hover: 'hover:bg-blue-500/10', active: 'bg-blue-500/20' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', hover: 'hover:bg-green-500/10', active: 'bg-green-500/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', hover: 'hover:bg-emerald-500/10', active: 'bg-emerald-500/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', hover: 'hover:bg-purple-500/10', active: 'bg-purple-500/20' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', hover: 'hover:bg-orange-500/10', active: 'bg-orange-500/20' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', hover: 'hover:bg-pink-500/10', active: 'bg-pink-500/20' },
    gray: { bg: 'bg-gray-500/10', text: 'text-gray-400', hover: 'hover:bg-gray-500/10', active: 'bg-gray-500/20' },
  }
  return colors[color] || colors.indigo
}

const getUserTypeInfo = (userType: string) => {
  const types: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    admin: { label: 'Administrador', color: 'bg-purple-100 text-purple-800', icon: Shield },
    client: { label: 'Cliente', color: 'bg-blue-100 text-blue-800', icon: Building2 },
    supplier: { label: 'Proveedor', color: 'bg-green-100 text-green-800', icon: Truck },
    technician: { label: 'Técnico', color: 'bg-orange-100 text-orange-800', icon: Wrench },
  }
  return types[userType] || types.client
}

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { getUnreadCount } = useNotificationsStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['main', 'operations'])
  
  const userTypeInfo = getUserTypeInfo(user?.user_type || 'client')
  const UserTypeIcon = userTypeInfo.icon
  const unreadNotifications = getUnreadCount(user?.id || '', user?.user_type || 'client')
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }
  
  // Filtrar categorías y items según rol del usuario
  const filteredNavigation = navigationStructure
    .filter(category => category.roles.includes(user?.user_type || 'client'))
    .map(category => ({
      ...category,
      items: category.items.filter(item => item.roles.includes(user?.user_type || 'client'))
    }))
    .filter(category => category.items.length > 0)
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className={`bg-gray-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} relative flex flex-col`}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          {sidebarOpen && (
            <div>
              <span className="font-bold text-xl text-blue-400">SOSC</span>
              <p className="text-xs text-gray-500">Sistema Integral</p>
            </div>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {filteredNavigation.map(category => {
            const isExpanded = expandedCategories.includes(category.id)
            const hasActiveItem = category.items.some(item => location.pathname === item.path)
            const colors = getColorClasses(category.color, hasActiveItem)
            const CategoryIcon = category.icon
            
            return (
              <div key={category.id} className="mb-1">
                {/* Category Header */}
                <button
                  onClick={() => sidebarOpen && toggleCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    hasActiveItem ? colors.active : colors.hover
                  } ${hasActiveItem ? colors.text : 'text-gray-400'}`}
                >
                  <CategoryIcon size={20} className={hasActiveItem ? colors.text : ''} />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">{category.label}</span>
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                      />
                    </>
                  )}
                </button>
                
                {/* Category Items */}
                {sidebarOpen && isExpanded && (
                  <div className="ml-3 mt-1 space-y-0.5 border-l border-gray-700 pl-3">
                    {category.items.map(item => {
                      const isActive = location.pathname === item.path
                      const ItemIcon = item.icon
                      
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                            isActive 
                              ? `${colors.active} ${colors.text} font-medium` 
                              : 'text-gray-400 hover:text-white hover:bg-gray-800'
                          }`}
                        >
                          <ItemIcon size={16} />
                          <span>{item.label}</span>
                          {item.path === '/notifications' && unreadNotifications > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                              {unreadNotifications}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
                
                {/* Collapsed view - show only icons */}
                {!sidebarOpen && (
                  <div className="space-y-1 mt-1">
                    {category.items.slice(0, 1).map(item => {
                      const isActive = location.pathname === item.path
                      const ItemIcon = item.icon
                      
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          title={item.label}
                          className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                            isActive 
                              ? `${colors.active} ${colors.text}` 
                              : 'text-gray-400 hover:text-white hover:bg-gray-800'
                          }`}
                        >
                          <ItemIcon size={18} />
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        
        {/* User Section */}
        <div className="p-3 border-t border-gray-800">
          <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.full_name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${userTypeInfo.color}`}>
                  {userTypeInfo.label}
                </span>
              </div>
            )}
          </div>
          
          <div className={`flex ${sidebarOpen ? 'gap-2 mt-3' : 'flex-col gap-2 mt-2'}`}>
            <Link
              to="/profile"
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors ${sidebarOpen ? 'flex-1' : ''}`}
              title="Perfil"
            >
              <User size={16} />
              {sidebarOpen && <span className="text-sm">Perfil</span>}
            </Link>
            <button
              onClick={handleLogout}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors ${sidebarOpen ? 'flex-1' : ''}`}
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
              {sidebarOpen && <span className="text-sm">Salir</span>}
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
