import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import {
  employeesService,
  Employee,
  EmployeeVacation,
  DEPARTMENTS,
  POSITIONS,
  CONTRACT_TYPE_LABELS,
  MARITAL_STATUS_LABELS,
  EDUCATION_LEVEL_LABELS,
  EMPLOYEE_STATUS_LABELS,
  VACATION_TYPE_LABELS
} from '../services/employees'
import {
  Users, UserPlus, Search, Filter, Download, Eye, Edit2, Trash2,
  X, Save, Loader2, Phone, Mail, MapPin, Building2, Calendar,
  DollarSign, GraduationCap, Heart, FileText, Camera, ChevronDown,
  ChevronUp, Clock, CheckCircle, XCircle, AlertTriangle, Briefcase,
  CreditCard, Shield, User as UserIcon, CalendarDays, Plus, RefreshCw, BarChart3,
  Palmtree, FileDown, Printer, ChevronRight
} from 'lucide-react'

type TabType = 'list' | 'vacations' | 'stats'

export default function Employees() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('list')
  
  // Solo admin puede acceder
  if (user?.user_type !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield size={64} className="mx-auto text-red-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Acceso Restringido</h2>
          <p className="text-gray-500">Solo los administradores pueden acceder a este módulo.</p>
        </div>
      </div>
    )
  }
  
  const tabs = [
    { id: 'list' as TabType, label: 'Funcionarios', icon: Users },
    { id: 'vacations' as TabType, label: 'Vacaciones y Permisos', icon: Palmtree },
    { id: 'stats' as TabType, label: 'Estadísticas', icon: BarChart3 }
  ]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Users size={28} />
          Gestión de Funcionarios
        </h1>
        <p className="text-indigo-100 mt-1">
          Administración del personal y recursos humanos
        </p>
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
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="p-6">
          {activeTab === 'list' && <EmployeesList />}
          {activeTab === 'vacations' && <VacationsManagement />}
          {activeTab === 'stats' && <EmployeeStats />}
        </div>
      </div>
    </div>
  )
}

// ==================== LISTA DE EMPLEADOS ====================

function EmployeesList() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState<Employee['status'] | ''>('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null)
  
  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', search, filterDept, filterStatus],
    queryFn: () => employeesService.list({
      search: search || undefined,
      department: filterDept || undefined,
      status: filterStatus || undefined
    })
  })
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] })
  })
  
  const handleExport = async () => {
    const content = await employeesService.export('csv')
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `funcionarios-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const getStatusColor = (status: Employee['status']) => {
    const colors: Record<Employee['status'], string> = {
      activo: 'bg-green-100 text-green-700',
      inactivo: 'bg-gray-100 text-gray-700',
      vacaciones: 'bg-blue-100 text-blue-700',
      licencia: 'bg-yellow-100 text-yellow-700',
      despedido: 'bg-red-100 text-red-700',
      renuncia: 'bg-orange-100 text-orange-700'
    }
    return colors[status]
  }
  
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-4 flex-1">
          <div className="relative min-w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Todos los departamentos</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Employee['status'] | '')}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Todos los estados</option>
            {Object.entries(EMPLOYEE_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download size={18} />
            Exportar
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <UserPlus size={18} />
            Nuevo Funcionario
          </button>
        </div>
      </div>
      
      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : employees?.items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No se encontraron funcionarios</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Código</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Funcionario</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Cargo</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Departamento</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Contacto</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {employees?.items.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {emp.employee_code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {emp.photo ? (
                        <img src={emp.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{emp.full_name}</p>
                        <p className="text-xs text-gray-500">CI: {emp.document_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{emp.position}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs">{emp.phone}</p>
                    <p className="text-xs text-gray-500">WA: {(emp.whatsapp && emp.whatsapp.trim()) ? emp.whatsapp : emp.phone || '—'}</p>
                    <p className="text-xs text-gray-500">{emp.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(emp.status)}`}>
                      {EMPLOYEE_STATUS_LABELS[emp.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setViewEmployee(emp)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Ver detalles"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setSelectedEmployee(emp)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Desactivar este funcionario?')) {
                            deleteMutation.mutate(emp.id)
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Desactivar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modales */}
      {(showAddModal || selectedEmployee) && (
        <EmployeeFormModal
          employee={selectedEmployee}
          onClose={() => {
            setShowAddModal(false)
            setSelectedEmployee(null)
          }}
        />
      )}
      
      {viewEmployee && (
        <EmployeeDetailModal
          employee={viewEmployee}
          onClose={() => setViewEmployee(null)}
          onEdit={() => {
            setSelectedEmployee(viewEmployee)
            setViewEmployee(null)
          }}
        />
      )}
    </div>
  )
}

// ==================== MODAL FORMULARIO ====================

function EmployeeFormModal({ employee, onClose }: { employee: Employee | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [activeSection, setActiveSection] = useState('personal')
  
  // Valores por defecto para nuevo empleado
  const defaultValues: Partial<Employee> = {
    document_type: 'cedula',
    gender: 'masculino',
    marital_status: 'soltero',
    nationality: 'Paraguaya',
    city: 'Asunción',
    contract_type: 'indefinido',
    currency: 'PYG',
    payment_frequency: 'mensual',
    ips_enrolled: false,
    education_level: 'secundaria',
    vacation_days_total: 12,
    vacation_days_used: 0,
    status: 'activo'
  }
  
  const [form, setForm] = useState<Partial<Employee>>(
    employee ? { ...defaultValues, ...employee } : defaultValues
  )
  
  const { register: registerUser, users } = useAuthStore()
  const [createSystemUser, setCreateSystemUser] = useState(!employee) // Por defecto crear usuario para nuevos
  const [generatedPassword, setGeneratedPassword] = useState<string>('')
  
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Primero crear el empleado
      const newEmployee = await employeesService.create(data)
      
      // Si se seleccionó crear usuario del sistema
      if (createSystemUser && data.email) {
        // Generar contraseña temporal
        const tempPassword = `SOSC${Math.random().toString(36).slice(-6).toUpperCase()}`
        setGeneratedPassword(tempPassword)
        
        try {
          // Registrar usuario en el sistema
          await registerUser({
            email: data.email,
            password: tempPassword,
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone || '',
            whatsapp: (data.whatsapp && String(data.whatsapp).trim()) ? String(data.whatsapp).trim() : (data.phone || ''),
            user_type: 'technician', // Por defecto técnico, puede cambiarse
          })
          
          // Obtener el ID del usuario recién creado y actualizar el empleado
          const newUser = users.find(u => u.email === data.email)
          if (newUser) {
            await employeesService.update(newEmployee.id, { user_id: newUser.id })
          }
        } catch (err) {
          console.log('Usuario ya existe o error al crear:', err)
        }
      }
      
      return newEmployee
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      if (!generatedPassword) {
        onClose()
      }
      // Si hay contraseña generada, mostrar modal de confirmación
    }
  })
  
  const updateMutation = useMutation({
    mutationFn: (data: any) => employeesService.update(employee!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      onClose()
    }
  })
  
  const handleSave = () => {
    // Validar foto facial para nuevos funcionarios
    if (!employee && !form.photo) {
      alert('Debes capturar la foto facial del funcionario antes de guardar.')
      setActiveSection('personal')
      return
    }
    
    // Validar campos requeridos básicos
    if (!form.first_name || !form.last_name || !form.email) {
      alert('Completa los campos obligatorios: Nombre, Apellido y Email.')
      setActiveSection('personal')
      return
    }
    
    if (employee) {
      updateMutation.mutate(form)
    } else {
      createMutation.mutate(form as any)
    }
  }
  
  const sections = [
    { id: 'personal', label: 'Datos Personales', icon: UserIcon },
    { id: 'contact', label: 'Contacto', icon: Phone },
    { id: 'labor', label: 'Datos Laborales', icon: Briefcase },
    { id: 'payment', label: 'Pagos y Banco', icon: CreditCard },
    { id: 'social', label: 'Seguridad Social', icon: Shield },
    { id: 'education', label: 'Educación', icon: GraduationCap }
  ]
  
  // Modal de confirmación con contraseña generada
  if (generatedPassword) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Funcionario Creado!</h3>
            <p className="text-gray-600 mb-4">
              Se ha creado el usuario del sistema para <strong>{form.first_name || ''} {form.last_name || ''}</strong>
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 mb-2">Credenciales de acceso (guardar en lugar seguro):</p>
              <div className="bg-white rounded p-3 text-left">
                <p className="text-sm"><span className="text-gray-500">Email:</span> <strong>{form.email}</strong></p>
                <p className="text-sm mt-1"><span className="text-gray-500">Contraseña:</span> <strong className="font-mono text-lg">{generatedPassword}</strong></p>
              </div>
              <p className="text-xs text-yellow-700 mt-2">
                El funcionario deberá cambiar su contraseña en el primer inicio de sesión.
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-indigo-50">
          <h3 className="text-lg font-semibold text-indigo-900">
            {employee ? 'Editar Funcionario' : 'Nuevo Funcionario'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-indigo-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar de secciones */}
          <div className="w-48 bg-gray-50 border-r p-2 overflow-y-auto">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                  activeSection === section.id
                    ? 'bg-indigo-600 text-white'
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <section.icon size={16} />
                {section.label}
              </button>
            ))}
          </div>
          
          {/* Contenido del formulario */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeSection === 'personal' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2">Datos Personales</h4>
                
                {/* Foto del Funcionario */}
                <div className={`border rounded-xl p-4 ${!employee && !form.photo ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                  <h5 className="font-medium text-gray-800 flex items-center gap-2 mb-3">
                    <Camera size={18} className="text-indigo-600" />
                    Foto Facial {!employee && <span className="text-red-500">*</span>}
                  </h5>
                  
                  {!employee && !form.photo && (
                    <p className="text-sm text-red-600 mb-3">
                      Es obligatorio cargar la foto del funcionario para el reconocimiento facial.
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow">
                      {form.photo ? (
                        <img src={form.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={32} className="text-gray-400" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="user"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (ev) => setForm({ ...form, photo: ev.target?.result as string })
                            reader.readAsDataURL(file)
                          }
                        }} 
                        className="hidden" 
                        id="emp-photo-capture" 
                      />
                      <label htmlFor="emp-photo-capture" className="px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer text-sm hover:bg-indigo-700 inline-flex items-center gap-2">
                        <Camera size={16} />
                        {form.photo ? 'Cambiar Foto' : 'Tomar/Subir Foto'}
                      </label>
                      {form.photo && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, photo: undefined })}
                          className="block text-sm text-red-600 hover:text-red-800"
                        >
                          Eliminar foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={form.first_name || ''}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                    <input
                      type="text"
                      value={form.last_name || ''}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
                    <select
                      value={form.document_type || 'cedula'}
                      onChange={(e) => setForm({ ...form, document_type: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="cedula">Cédula de Identidad</option>
                      <option value="pasaporte">Pasaporte</option>
                      <option value="ruc">RUC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de Documento *</label>
                    <input
                      type="text"
                      value={form.document_number || ''}
                      onChange={(e) => setForm({ ...form, document_number: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ej: 3.456.789"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento *</label>
                    <input
                      type="date"
                      value={form.birth_date || ''}
                      onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                    <select
                      value={form.gender || 'masculino'}
                      onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
                    <select
                      value={form.marital_status || 'soltero'}
                      onChange={(e) => setForm({ ...form, marital_status: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {Object.entries(MARITAL_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
                  <input
                    type="text"
                    value={form.nationality || ''}
                    onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            )}
            
            {activeSection === 'contact' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2">Información de Contacto</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={form.email || ''}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Principal *</label>
                    <input
                      type="tel"
                      value={form.phone || ''}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (legajo / convocatorias)</label>
                  <input
                    type="tel"
                    value={form.whatsapp ?? ''}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Si se deja vacío, puede usarse el teléfono principal al notificar"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Secundario</label>
                  <input
                    type="tel"
                    value={form.phone_secondary || ''}
                    onChange={(e) => setForm({ ...form, phone_secondary: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                  <input
                    type="text"
                    value={form.address || ''}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={form.city || ''}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barrio</label>
                    <input
                      type="text"
                      value={form.neighborhood || ''}
                      onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                
                <h5 className="font-medium text-gray-700 mt-6 border-t pt-4">Contacto de Emergencia</h5>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={form.emergency_contact_name || ''}
                      onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                    <input
                      type="tel"
                      value={form.emergency_contact_phone || ''}
                      onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parentesco</label>
                    <input
                      type="text"
                      value={form.emergency_contact_relationship || ''}
                      onChange={(e) => setForm({ ...form, emergency_contact_relationship: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ej: Esposo/a, Padre, Madre"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeSection === 'labor' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2">Datos Laborales</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo *</label>
                    <select
                      value={form.position || ''}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Seleccionar cargo</option>
                      {POSITIONS.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento *</label>
                    <select
                      value={form.department || ''}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Seleccionar departamento</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso *</label>
                    <input
                      type="date"
                      value={form.hire_date || ''}
                      onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
                    <select
                      value={form.contract_type || 'indefinido'}
                      onChange={(e) => setForm({ ...form, contract_type: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {Object.entries(CONTRACT_TYPE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {form.contract_type === 'temporal' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin de Contrato</label>
                    <input
                      type="date"
                      value={form.contract_end_date || ''}
                      onChange={(e) => setForm({ ...form, contract_end_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horario de Trabajo</label>
                  <input
                    type="text"
                    value={form.work_schedule || ''}
                    onChange={(e) => setForm({ ...form, work_schedule: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Ej: Lunes a Viernes 08:00-17:00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                  <input
                    type="text"
                    value={form.branch || ''}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                {/* Acceso al sistema */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                    <Shield size={18} />
                    Acceso al Sistema
                  </h5>
                  
                  {!employee ? (
                    // Para nuevo funcionario - opción de crear usuario
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={createSystemUser}
                          onChange={(e) => setCreateSystemUser(e.target.checked)}
                          className="w-5 h-5 rounded text-green-600"
                        />
                        <span className="font-medium">Crear usuario del sistema automáticamente</span>
                      </label>
                      {createSystemUser && (
                        <div className="bg-white rounded p-3 text-sm text-gray-600">
                          <p>✓ Se creará un usuario con el email del funcionario</p>
                          <p>✓ Se generará una contraseña temporal</p>
                          <p>✓ El funcionario podrá marcar asistencia con reconocimiento facial</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Para editar - selector de usuario existente
                    <div>
                      <label className="block text-sm font-medium text-green-800 mb-2">
                        Usuario del Sistema Vinculado
                      </label>
                      <UserSelector 
                        value={form.user_id || ''} 
                        onChange={(userId) => setForm({ ...form, user_id: userId })}
                      />
                      {form.user_id && (
                        <p className="text-xs text-green-600 mt-2">
                          ✓ Este funcionario puede marcar asistencia en el sistema
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Días de Vacaciones Anuales</label>
                    <input
                      type="number"
                      value={form.vacation_days_total || 12}
                      onChange={(e) => setForm({ ...form, vacation_days_total: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                      value={form.status || 'activo'}
                      onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {Object.entries(EMPLOYEE_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {activeSection === 'payment' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2">Salario y Datos Bancarios</h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salario Base *</label>
                    <input
                      type="number"
                      value={form.base_salary || ''}
                      onChange={(e) => setForm({ ...form, base_salary: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                    <select
                      value={form.currency || 'PYG'}
                      onChange={(e) => setForm({ ...form, currency: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="PYG">Guaraníes (₲)</option>
                      <option value="USD">Dólares ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia de Pago</label>
                    <select
                      value={form.payment_frequency || 'mensual'}
                      onChange={(e) => setForm({ ...form, payment_frequency: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="mensual">Mensual</option>
                      <option value="quincenal">Quincenal</option>
                      <option value="semanal">Semanal</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tasa Horaria (costo de MO para tickets)
                    </label>
                    <input
                      type="number"
                      value={form.hourly_rate || ''}
                      onChange={(e) => setForm({ ...form, hourly_rate: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder={form.base_salary ? `Sugerido: ${Math.round(form.base_salary / 192).toLocaleString('es-PY')}` : 'Opcional'}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Si se deja vacío se calcula como salario ÷ 192 hs/mes. Se usa para valorizar la mano de obra en los tickets.
                    </p>
                  </div>
                </div>
                
                <h5 className="font-medium text-gray-700 mt-6 border-t pt-4">Datos Bancarios</h5>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                    <input
                      type="text"
                      value={form.bank_name || ''}
                      onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ej: Banco Itaú"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cuenta</label>
                    <input
                      type="text"
                      value={form.bank_account_number || ''}
                      onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cuenta</label>
                    <select
                      value={form.bank_account_type || 'ahorro'}
                      onChange={(e) => setForm({ ...form, bank_account_type: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="ahorro">Caja de Ahorro</option>
                      <option value="corriente">Cuenta Corriente</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {activeSection === 'social' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2">Seguridad Social (IPS)</h4>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.ips_enrolled || false}
                    onChange={(e) => setForm({ ...form, ips_enrolled: e.target.checked })}
                    className="w-5 h-5 rounded text-indigo-600"
                  />
                  <span>Inscrito en IPS</span>
                </label>
                
                {form.ips_enrolled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número de IPS</label>
                      <input
                        type="text"
                        value={form.ips_number || ''}
                        onChange={(e) => setForm({ ...form, ips_number: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inscripción</label>
                      <input
                        type="date"
                        value={form.ips_enrollment_date || ''}
                        onChange={(e) => setForm({ ...form, ips_enrollment_date: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                )}
                
                <h5 className="font-medium text-gray-700 mt-6 border-t pt-4">Datos Fiscales</h5>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUC (si aplica)</label>
                    <input
                      type="text"
                      value={form.ruc || ''}
                      onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría Tributaria</label>
                    <input
                      type="text"
                      value={form.tax_category || ''}
                      onChange={(e) => setForm({ ...form, tax_category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeSection === 'education' && (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2">Educación</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Educación</label>
                    <select
                      value={form.education_level || 'secundaria'}
                      onChange={(e) => setForm({ ...form, education_level: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {Object.entries(EDUCATION_LEVEL_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título Obtenido</label>
                    <input
                      type="text"
                      value={form.education_title || ''}
                      onChange={(e) => setForm({ ...form, education_title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Institución Educativa</label>
                  <input
                    type="text"
                    value={form.education_institution || ''}
                    onChange={(e) => setForm({ ...form, education_institution: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                
                <h5 className="font-medium text-gray-700 mt-6 border-t pt-4">Tallas (Uniforme)</h5>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Talla Camisa</label>
                    <select
                      value={form.shirt_size || ''}
                      onChange={(e) => setForm({ ...form, shirt_size: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Seleccionar</option>
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Talla Pantalón</label>
                    <input
                      type="text"
                      value={form.pants_size || ''}
                      onChange={(e) => setForm({ ...form, pants_size: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ej: 32, 34"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Talla Calzado</label>
                    <input
                      type="text"
                      value={form.shoe_size || ''}
                      onChange={(e) => setForm({ ...form, shoe_size: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Ej: 42"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-between">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-100">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== MODAL DETALLE ====================

function EmployeeDetailModal({ employee, onClose, onEdit }: { employee: Employee; onClose: () => void; onEdit: () => void }) {
  const [activeTab, setActiveTab] = useState('info')
  
  // Protección contra datos nulos
  if (!employee) {
    return null
  }
  
  const formatCurrency = (amount: number, currency: string) => {
    return currency === 'PYG' 
      ? `₲ ${(amount || 0).toLocaleString()}`
      : `$ ${(amount || 0).toLocaleString()}`
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {employee.photo ? (
                <img src={employee.photo} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white/30" />
              ) : (
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                  {employee.first_name?.[0] || ''}{employee.last_name?.[0] || ''}
                </div>
              )}
              <div>
                <p className="text-sm opacity-80">{employee.employee_code || ''}</p>
                <h3 className="text-2xl font-bold">{employee.full_name || ''}</h3>
                <p className="opacity-90">{employee.position || ''} - {employee.department || ''}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={onEdit} className="p-2 hover:bg-white/20 rounded-lg" title="Editar">
                <Edit2 size={20} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex border-b">
          {['info', 'labor', 'vacations'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium ${
                activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-600'
              }`}
            >
              {tab === 'info' ? 'Información' : tab === 'labor' ? 'Laboral' : 'Vacaciones'}
            </button>
          ))}
        </div>
        
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'info' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <UserIcon size={18} className="text-indigo-600" />
                  Datos Personales
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Cédula:</span> {employee.document_number || '-'}</p>
                  <p><span className="text-gray-500">Fecha Nac.:</span> {employee.birth_date ? new Date(employee.birth_date).toLocaleDateString() : '-'} {employee.age ? `(${employee.age} años)` : ''}</p>
                  <p><span className="text-gray-500">Género:</span> {employee.gender || '-'}</p>
                  <p><span className="text-gray-500">Estado Civil:</span> {employee.marital_status ? MARITAL_STATUS_LABELS[employee.marital_status] : '-'}</p>
                  <p><span className="text-gray-500">Nacionalidad:</span> {employee.nationality || '-'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Phone size={18} className="text-indigo-600" />
                  Contacto
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Email:</span> {employee.email || '-'}</p>
                  <p><span className="text-gray-500">Teléfono:</span> {employee.phone || '-'}</p>
                  <p><span className="text-gray-500">WhatsApp:</span> {(employee.whatsapp && employee.whatsapp.trim()) ? employee.whatsapp : (employee.phone || '-')}</p>
                  <p><span className="text-gray-500">Dirección:</span> {employee.address || '-'}, {employee.city || '-'}</p>
                </div>
                
                <h4 className="font-semibold text-gray-800 flex items-center gap-2 mt-4">
                  <Heart size={18} className="text-red-500" />
                  Emergencia
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Contacto:</span> {employee.emergency_contact_name || '-'}</p>
                  <p><span className="text-gray-500">Teléfono:</span> {employee.emergency_contact_phone || '-'}</p>
                  <p><span className="text-gray-500">Parentesco:</span> {employee.emergency_contact_relationship || '-'}</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'labor' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Briefcase size={18} className="text-indigo-600" />
                  Información Laboral
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Cargo:</span> {employee.position || '-'}</p>
                  <p><span className="text-gray-500">Departamento:</span> {employee.department || '-'}</p>
                  <p><span className="text-gray-500">Fecha Ingreso:</span> {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : '-'}</p>
                  <p><span className="text-gray-500">Tipo Contrato:</span> {employee.contract_type ? CONTRACT_TYPE_LABELS[employee.contract_type] : '-'}</p>
                  <p><span className="text-gray-500">Horario:</span> {employee.work_schedule || '-'}</p>
                </div>
                
                <h4 className="font-semibold text-gray-800 flex items-center gap-2 mt-4">
                  <Shield size={18} className="text-green-600" />
                  Seguridad Social
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">IPS:</span> {employee.ips_enrolled ? `Sí - ${employee.ips_number || ''}` : 'No inscrito'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <DollarSign size={18} className="text-green-600" />
                  Salario y Banco
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Salario:</span> <span className="font-semibold text-green-600">{formatCurrency(employee.base_salary || 0, employee.currency || 'PYG')}</span></p>
                  <p><span className="text-gray-500">Frecuencia:</span> {employee.payment_frequency || '-'}</p>
                  <p><span className="text-gray-500">Banco:</span> {employee.bank_name || '-'}</p>
                  <p><span className="text-gray-500">Cuenta:</span> {employee.bank_account_number || '-'}</p>
                </div>
                
                <h4 className="font-semibold text-gray-800 flex items-center gap-2 mt-4">
                  <GraduationCap size={18} className="text-blue-600" />
                  Educación
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Nivel:</span> {employee.education_level ? EDUCATION_LEVEL_LABELS[employee.education_level] : '-'}</p>
                  <p><span className="text-gray-500">Título:</span> {employee.education_title || '-'}</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'vacations' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-700">{employee.vacation_days_total || 0}</p>
                  <p className="text-sm text-blue-600">Días Totales</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-orange-700">{employee.vacation_days_used}</p>
                  <p className="text-sm text-orange-600">Días Usados</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-700">{employee.vacation_days_available}</p>
                  <p className="text-sm text-green-600">Días Disponibles</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== VACACIONES ====================

function VacationsManagement() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  const { data: pending, isLoading } = useQuery({
    queryKey: ['pending-vacations'],
    queryFn: () => employeesService.listPendingVacations()
  })
  
  const approveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'aprobado' | 'rechazado' }) =>
      employeesService.updateVacationStatus(id, status, user?.full_name || 'Admin'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-vacations'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    }
  })
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Solicitudes Pendientes</h3>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : pending?.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Palmtree size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay solicitudes pendientes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending?.map((v: any) => (
            <div key={v.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{v.employee_name}</p>
                  <p className="text-sm text-gray-600">
                    {VACATION_TYPE_LABELS[v.type as EmployeeVacation['type']]}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(v.start_date).toLocaleDateString()} - {new Date(v.end_date).toLocaleDateString()}
                    <span className="ml-2 font-medium">({v.days} días)</span>
                  </p>
                  {v.reason && <p className="text-sm text-gray-600 mt-2">{v.reason}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMutation.mutate({ id: v.id, status: 'aprobado' })}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Aprobar
                  </button>
                  <button
                    onClick={() => approveMutation.mutate({ id: v.id, status: 'rechazado' })}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <XCircle size={18} />
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== ESTADÍSTICAS ====================

function EmployeeStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: () => employeesService.getStats()
  })
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50 rounded-xl p-4">
          <p className="text-sm text-indigo-600">Total Funcionarios</p>
          <p className="text-3xl font-bold text-indigo-700">{stats?.total}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-sm text-green-600">Activos</p>
          <p className="text-3xl font-bold text-green-700">{stats?.active}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-600">Antigüedad Promedio</p>
          <p className="text-3xl font-bold text-blue-700">{stats?.average_tenure} años</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-sm text-orange-600">Solicitudes Pendientes</p>
          <p className="text-3xl font-bold text-orange-700">{stats?.pending_vacations}</p>
        </div>
      </div>
      
      {/* Por departamento */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="font-semibold mb-4">Funcionarios por Departamento</h4>
        <div className="space-y-3">
          {stats?.by_department.map(item => (
            <div key={item.department} className="flex items-center gap-4">
              <span className="w-32 text-sm text-gray-600">{item.department}</span>
              <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${(item.count / (stats?.active || 1)) * 100}%` }}
                />
              </div>
              <span className="w-8 text-sm font-medium">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Por tipo de contrato */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="font-semibold mb-4">Por Tipo de Contrato</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats?.by_contract_type.map(item => (
            <div key={item.type} className="text-center p-4 bg-white rounded-lg">
              <p className="text-2xl font-bold text-indigo-600">{item.count}</p>
              <p className="text-sm text-gray-600">{CONTRACT_TYPE_LABELS[item.type as Employee['contract_type']]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ==================== SELECTOR DE USUARIO ====================

function UserSelector({ value, onChange }: { value: string; onChange: (userId: string) => void }) {
  const { users } = useAuthStore()
  
  // Filtrar solo usuarios que no son clientes (admin, técnicos, proveedores)
  const availableUsers = users.filter(u => u.user_type !== 'client')
  
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border rounded-lg bg-white"
    >
      <option value="">-- Sin vincular --</option>
      {availableUsers.map(u => (
        <option key={u.id} value={u.id}>
          {u.full_name} ({u.email}) - {u.user_type}
        </option>
      ))}
    </select>
  )
}

