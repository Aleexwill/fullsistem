import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'birthday' | 'ticket' | 'quote_sent' | 'quote_accepted' | 'quote_rejected' | 'report_sent'
  title: string
  message: string
  read: boolean
  created_at: string
  link?: string
  data?: Record<string, unknown>
  // Campos para filtrar por usuario/rol
  target_user_id?: string // Notificación específica para un usuario
  target_roles?: string[] // Notificación para ciertos roles (ej: ['admin'])
  ticket_id?: string // ID del ticket relacionado (para filtrar por tickets asignados)
}

interface NotificationsState {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'created_at'>) => void
  syncFromStorage: () => void
  markAsRead: (id: string) => void
  markAllAsRead: (userId: string, userRole: string, userTicketIds?: string[]) => void
  deleteNotification: (id: string) => void
  clearAll: (userId: string, userRole: string, userTicketIds?: string[]) => void
  getFilteredNotifications: (userId: string, userRole: string, userTicketIds?: string[]) => Notification[]
  getUnreadCount: (userId: string, userRole: string, userTicketIds?: string[]) => number
}

// Notificaciones demo - ahora con targets específicos
const DEMO_NOTIFICATIONS: Notification[] = [
  // Notificaciones solo para admin
  {
    id: '1',
    type: 'info',
    title: 'Nuevo Cliente Registrado',
    message: 'Se ha registrado un nuevo cliente: Empresa ABC S.A.',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    link: '/clients',
    target_roles: ['admin']
  },
  {
    id: '2',
    type: 'birthday',
    title: '¡Cumpleaños Próximo!',
    message: 'Carlos Méndez cumple años el 28 de Enero',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    link: '/birthdays',
    target_roles: ['admin']
  },
  {
    id: '3',
    type: 'warning',
    title: 'Ticket Pendiente',
    message: 'El ticket #TKT-002 lleva 3 días sin actualización',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    link: '/tickets/TKT-002',
    target_roles: ['admin']
  },
  {
    id: '4',
    type: 'success',
    title: 'Presupuesto Aceptado',
    message: 'El cliente Juan Pérez ha aceptado el presupuesto del ticket #TKT-003',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    link: '/tickets/TKT-003',
    target_roles: ['admin']
  },
  
  // Notificación para técnico específico (Carlos Méndez - id: 2)
  {
    id: '5',
    type: 'ticket',
    title: 'Nuevo Ticket Asignado',
    message: 'Se te ha asignado el ticket #TKT-001 - Mantenimiento de cámaras',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    link: '/tickets/TKT-001',
    target_user_id: '2', // Carlos Méndez
    ticket_id: 'TKT-001'
  },
  {
    id: '6',
    type: 'info',
    title: 'Actualización de Ticket',
    message: 'El ticket #TKT-001 ha sido actualizado',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    link: '/tickets/TKT-001',
    target_user_id: '2',
    ticket_id: 'TKT-001'
  },
  
  // Notificación para cliente específico (Juan Pérez - id: 3)
  {
    id: '7',
    type: 'ticket',
    title: 'Ticket Recibido',
    message: 'Tu ticket #TKT-003 ha sido recibido y está siendo procesado',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    link: '/tickets/TKT-003',
    target_user_id: '3', // Juan Pérez
    ticket_id: 'TKT-003'
  },
  {
    id: '8',
    type: 'success',
    title: 'Presupuesto Disponible',
    message: 'Se ha generado un presupuesto para tu ticket #TKT-003',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    link: '/tickets/TKT-003',
    target_user_id: '3',
    ticket_id: 'TKT-003'
  },
  
  // Notificación para proveedor específico (María González - id: 4)
  {
    id: '9',
    type: 'ticket',
    title: 'Nueva Asignación de Materiales',
    message: 'Se te ha asignado para proveer materiales en el ticket #TKT-002',
    read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    link: '/tickets/TKT-002',
    target_user_id: '4', // María González
    ticket_id: 'TKT-002'
  },
]

let notificationCounter = 10

// Escuchar eventos de notificaciones del servicio
if (typeof window !== 'undefined') {
  window.addEventListener('notification-added', ((event: CustomEvent) => {
    // El store se sincronizará automáticamente desde localStorage gracias a persist
    // Forzar recarga del storage
    const data = localStorage.getItem('sosc-notifications')
    if (data) {
      try {
        const parsed = JSON.parse(data)
        if (parsed.state?.notifications) {
          // El store ya está sincronizado por persist
        }
      } catch (e) {}
    }
  }) as EventListener)
}

// Función auxiliar para filtrar notificaciones
const filterNotifications = (
  notifications: Notification[],
  userId: string,
  userRole: string,
  _userTicketIds?: string[]
): Notification[] => {
  return notifications.filter(n => {
    // Si es admin, ve las notificaciones con target_roles que incluyan 'admin'
    // o sus propias notificaciones específicas
    if (userRole === 'admin') {
      // Admin ve: notificaciones para admin O notificaciones específicas para él
      if (n.target_roles?.includes('admin')) return true
      if (n.target_user_id === userId) return true
      // Admin también ve notificaciones sin target (generales del sistema)
      if (!n.target_roles && !n.target_user_id) return true
      return false
    }
    
    // Para otros roles (client, technician, supplier)
    // Solo ven notificaciones específicas para ellos
    if (n.target_user_id === userId) return true
    
    // O notificaciones de tickets en los que están involucrados
    // (esto se puede expandir si se pasan los IDs de tickets)
    
    return false
  })
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: DEMO_NOTIFICATIONS,
      
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: String(notificationCounter++),
          read: false,
          created_at: new Date().toISOString(),
        }
        
        set(state => ({
          notifications: [newNotification, ...state.notifications]
        }))
      },
      
      // Sincronizar con localStorage (llamado por componentes)
      syncFromStorage: () => {
        try {
          const data = localStorage.getItem('sosc-notifications')
          if (data) {
            const parsed = JSON.parse(data)
            if (parsed.state?.notifications) {
              set({ notifications: parsed.state.notifications })
            }
          }
        } catch (e) {}
      },
      
      markAsRead: (id) => {
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          )
        }))
      },
      
      markAllAsRead: (userId, userRole, userTicketIds) => {
        const visibleIds = filterNotifications(
          get().notifications, 
          userId, 
          userRole, 
          userTicketIds
        ).map(n => n.id)
        
        set(state => ({
          notifications: state.notifications.map(n =>
            visibleIds.includes(n.id) ? { ...n, read: true } : n
          )
        }))
      },
      
      deleteNotification: (id) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }))
      },
      
      clearAll: (userId, userRole, userTicketIds) => {
        const visibleIds = filterNotifications(
          get().notifications, 
          userId, 
          userRole, 
          userTicketIds
        ).map(n => n.id)
        
        set(state => ({
          notifications: state.notifications.filter(n => !visibleIds.includes(n.id))
        }))
      },
      
      getFilteredNotifications: (userId, userRole, userTicketIds) => {
        return filterNotifications(get().notifications, userId, userRole, userTicketIds)
      },
      
      getUnreadCount: (userId, userRole, userTicketIds) => {
        return filterNotifications(get().notifications, userId, userRole, userTicketIds)
          .filter(n => !n.read).length
      },
    }),
    {
      name: 'sosc-notifications',
    }
  )
)
