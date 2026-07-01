import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliersService, Supplier, SUPPLIER_CATEGORIES } from '../services/suppliers'
import { Plus, Search, Truck, Phone, Mail, Edit, Trash2, X, User, UserCheck } from 'lucide-react'

interface SupplierFormData {
  business_name: string
  trade_name: string
  tax_id: string
  email: string
  phone: string
  whatsapp: string
  address: string
  city: string
  category: string
  contact_name: string
  contact_phone: string
  contact_email: string
  contact_whatsapp: string
  payment_terms: string
  notes: string
}

const initialFormData: SupplierFormData = {
  business_name: '',
  trade_name: '',
  tax_id: '',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  city: '',
  category: 'General',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  contact_whatsapp: '',
  payment_terms: '',
  notes: ''
}

export default function Suppliers() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData)
  
  const queryClient = useQueryClient()
  
  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search, categoryFilter],
    queryFn: () => suppliersService.list({ 
      ...(search && { search }),
      ...(categoryFilter && { category: categoryFilter })
    }),
  })
  
  const createMutation = useMutation({
    mutationFn: (data: Partial<Supplier>) => suppliersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      closeModal()
    }
  })
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Supplier> }) => suppliersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      closeModal()
    }
  })
  
  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    }
  })
  
  const openCreateModal = () => {
    setEditingSupplier(null)
    setFormData(initialFormData)
    setShowModal(true)
  }
  
  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      business_name: supplier.business_name,
      trade_name: supplier.trade_name || '',
      tax_id: supplier.tax_id || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      whatsapp: supplier.whatsapp || '',
      address: supplier.address || '',
      city: supplier.city || '',
      category: supplier.category,
      contact_name: supplier.contact_name || '',
      contact_phone: supplier.contact_phone || '',
      contact_email: supplier.contact_email || '',
      contact_whatsapp: supplier.contact_whatsapp || '',
      payment_terms: supplier.payment_terms || '',
      notes: supplier.notes || ''
    })
    setShowModal(true)
  }
  
  const closeModal = () => {
    setShowModal(false)
    setEditingSupplier(null)
    setFormData(initialFormData)
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const supplierData: Partial<Supplier> = {
      business_name: formData.business_name,
      trade_name: formData.trade_name || null,
      tax_id: formData.tax_id || null,
      email: formData.email || null,
      phone: formData.phone || null,
      whatsapp: formData.whatsapp || null,
      address: formData.address || null,
      city: formData.city || null,
      category: formData.category,
      contact_name: formData.contact_name || null,
      contact_phone: formData.contact_phone || null,
      contact_email: formData.contact_email || null,
      contact_whatsapp: formData.contact_whatsapp || null,
      payment_terms: formData.payment_terms || null,
      notes: formData.notes || null
    }
    
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: supplierData })
    } else {
      createMutation.mutate(supplierData)
    }
  }
  
  const handleDelete = (id: string, isRegistered?: boolean) => {
    if (isRegistered) {
      alert('No se puede eliminar un proveedor que es usuario registrado')
      return
    }
    if (confirm('¿Está seguro de eliminar este proveedor?')) {
      deleteMutation.mutate(id)
    }
  }
  
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Refrigeración': 'bg-cyan-100 text-cyan-800',
      'Electrónica': 'bg-purple-100 text-purple-800',
      'Ferretería': 'bg-orange-100 text-orange-800',
      'Seguridad': 'bg-red-100 text-red-800',
      'Tecnología': 'bg-blue-100 text-blue-800',
      'Climatización': 'bg-green-100 text-green-800',
      'Automatización': 'bg-yellow-100 text-yellow-800',
      'General': 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }
  
  // Contar proveedores registrados
  const registeredCount = data?.items?.filter(s => s.is_registered_user).length || 0
  const totalCount = data?.items?.length || 0
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Proveedores</h2>
          <p className="text-sm text-gray-500">
            {totalCount} proveedores en total
            {registeredCount > 0 && ` (${registeredCount} registrados en el sistema)`}
          </p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Proveedor
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar proveedores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todas las categorías</option>
            {SUPPLIER_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Cargando...</div>
      ) : data?.items?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Truck size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No hay proveedores</h3>
          <p className="text-gray-500">Agrega proveedores o espera a que se registren en el sistema</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.items?.map((supplier) => (
            <div key={supplier.id} className={`bg-white rounded-xl shadow-sm border ${supplier.is_registered_user ? 'border-green-200 ring-1 ring-green-100' : 'border-gray-100'} p-6 hover:shadow-md transition-shadow`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${supplier.is_registered_user ? 'bg-green-100' : 'bg-green-100'}`}>
                  <Truck className="text-green-600" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 truncate">{supplier.business_name}</h3>
                    {supplier.is_registered_user && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full whitespace-nowrap">
                        <UserCheck size={12} /> Registrado
                      </span>
                    )}
                  </div>
                  {supplier.trade_name && (
                    <p className="text-sm text-gray-500 truncate">{supplier.trade_name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-400">{supplier.code}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(supplier.category)}`}>
                      {supplier.category}
                    </span>
                  </div>
                </div>
                {!supplier.is_registered_user && (
                  <div className="flex gap-1">
                    <button 
                      onClick={() => openEditModal(supplier)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(supplier.id, supplier.is_registered_user)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                {supplier.contact_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={14} />
                    {supplier.contact_name}
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} />
                    {supplier.phone}
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} />
                    {supplier.email}
                  </div>
                )}
                {(supplier.whatsapp || supplier.phone) && (
                  <p className="text-sm text-gray-600">WhatsApp: {supplier.whatsapp || supplier.phone}</p>
                )}
                {(supplier.contact_email || supplier.contact_phone || supplier.contact_whatsapp) && (
                  <p className="text-xs text-gray-500">
                    Contacto: {supplier.contact_email || '—'} · {supplier.contact_phone || '—'} · WA: {supplier.contact_whatsapp || supplier.contact_phone || '—'}
                  </p>
                )}
                {supplier.payment_terms && (
                  <p className="text-sm text-gray-500">Pago: {supplier.payment_terms}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">
                {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
                  <input
                    type="text"
                    required
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nombre de la empresa"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
                  <input
                    type="text"
                    value={formData.trade_name}
                    onChange={(e) => setFormData({...formData, trade_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Marca o nombre comercial"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="80100001-5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {SUPPLIER_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="ventas@proveedor.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="021 600 100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp empresa (legajo)</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0981 000 000"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Persona de Contacto</label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nombre del contacto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono del contacto</label>
                  <input
                    type="text"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email del contacto</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp del contacto</label>
                  <input
                    type="text"
                    value={formData.contact_whatsapp}
                    onChange={(e) => setFormData({ ...formData, contact_whatsapp: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condición de Pago</label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({...formData, payment_terms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="30 días, Contado, etc."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Av. Principal 123"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Asunción"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Observaciones sobre el proveedor"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
