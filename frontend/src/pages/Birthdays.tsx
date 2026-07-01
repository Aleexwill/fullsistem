import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { 
  Calendar, Gift, ChevronLeft, ChevronRight, Bell, 
  User, Building2, Wrench, Truck, Cake, PartyPopper
} from 'lucide-react'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

interface Birthday {
  id: string
  name: string
  date: string
  user_type: string
  company_name?: string
}

export default function Birthdays() {
  const { users } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Obtener todos los cumpleaños (deduplicados por ID)
  const birthdays: Birthday[] = Array.from(
    new Map(
      users
        .filter(u => u.birthday)
        .map(u => [u.id, {
          id: u.id,
          name: u.full_name,
          date: u.birthday!,
          user_type: u.user_type,
          company_name: u.company_name
        }])
    ).values()
  )
  
  const today = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  // Obtener días del mes
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const startingDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()
  
  // Generar array de días para el calendario
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }
  
  // Obtener cumpleaños para un día específico
  const getBirthdaysForDay = (day: number) => {
    return birthdays.filter(b => {
      const [, month, dayOfMonth] = b.date.split('-').map(Number)
      return month === currentMonth + 1 && dayOfMonth === day
    })
  }
  
  // Obtener próximos cumpleaños (siguiente 30 días)
  const getUpcomingBirthdays = () => {
    const todayStr = today.toISOString().split('T')[0]
    const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number)
    
    return birthdays
      .map(b => {
        const [, bMonth, bDay] = b.date.split('-').map(Number)
        let nextBirthday = new Date(todayYear, bMonth - 1, bDay)
        
        // Si ya pasó este año, considerar el próximo año
        if (nextBirthday < today) {
          nextBirthday = new Date(todayYear + 1, bMonth - 1, bDay)
        }
        
        const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        return { ...b, nextBirthday, daysUntil }
      })
      .filter(b => b.daysUntil <= 30 && b.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)
  }
  
  // Obtener cumpleaños de hoy
  const getTodayBirthdays = () => {
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()
    
    return birthdays.filter(b => {
      const [, bMonth, bDay] = b.date.split('-').map(Number)
      return bMonth === todayMonth && bDay === todayDay
    })
  }
  
  const upcomingBirthdays = getUpcomingBirthdays()
  const todayBirthdays = getTodayBirthdays()
  
  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentYear, currentMonth + direction, 1))
  }
  
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  
  const getUserTypeIcon = (type: string) => {
    switch (type) {
      case 'admin': return <User size={14} className="text-purple-500" />
      case 'client': return <Building2 size={14} className="text-blue-500" />
      case 'technician': return <Wrench size={14} className="text-orange-500" />
      case 'supplier': return <Truck size={14} className="text-green-500" />
      default: return <User size={14} className="text-gray-500" />
    }
  }
  
  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case 'admin': return 'Admin'
      case 'client': return 'Cliente'
      case 'technician': return 'Técnico'
      case 'supplier': return 'Proveedor'
      default: return type
    }
  }
  
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Gift className="text-pink-500" />
            Calendario de Cumpleaños
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Recordatorio de cumpleaños del equipo
          </p>
        </div>
      </div>
      
      {/* Cumpleaños de hoy */}
      {todayBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white bg-opacity-20 rounded-full">
              <PartyPopper size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold">¡Cumpleaños Hoy!</h2>
              <p className="text-pink-100">No olvides felicitarlos</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {todayBirthdays.map(b => (
              <div key={b.id} className="bg-white bg-opacity-20 rounded-lg p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <Cake className="text-pink-500" size={24} />
                </div>
                <div>
                  <p className="font-bold">{b.name}</p>
                  <p className="text-sm text-pink-100">
                    {getUserTypeLabel(b.user_type)}
                    {b.company_name && ` - ${b.company_name}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* Navegación del mes */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <button
                onClick={goToToday}
                className="text-sm text-blue-600 hover:underline"
              >
                Ir a hoy
              </button>
            </div>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }
              
              const dayBirthdays = getBirthdaysForDay(day)
              const hassBirthday = dayBirthdays.length > 0
              const isTodayDate = isToday(day)
              
              return (
                <div
                  key={day}
                  className={`aspect-square p-1 rounded-lg relative ${
                    isTodayDate 
                      ? 'bg-blue-500 text-white' 
                      : hassBirthday 
                      ? 'bg-pink-50 border-2 border-pink-200' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-sm font-medium ${isTodayDate ? 'text-white' : ''}`}>
                    {day}
                  </span>
                  {hassBirthday && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                      <div className="flex gap-0.5">
                        {dayBirthdays.slice(0, 3).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              isTodayDate ? 'bg-white' : 'bg-pink-400'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {hassBirthday && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-pink-100 bg-opacity-95 rounded-lg transition-opacity">
                      <div className="text-center p-1">
                        {dayBirthdays.map(b => (
                          <p key={b.id} className="text-xs text-pink-700 truncate">
                            {b.name.split(' ')[0]}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Próximos cumpleaños */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Bell size={18} className="text-yellow-500" />
            Próximos 30 días
          </h3>
          
          {upcomingBirthdays.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar size={40} className="mx-auto mb-2 opacity-50" />
              <p>No hay cumpleaños próximos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBirthdays.map(b => (
                <div
                  key={b.id}
                  className={`p-3 rounded-lg border ${
                    b.daysUntil === 0 
                      ? 'bg-pink-50 border-pink-200' 
                      : b.daysUntil <= 7 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getUserTypeIcon(b.user_type)}
                      <div>
                        <p className="font-medium text-gray-800">{b.name}</p>
                        <p className="text-xs text-gray-500">
                          {b.company_name || getUserTypeLabel(b.user_type)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {b.daysUntil === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-500 text-white rounded-full text-xs font-medium">
                          <Cake size={12} />
                          ¡Hoy!
                        </span>
                      ) : b.daysUntil === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white rounded-full text-xs font-medium">
                          Mañana
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">
                          En {b.daysUntil} días
                        </span>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(b.nextBirthday).toLocaleDateString('es-PY', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Lista de todos los cumpleaños por mes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Gift size={18} className="text-pink-500" />
          Todos los Cumpleaños
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MONTHS.map((month, monthIndex) => {
            const monthBirthdays = birthdays.filter(b => {
              const [, bMonth] = b.date.split('-').map(Number)
              return bMonth === monthIndex + 1
            }).sort((a, b) => {
              const dayA = parseInt(a.date.split('-')[2])
              const dayB = parseInt(b.date.split('-')[2])
              return dayA - dayB
            })
            
            return (
              <div key={month} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2 flex items-center justify-between">
                  {month}
                  {monthBirthdays.length > 0 && (
                    <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">
                      {monthBirthdays.length}
                    </span>
                  )}
                </h4>
                {monthBirthdays.length === 0 ? (
                  <p className="text-sm text-gray-400">Sin cumpleaños</p>
                ) : (
                  <div className="space-y-2">
                    {monthBirthdays.map(b => (
                      <div key={b.id} className="flex items-center gap-2 text-sm">
                        {getUserTypeIcon(b.user_type)}
                        <span className="text-gray-600 font-medium w-6">
                          {b.date.split('-')[2]}
                        </span>
                        <span className="text-gray-800 truncate flex-1">
                          {b.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
