import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, createProduct } from '@/lib/products-store';

// GET /api/productos
export async function GET(request: NextRequest) {
  try {
    const products = getAllProducts();
    const { searchParams } = new URL(request.url);

    let filtered = [...products];

    // Filter by search
    const search = searchParams.get('search');
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }

    // Filter by category
    const category = searchParams.get('category');
    if (category) {
      filtered = filtered.filter((p) => p.category === category);
    }

    // Filter by active
    const active = searchParams.get('active');
    if (active === 'true') {
      filtered = filtered.filter((p) => p.isActive);
    }

    // Filter by featured
    const featured = searchParams.get('featured');
    if (featured === 'true') {
      filtered = filtered.filter((p) => p.isFeatured);
    }

    // Sort
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';
    filtered.sort((a, b) => {
      const aVal = (a as any)[sort];
      const bVal = (b as any)[sort];
      if (typeof aVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return order === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return NextResponse.json({ products: filtered, total: filtered.length });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

// POST /api/productos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validacion basica
    if (!body.name || !body.sku || !body.price) {
      return NextResponse.json(
        { error: 'Nombre, SKU y precio son obligatorios' },
        { status: 400 }
      );
    }

    const product = createProduct({
      sku: body.sku,
      name: body.name,
      slug: body.slug || '',
      description: body.description || '',
      shortDescription: body.shortDescription || '',
      category: body.category || 'general',
      brand: body.brand || '',
      price: Number(body.price),
      compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
      stock: Number(body.stock) || 0,
      images: body.images || [],
      specifications: body.specifications || {},
      tags: body.tags || [],
      isFeatured: Boolean(body.isFeatured),
      isActive: body.isActive !== false,
      rating: 0,
      reviewCount: 0,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}
