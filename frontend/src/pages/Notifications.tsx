import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotificationsStore, Notification } from '../stores/notificationsStore'
import { useAuthStore } from '../stores/authStore'
import { 
  Bell, Check, CheckCheck, Trash2, AlertCircle, Info, 
  CheckCircle, AlertTriangle, Cake, Ticket, 
  ChevronRight, Filter, Clock, FileText, DollarSign, XCircle, Send
} from 'lucide-react'

const getNotificationIcon = (type: Notification['type']) => {
  const icons: Record<Notification['type'], { icon: React.ElementType; color: string; bgColor: string }> = {
    info: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-100' },
    success: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100' },
    warning: { icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
    error: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-100' },
    birthday: { icon: Cake, color: 'text-pink-500', bgColor: 'bg-pink-100' },
    ticket: { icon: Ticket, color: 'text-purple-500', bgColor: 'bg-purple-100' },
    quote_sent: { icon: Send, color: 'text-indigo-500', bgColor: 'bg-indigo-100' },
    quote_accepted: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
    quote_rejected: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
    report_sent: { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  }
  return icons[type] || icons.info
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 1) return 'Ahora mismo'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
  
  return date.toLocaleDateString('es-PY', { day: 'numeric', month: 'short' })
}

type FilterType = 'all' | 'unread' | 'ticket' | 'birthday' | 'quotes'

export default function Notifications() {
  const { user } = useAuthStore()
  const { 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll,
    getFilteredNotifications,
    getUnreadCount 
  } = useNotificationsStore()
  
  const [filter, setFilter] = useState<FilterType>('all')
  
  const userId = user?.id || ''
  const userRole = user?.user_type || 'client'
  
  // Obtener notificaciones filtradas según el usuario
  const userNotifications = getFilteredNotifications(userId, userRole)
  const unreadCount = getUnreadCount(userId, userRole)
  
  // Aplicar filtro adicional de UI
  const quoteTypes = ['quote_sent', 'quote_accepted', 'quote_rejected']
  const filteredNotifications = userNotifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'ticket') return n.type === 'ticket'
    if (filter === 'birthday') return n.type === 'birthday'
    if (filter === 'quotes') return quoteTypes.includes(n.type)
    return true
  })
  
  const isAdmin = userRole === 'admin'
  
  const filters: { value: FilterType; label: string; count?: number; adminOnly?: boolean }[] = [
    { value: 'all', label: 'Todas', count: userNotifications.length },
    { value: 'unread', label: 'No leídas', count: unreadCount },
    { value: 'ticket', label: 'Tickets', count: userNotifications.filter(n => n.type === 'ticket').length },
    { value: 'quotes', label: 'Presupuestos', count: userNotifications.filter(n => quoteTypes.includes(n.type)).length },
    { value: 'birthday', label: 'Cumpleaños', count: userNotifications.filter(n => n.type === 'birthday').length, adminOnly: true },
  ]
  
  // Filtrar opciones de filtro según rol
  const visibleFilters = filters.filter(f => !f.adminOnly || isAdmin)
  
  const handleMarkAllAsRead = () => {
    markAllAsRead(userId, userRole)
  }
  
  const handleClearAll = () => {
    clearAll(userId, userRole)
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Bell className="text-blue-500" />
            Notificaciones
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 bg-red-500 text-white text-sm font-medium rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin 
              ? 'Todas las actualizaciones del sistema' 
              : 'Actualizaciones de tus tickets y asignaciones'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <CheckCheck size={16} />
              Marcar todas como leídas
            </button>
          )}
          {userNotifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              Limpiar todo
            </button>
          )}
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-gray-400" />
          {visibleFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === f.value 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === f.value ? 'bg-blue-200' : 'bg-gray-200'
                }`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No hay notificaciones</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter !== 'all' 
                ? 'Prueba con otro filtro' 
                : isAdmin 
                  ? 'Las notificaciones aparecerán aquí'
                  : 'Cuando haya actividad en tus tickets, verás las notificaciones aquí'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const iconInfo = getNotificationIcon(notification.type)
            const IconComponent = iconInfo.icon
            
            const ContentWrapper = notification.link ? Link : 'div'
            const contentProps = notification.link ? {
              to: notification.link,
              onClick: () => !notification.read && markAsRead(notification.id)
            } : {}
            
            return (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2.5 rounded-full ${iconInfo.bgColor} flex-shrink-0`}>
                    <IconComponent size={20} className={iconInfo.color} />
                  </div>
                  
                  {/* Content - Clickeable si tiene link */}
                  <div className="flex-1 min-w-0">
                    <ContentWrapper 
                      {...contentProps as any}
                      className={notification.link ? 'block cursor-pointer' : ''}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {notification.message}
                          </p>
                        </div>
                        
                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </ContentWrapper>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock size={12} />
                        {formatTimeAgo(notification.created_at)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Marcar como leída"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                        {notification.link && (
                          <Link
                            to={notification.link}
                            onClick={() => !notification.read && markAsRead(notification.id)}
                            className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                          >
                            Ver Ticket
                            <ChevronRight size={14} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
      
      {/* Summary */}
      {userNotifications.length > 0 && (
        <div className="text-center text-sm text-gray-400">
          Mostrando {filteredNotifications.length} de {userNotifications.length} notificaciones
        </div>
      )}
    </div>
  )
}
