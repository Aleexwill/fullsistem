import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore, RegisterData } from '../stores/authStore'
import { Loader2, User, Truck, Wrench, Building2, Calendar } from 'lucide-react'

type UserType = 'client' | 'supplier' | 'technician'

const userTypes: { value: UserType; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { 
    value: 'client', 
    label: 'Cliente', 
    description: 'Solicita servicios técnicos para tu empresa',
    icon: Building2,
    color: 'blue'
  },
  { 
    value: 'supplier', 
    label: 'Proveedor', 
    description: 'Ofrece productos y materiales',
    icon: Truck,
    color: 'green'
  },
  { 
    value: 'technician', 
    label: 'Técnico', 
    description: 'Realiza servicios de campo',
    icon: Wrench,
    color: 'orange'
  },
]

export default function Register() {
  const [step, setStep] = useState(1)
  const [userType, setUserType] = useState<UserType | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    company_name: '',
    birthday: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuthStore()
  const navigate = useNavigate()
  
  const handleTypeSelect = (type: UserType) => {
    setUserType(type)
    setStep(2)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    setLoading(true)
    
    try {
      const registerData: RegisterData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        user_type: userType!,
        company_name: formData.company_name || undefined,
        birthday: formData.birthday || undefined
      }
      
      await register(registerData)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }
  
  const getColorClasses = (color: string, isSelected: boolean) => {
    if (!isSelected) return 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
    
    const colors: Record<string, string> = {
      blue: 'border-blue-500 bg-blue-50 ring-2 ring-blue-500',
      green: 'border-green-500 bg-green-50 ring-2 ring-green-500',
      orange: 'border-orange-500 bg-orange-50 ring-2 ring-orange-500'
    }
    return colors[color]
  }
  
  const getIconColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'text-blue-600 bg-blue-100',
      green: 'text-green-600 bg-green-100',
      orange: 'text-orange-600 bg-orange-100'
    }
    return colors[color]
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">SOSC</h1>
          <p className="text-gray-500 mt-2">Crear una cuenta</p>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            1
          </div>
          <div className={`w-20 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
            2
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {/* Step 1: Select user type */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">
              ¿Cómo deseas registrarte?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userTypes.map(({ value, label, description, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => handleTypeSelect(value)}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${getColorClasses(color, userType === value)}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${getIconColorClasses(color)}`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{label}</h3>
                  <p className="text-sm text-gray-500">{description}</p>
                </button>
              ))}
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-8">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Iniciar sesión
              </Link>
            </p>
          </div>
        )}
        
        {/* Step 2: Registration form */}
        {step === 2 && userType && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-blue-600 hover:underline mb-4"
            >
              ← Cambiar tipo de cuenta
            </button>
            
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-6">
              {userTypes.find(t => t.value === userType)?.icon && (
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconColorClasses(userTypes.find(t => t.value === userType)!.color)}`}>
                  {(() => {
                    const IconComponent = userTypes.find(t => t.value === userType)!.icon
                    return <IconComponent size={20} />
                  })()}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-800">
                  Registro como {userTypes.find(t => t.value === userType)?.label}
                </p>
                <p className="text-sm text-gray-500">
                  {userTypes.find(t => t.value === userType)?.description}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Juan"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Pérez"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tu@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0981 123 456"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                Fecha de Cumpleaños
              </label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({...formData, birthday: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {(userType === 'client' || userType === 'supplier') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Empresa {userType === 'client' ? '' : '(opcional)'}
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mi Empresa S.A."
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors mt-6"
            >
              {loading && <Loader2 size={20} className="animate-spin" />}
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Iniciar sesión
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
