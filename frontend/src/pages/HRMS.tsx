import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import {
  hrmsService,
  Department, Position, JobPosting, Candidate, Training, PerformanceReview,
  Benefit, LeaveRequest, HRDashboardStats,
  POSITION_LEVELS, JOB_TYPES, JOB_STATUS, CANDIDATE_STATUS, CANDIDATE_SOURCES,
  TRAINING_TYPES, REVIEW_TYPES, REVIEW_STATUS, BENEFIT_TYPES, LEAVE_TYPES, LEAVE_STATUS
} from '../services/hrms'
import {
  Users, Building2, Briefcase, GraduationCap, Target, Gift, FileText, Calendar,
  Plus, Edit2, Trash2, Eye, Search, Filter, ChevronRight, ChevronDown,
  UserPlus, ClipboardList, Award, Heart, Clock, CheckCircle, XCircle,
  TrendingUp, TrendingDown, Loader2, Star, Phone, Mail, MapPin,
  LayoutDashboard, Settings, BarChart3, X, Save, AlertCircle
} from 'lucide-react'

type ModuleType = 'dashboard' | 'organization' | 'recruitment' | 'training' | 'performance' | 'benefits' | 'leaves' | 'documents'
type SubModuleType = 'departments' | 'positions' | 'postings' | 'candidates' | 'courses' | 'reviews' | 'benefit-plans' | 'requests'

const MODULES = [
  { id: 'dashboard' as ModuleType, label: 'Dashboard', icon: LayoutDashboard, color: 'indigo', subModules: [] },
  { 
    id: 'organization' as ModuleType, label: 'Organización', icon: Building2, color: 'blue',
    subModules: [
      { id: 'departments' as SubModuleType, label: 'Departamentos', icon: Building2 },
      { id: 'positions' as SubModuleType, label: 'Cargos', icon: Briefcase }
    ]
  },
  { 
    id: 'recruitment' as ModuleType, label: 'Reclutamiento', icon: UserPlus, color: 'green',
    subModules: [
      { id: 'postings' as SubModuleType, label: 'Vacantes', icon: ClipboardList },
      { id: 'candidates' as SubModuleType, label: 'Candidatos', icon: Users }
    ]
  },
  { id: 'training' as ModuleType, label: 'Capacitación', icon: GraduationCap, color: 'purple', subModules: [] },
  { id: 'performance' as ModuleType, label: 'Desempeño', icon: Target, color: 'orange', subModules: [] },
  { id: 'benefits' as ModuleType, label: 'Beneficios', icon: Heart, color: 'pink', subModules: [] },
  { id: 'leaves' as ModuleType, label: 'Permisos', icon: Calendar, color: 'teal', subModules: [] },
  { id: 'documents' as ModuleType, label: 'Documentos', icon: FileText, color: 'gray', subModules: [] }
]

export default function HRMS() {
  const { user } = useAuthStore()
  const [activeModule, setActiveModule] = useState<ModuleType>('dashboard')
  const [activeSubModule, setActiveSubModule] = useState<SubModuleType | null>(null)
  const [expandedModules, setExpandedModules] = useState<ModuleType[]>(['organization', 'recruitment'])

  if (user?.user_type !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <XCircle className="mx-auto text-red-400 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-800">Acceso Restringido</h2>
          <p className="text-gray-600">Solo administradores pueden acceder al módulo de RRHH.</p>
        </div>
      </div>
    )
  }

  const toggleModule = (moduleId: ModuleType) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) ? prev.filter(m => m !== moduleId) : [...prev, moduleId]
    )
  }

  const handleModuleClick = (module: typeof MODULES[0]) => {
    if (module.subModules.length === 0) {
      setActiveModule(module.id)
      setActiveSubModule(null)
    } else {
      toggleModule(module.id)
      if (!expandedModules.includes(module.id) && module.subModules.length > 0) {
        setActiveModule(module.id)
        setActiveSubModule(module.subModules[0].id)
      }
    }
  }

  const getModuleColor = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
      teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
      gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }
    }
    return colors[color] || colors.indigo
  }

  const getCurrentTitle = () => {
    const module = MODULES.find(m => m.id === activeModule)
    if (!module) return 'HRMS'
    if (activeSubModule) {
      const sub = module.subModules.find(s => s.id === activeSubModule)
      return sub ? `${module.label} / ${sub.label}` : module.label
    }
    return module.label
  }

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Sidebar */}
      <div className="w-64 bg-white rounded-xl shadow-sm border flex-shrink-0 overflow-hidden">
        <div className="p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Users size={20} />
            HRMS
          </h2>
          <p className="text-xs text-indigo-100 mt-1">Gestión de Recursos Humanos</p>
        </div>
        
        <nav className="p-2 overflow-y-auto h-[calc(100%-80px)]">
          {MODULES.map(module => {
            const colors = getModuleColor(module.color)
            const isActive = activeModule === module.id && !activeSubModule
            const isExpanded = expandedModules.includes(module.id)
            const hasSubModules = module.subModules.length > 0
            
            return (
              <div key={module.id} className="mb-1">
                <button
                  onClick={() => handleModuleClick(module)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? `${colors.bg} ${colors.text}` 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <module.icon size={18} />
                  <span className="flex-1 text-left">{module.label}</span>
                  {hasSubModules && (
                    isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                  )}
                </button>
                
                {hasSubModules && isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {module.subModules.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveModule(module.id)
                          setActiveSubModule(sub.id)
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                          activeModule === module.id && activeSubModule === sub.id
                            ? `${colors.bg} ${colors.text}`
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <sub.icon size={14} />
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-800">{getCurrentTitle()}</h2>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {activeModule === 'dashboard' && <DashboardView />}
          {activeModule === 'organization' && activeSubModule === 'departments' && <DepartmentsView />}
          {activeModule === 'organization' && activeSubModule === 'positions' && <PositionsView />}
          {activeModule === 'recruitment' && activeSubModule === 'postings' && <JobPostingsView />}
          {activeModule === 'recruitment' && activeSubModule === 'candidates' && <CandidatesView />}
          {activeModule === 'training' && <TrainingsView />}
          {activeModule === 'performance' && <PerformanceView />}
          {activeModule === 'benefits' && <BenefitsView />}
          {activeModule === 'leaves' && <LeavesView />}
          {activeModule === 'documents' && <DocumentsView />}
          
          {activeModule !== 'dashboard' && !activeSubModule && MODULES.find(m => m.id === activeModule)?.subModules.length === 0 ? null : (
            activeModule !== 'dashboard' && !activeSubModule && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600">Selecciona una opción</h3>
                  <p className="text-gray-400">Elige un submódulo del menú lateral</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== DASHBOARD VIEW ====================

function DashboardView() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['hr-dashboard'],
    queryFn: () => hrmsService.getDashboardStats()
  })

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
  }

  if (!stats) return null

  const kpis = [
    { label: 'Total Empleados', value: stats.total_employees, icon: Users, color: 'blue' },
    { label: 'Empleados Activos', value: stats.active_employees, icon: CheckCircle, color: 'green' },
    { label: 'Nuevos este Mes', value: stats.new_hires_month, icon: UserPlus, color: 'indigo' },
    { label: 'Vacantes Abiertas', value: stats.open_positions, icon: Briefcase, color: 'purple' },
    { label: 'Permisos Pendientes', value: stats.pending_leaves, icon: Clock, color: 'orange' },
    { label: 'Evaluaciones Pendientes', value: stats.upcoming_reviews, icon: Target, color: 'pink' }
  ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${kpi.color}-50`}>
                <kpi.icon size={20} className={`text-${kpi.color}-600`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{kpi.value}</p>
                <p className="text-xs text-gray-500">{kpi.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Headcount por Departamento */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Empleados por Departamento</h3>
          <div className="space-y-3">
            {stats.headcount_by_department.map((dept, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{dept.department}</span>
                    <span className="font-medium">{dept.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${(dept.count / stats.total_employees) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Métricas */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Métricas Clave</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.turnover_rate}%</p>
              <p className="text-sm text-blue-700">Tasa de Rotación</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.avg_tenure_years}</p>
              <p className="text-sm text-green-700">Años Promedio</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{stats.training_completion_rate.toFixed(0)}%</p>
              <p className="text-sm text-purple-700">Capacitación</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">{stats.headcount_by_type[0]?.count || 0}</p>
              <p className="text-sm text-orange-700">Tiempo Completo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== DEPARTMENTS VIEW ====================

function DepartmentsView() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => hrmsService.listDepartments()
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hrmsService.deleteDepartment(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); queryClient.invalidateQueries({ queryKey: ['hr-dashboard'] }) }
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{data?.items.length || 0} departamentos</p>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Nuevo Departamento
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items.map(dept => (
            <div key={dept.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono text-gray-400">{dept.code}</span>
                  <h3 className="font-semibold text-gray-800">{dept.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(dept); setShowForm(true) }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => deleteMutation.mutate(dept.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Users size={14} /> {dept.employee_count}</span>
                {dept.manager_name && <span>Jefe: {dept.manager_name}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DepartmentForm 
          department={editing} 
          onClose={() => { setShowForm(false); setEditing(null) }} 
        />
      )}
    </div>
  )
}

function DepartmentForm({ department, onClose }: { department: Department | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(department?.name || '')
  const [code, setCode] = useState(department?.code || '')
  const [description, setDescription] = useState(department?.description || '')

  const createMutation = useMutation({
    mutationFn: (data: any) => department 
      ? hrmsService.updateDepartment(department.id, data)
      : hrmsService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({ name, code, description })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{department ? 'Editar' : 'Nuevo'} Departamento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} required className="w-full px-3 py-2 border rounded-lg font-mono" maxLength={5} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {createMutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== POSITIONS VIEW ====================

function PositionsView() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Position | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['positions'],
    queryFn: () => hrmsService.listPositions()
  })

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => hrmsService.listDepartments()
  })

  const formatSalary = (amount: number) => `₲ ${amount.toLocaleString()}`

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{data?.items.length || 0} cargos</p>
        <button onClick={() => { setEditing(null); setShowForm(true) }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
          <Plus size={16} /> Nuevo Cargo
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Cargo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Departamento</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Nivel</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Rango Salarial</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.items.map(pos => (
                <tr key={pos.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{pos.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{pos.department_name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{POSITION_LEVELS[pos.level]}</span></td>
                  <td className="px-4 py-3 text-right text-sm">{formatSalary(pos.min_salary)} - {formatSalary(pos.max_salary)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${pos.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {pos.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setEditing(pos); setShowForm(true) }} className="p-1.5 text-gray-400 hover:text-blue-600">
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <PositionForm position={editing} departments={departments?.items || []} onClose={() => { setShowForm(false); setEditing(null) }} />}
    </div>
  )
}

function PositionForm({ position, departments, onClose }: { position: Position | null; departments: Department[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(position?.title || '')
  const [departmentId, setDepartmentId] = useState(position?.department_id || '')
  const [level, setLevel] = useState<Position['level']>(position?.level || 'junior')
  const [minSalary, setMinSalary] = useState(position?.min_salary || 0)
  const [maxSalary, setMaxSalary] = useState(position?.max_salary || 0)

  const mutation = useMutation({
    mutationFn: (data: any) => position ? hrmsService.updatePosition(position.id, data) : hrmsService.createPosition(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['positions'] }); queryClient.invalidateQueries({ queryKey: ['hr-dashboard'] }); onClose() }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dept = departments.find(d => d.id === departmentId)
    mutation.mutate({ title, department_id: departmentId, department_name: dept?.name || '', level, min_salary: minSalary, max_salary: maxSalary, is_active: true })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{position ? 'Editar' : 'Nuevo'} Cargo</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título del Cargo</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
            <select value={departmentId} onChange={e => setDepartmentId(e.target.value)} required className="w-full px-3 py-2 border rounded-lg">
              <option value="">Seleccionar...</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
            <select value={level} onChange={e => setLevel(e.target.value as Position['level'])} className="w-full px-3 py-2 border rounded-lg">
              {Object.entries(POSITION_LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salario Mín.</label>
              <input type="number" value={minSalary} onChange={e => setMinSalary(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salario Máx.</label>
              <input type="number" value={maxSalary} onChange={e => setMaxSalary(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {mutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== JOB POSTINGS VIEW ====================

function JobPostingsView() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['job-postings'],
    queryFn: () => hrmsService.listJobPostings()
  })

  const { data: positions } = useQuery({
    queryKey: ['positions'],
    queryFn: () => hrmsService.listPositions()
  })

  const getStatusColor = (status: JobPosting['status']) => {
    const colors = { draft: 'bg-gray-100 text-gray-700', open: 'bg-green-100 text-green-700', paused: 'bg-yellow-100 text-yellow-700', closed: 'bg-red-100 text-red-700' }
    return colors[status]
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{data?.items.length || 0} vacantes</p>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm">
          <Plus size={16} /> Nueva Vacante
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Briefcase size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay vacantes publicadas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.items.map(posting => (
            <div key={posting.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">{posting.position_title}</h3>
                  <p className="text-sm text-gray-500">{posting.department_name} • {JOB_TYPES[posting.type]}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(posting.status)}`}>
                  {JOB_STATUS[posting.status]}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Users size={14} /> {posting.applications_count} aplicaciones</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {posting.location}</span>
              </div>
              {posting.salary_range && (
                <p className="mt-2 text-sm text-green-600">₲ {posting.salary_range.min.toLocaleString()} - ₲ {posting.salary_range.max.toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && <JobPostingForm positions={positions?.items || []} onClose={() => setShowForm(false)} />}
    </div>
  )
}

function JobPostingForm({ positions, onClose }: { positions: Position[]; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [positionId, setPositionId] = useState('')
  const [location, setLocation] = useState('Asunción')
  const [type, setType] = useState<JobPosting['type']>('full-time')
  const [description, setDescription] = useState('')

  const mutation = useMutation({
    mutationFn: (data: any) => hrmsService.createJobPosting(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['job-postings'] }); queryClient.invalidateQueries({ queryKey: ['hr-dashboard'] }); onClose() }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const pos = positions.find(p => p.id === positionId)
    mutation.mutate({
      position_id: positionId,
      position_title: pos?.title || '',
      department_name: pos?.department_name || '',
      description,
      requirements: [],
      benefits: [],
      salary_range: pos ? { min: pos.min_salary, max: pos.max_salary } : undefined,
      location,
      type,
      status: 'open',
      published_at: new Date().toISOString()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Nueva Vacante</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
            <select value={positionId} onChange={e => setPositionId(e.target.value)} required className="w-full px-3 py-2 border rounded-lg">
              <option value="">Seleccionar cargo...</option>
              {positions.filter(p => p.is_active).map(p => <option key={p.id} value={p.id}>{p.title} - {p.department_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
              <input value={location} onChange={e => setLocation(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={type} onChange={e => setType(e.target.value as JobPosting['type'])} className="w-full px-3 py-2 border rounded-lg">
                {Object.entries(JOB_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded-lg" placeholder="Describe el puesto, responsabilidades, requisitos..." />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              {mutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== CANDIDATES VIEW ====================

function CandidatesView() {
  const { data, isLoading } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => hrmsService.listCandidates()
  })

  const getStatusColor = (status: Candidate['status']) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700', screening: 'bg-yellow-100 text-yellow-700',
      interview: 'bg-purple-100 text-purple-700', technical: 'bg-indigo-100 text-indigo-700',
      offer: 'bg-green-100 text-green-700', hired: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{data?.items.length || 0} candidatos</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay candidatos registrados</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Candidato</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Vacante</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Fuente</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Rating</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.items.map(candidate => (
                <tr key={candidate.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{candidate.full_name}</p>
                    <p className="text-xs text-gray-500">{candidate.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{candidate.job_title}</td>
                  <td className="px-4 py-3 text-sm">{CANDIDATE_SOURCES[candidate.source]}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={12} className={i <= candidate.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                      {CANDIDATE_STATUS[candidate.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600"><Eye size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ==================== TRAININGS VIEW ====================

function TrainingsView() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['trainings'],
    queryFn: () => hrmsService.listTrainings()
  })

  const getStatusColor = (status: Training['status']) => {
    const colors = { planned: 'bg-blue-100 text-blue-700', 'in-progress': 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' }
    return colors[status]
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{data?.items.length || 0} capacitaciones</p>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm">
          <Plus size={16} /> Nueva Capacitación
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <GraduationCap size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay capacitaciones registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.items.map(training => (
            <div key={training.id} className="border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-purple-600 font-medium">{TRAINING_TYPES[training.type]}</span>
                  <h3 className="font-semibold text-gray-800">{training.title}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(training.status)}`}>
                  {training.status === 'in-progress' ? 'En Curso' : training.status === 'completed' ? 'Completado' : training.status === 'cancelled' ? 'Cancelado' : 'Planificado'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{training.description}</p>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Clock size={14} /> {training.duration_hours}h</span>
                <span className="flex items-center gap-1"><Users size={14} /> {training.participants.length} participantes</span>
                {training.is_mandatory && <span className="text-red-500 text-xs">Obligatorio</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <TrainingForm onClose={() => setShowForm(false)} />}
    </div>
  )
}

function TrainingForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<Training['type']>('course')
  const [category, setCategory] = useState('')
  const [duration, setDuration] = useState(8)
  const [isMandatory, setIsMandatory] = useState(false)

  const mutation = useMutation({
    mutationFn: (data: any) => hrmsService.createTraining(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trainings'] }); queryClient.invalidateQueries({ queryKey: ['hr-dashboard'] }); onClose() }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ title, description, type, category, duration_hours: duration, is_mandatory: isMandatory, status: 'planned' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Nueva Capacitación</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select value={type} onChange={e => setType(e.target.value as Training['type'])} className="w-full px-3 py-2 border rounded-lg">
                {Object.entries(TRAINING_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <input value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Ej: Seguridad, Técnico" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración (horas)</label>
              <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={1} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <label className="flex items-center gap-2 mt-6">
              <input type="checkbox" checked={isMandatory} onChange={e => setIsMandatory(e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
              <span className="text-sm">Obligatorio</span>
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              {mutation.isPending ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ==================== PERFORMANCE VIEW ====================

function PerformanceView() {
  const { data, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => hrmsService.listReviews()
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{data?.items.length || 0} evaluaciones</p>
        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 text-sm">
          <Plus size={16} /> Nueva Evaluación
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Target size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay evaluaciones registradas</p>
          <p className="text-sm mt-2">Crea ciclos de evaluación para medir el desempeño</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Empleado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Período</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tipo</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Rating</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.items.map(review => (
                <tr key={review.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{review.employee_name}</td>
                  <td className="px-4 py-3 text-sm">{review.period}</td>
                  <td className="px-4 py-3 text-sm">{REVIEW_TYPES[review.type]}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-orange-600">{review.overall_rating}/5</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100">{REVIEW_STATUS[review.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ==================== BENEFITS VIEW ====================

function BenefitsView() {
  const { data, isLoading } = useQuery({
    queryKey: ['benefits'],
    queryFn: () => hrmsService.listBenefits()
  })

  const formatCurrency = (amount: number) => `₲ ${amount.toLocaleString()}`

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{data?.items.length || 0} planes de beneficios</p>
        <button className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex items-center gap-2 text-sm">
          <Plus size={16} /> Nuevo Beneficio
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items.map(benefit => (
            <div key={benefit.id} className="border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center">
                    <Heart size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{benefit.name}</h3>
                    <span className="text-xs text-gray-500">{BENEFIT_TYPES[benefit.type]}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${benefit.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {benefit.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-3">{benefit.description}</p>
              <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Costo Empleado</p>
                  <p className="font-medium">{formatCurrency(benefit.cost_employee)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Costo Empresa</p>
                  <p className="font-medium">{formatCurrency(benefit.cost_employer)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ==================== LEAVES VIEW ====================

function LeavesView() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  const { data, isLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: () => hrmsService.listLeaveRequests()
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => hrmsService.approveLeaveRequest(id, user?.id || ''),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leave-requests'] }); queryClient.invalidateQueries({ queryKey: ['hr-dashboard'] }) }
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => hrmsService.rejectLeaveRequest(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leave-requests'] }); queryClient.invalidateQueries({ queryKey: ['hr-dashboard'] }) }
  })

  const getStatusColor = (status: LeaveRequest['status']) => {
    const colors = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-600' }
    return colors[status]
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">{data?.items.length || 0} solicitudes</p>
          <span className="text-sm text-yellow-600">{data?.items.filter(r => r.status === 'pending').length || 0} pendientes</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay solicitudes de permisos</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Empleado</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Fechas</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Días</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.items.map(request => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{request.employee_name}</td>
                  <td className="px-4 py-3 text-sm">{LEAVE_TYPES[request.type]}</td>
                  <td className="px-4 py-3 text-sm">{new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center font-medium">{request.days}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {LEAVE_STATUS[request.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {request.status === 'pending' && (
                      <div className="flex gap-1">
                        <button onClick={() => approveMutation.mutate(request.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Aprobar">
                          <CheckCircle size={16} />
                        </button>
                        <button onClick={() => rejectMutation.mutate(request.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Rechazar">
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ==================== DOCUMENTS VIEW ====================

function DocumentsView() {
  const { data, isLoading } = useQuery({
    queryKey: ['hr-documents'],
    queryFn: () => hrmsService.listDocuments()
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{data?.items.length || 0} documentos</p>
        <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm">
          <Plus size={16} /> Subir Documento
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={32} /></div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No hay documentos cargados</p>
          <p className="text-sm mt-2">Sube contratos, certificados y otros documentos de empleados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items.map(doc => (
            <div key={doc.id} className="border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FileText size={20} className="text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{doc.title}</h3>
                  <p className="text-xs text-gray-500">{doc.employee_name}</p>
                </div>
                {doc.is_signed && <CheckCircle size={16} className="text-green-500" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
