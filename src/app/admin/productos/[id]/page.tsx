'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ProductForm from '@/components/admin/product-form';

export default function EditarProductoPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/productos/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Producto no encontrado');
        return r.json();
      })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-bright" />
          <p className="mt-3 font-body text-body-sm text-steel-300">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6 lg:p-8">
        <Link
          href="/admin/productos"
          className="mb-3 inline-flex items-center gap-1.5 font-body text-caption text-steel-500 transition-colors hover:text-arctic"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a productos
        </Link>
        <div className="card mt-6 p-12 text-center">
          <h2 className="font-display text-h2 text-arctic">Producto no encontrado</h2>
          <p className="mt-2 font-body text-body-sm text-steel-500">
            {error || 'El producto que buscas no existe o fue eliminado.'}
          </p>
        </div>
      </div>
    );
  }

  const initialData = {
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    category: product.category,
    brand: product.brand,
    price: product.price.toString(),
    compareAtPrice: product.compareAtPrice ? product.compareAtPrice.toString() : '',
    stock: product.stock.toString(),
    images: product.images || [],
    specifications: product.specifications || {},
    tags: product.tags || [],
    isFeatured: product.isFeatured,
    isActive: product.isActive,
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/productos"
          className="mb-3 inline-flex items-center gap-1.5 font-body text-caption text-steel-500 transition-colors hover:text-arctic"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a productos
        </Link>
        <h1 className="font-display text-h1 uppercase text-arctic">Editar producto</h1>
        <p className="mt-1 font-body text-body-sm text-steel-300">
          Modificando: <span className="font-medium text-arctic">{product.name}</span>
          <span className="ml-2 font-mono text-caption text-steel-500">({product.sku})</span>
        </p>
      </div>

      <ProductForm mode="edit" initialData={initialData} productId={id} />
    </div>
  );
}
