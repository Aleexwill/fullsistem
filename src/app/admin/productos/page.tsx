'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Star,
  Package,
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  isFeatured: boolean;
  isActive: boolean;
  images: string[];
  createdAt: string;
}

export default function AdminProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetch(`/api/productos?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}" del catalogo?`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/productos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setTotal((prev) => prev - 1);
      }
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p))
        );
      }
    } catch {}
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !current }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isFeatured: !current } : p))
        );
      }
    } catch {}
  };

  const formatGs = (n: number) => 'Gs. ' + n.toLocaleString('es-PY');

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 uppercase text-arctic">Productos</h1>
          <p className="mt-1 font-body text-body-sm text-steel-300">
            {total} producto{total !== 1 ? 's' : ''} en el catalogo
          </p>
        </div>
        <Link href="/admin/productos/nuevo" className="btn-primary">
          <Plus className="h-4 w-4" />
          Nuevo producto
        </Link>
      </div>

      {/* Search + filters bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <button onClick={fetchProducts} className="btn-secondary">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card animate-pulse p-4">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded bg-steel-900" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-steel-900" />
                  <div className="h-3 w-32 rounded bg-steel-900" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-steel-700" />
          <h3 className="mt-4 font-display text-h3 text-arctic">No hay productos</h3>
          <p className="mt-2 font-body text-body-sm text-steel-500">
            {search
              ? 'No se encontraron productos con esa busqueda.'
              : 'Comienza agregando tu primer producto al catalogo.'}
          </p>
          {!search && (
            <Link href="/admin/productos/nuevo" className="btn-primary mt-6 inline-flex">
              <Plus className="h-4 w-4" />
              Agregar primer producto
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-steel-900/40">
          <table className="w-full">
            <thead>
              <tr className="border-b border-steel-900/40 bg-carbon-light">
                <th className="px-4 py-3 text-left font-body text-caption uppercase tracking-[0.06em] text-steel-500">
                  Producto
                </th>
                <th className="px-4 py-3 text-left font-body text-caption uppercase tracking-[0.06em] text-steel-500">
                  SKU
                </th>
                <th className="px-4 py-3 text-left font-body text-caption uppercase tracking-[0.06em] text-steel-500">
                  Categoria
                </th>
                <th className="px-4 py-3 text-right font-body text-caption uppercase tracking-[0.06em] text-steel-500">
                  Precio
                </th>
                <th className="px-4 py-3 text-center font-body text-caption uppercase tracking-[0.06em] text-steel-500">
                  Stock
                </th>
                <th className="px-4 py-3 text-center font-body text-caption uppercase tracking-[0.06em] text-steel-500">
                  Estado
                </th>
                <th className="px-4 py-3 text-right font-body text-caption uppercase tracking-[0.06em] text-steel-500">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-900/20">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="group transition-colors hover:bg-steel-900/20"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-steel-900 text-steel-500">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-body text-body-sm font-medium text-arctic">
                          {p.name}
                        </p>
                        <p className="font-body text-caption text-steel-500">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-caption text-steel-300">{p.sku}</td>
                  <td className="px-4 py-3">
                    <span className="badge-blue">{p.category}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-body-sm text-arctic">
                    {formatGs(p.price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.stock === 0 ? (
                      <span className="badge-red inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Sin stock
                      </span>
                    ) : p.stock < 5 ? (
                      <span className="badge-yellow">{p.stock} uds</span>
                    ) : (
                      <span className="badge-green">{p.stock} uds</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.isActive ? (
                      <span className="badge-green">Activo</span>
                    ) : (
                      <span className="badge-red">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleFeatured(p.id, p.isFeatured)}
                        className={`rounded p-1.5 transition-colors ${
                          p.isFeatured
                            ? 'text-yellow-bright hover:bg-yellow-muted'
                            : 'text-steel-700 hover:bg-steel-900 hover:text-steel-300'
                        }`}
                        title={p.isFeatured ? 'Quitar destacado' : 'Marcar como destacado'}
                      >
                        <Star className="h-4 w-4" fill={p.isFeatured ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => toggleActive(p.id, p.isActive)}
                        className="rounded p-1.5 text-steel-500 transition-colors hover:bg-steel-900 hover:text-arctic"
                        title={p.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {p.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <Link
                        href={`/admin/productos/${p.id}`}
                        className="rounded p-1.5 text-steel-500 transition-colors hover:bg-blue-muted hover:text-blue-bright"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        disabled={deleting === p.id}
                        className="rounded p-1.5 text-steel-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
