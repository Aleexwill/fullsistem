import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, createOrder } from '@/lib/orders-store';

export async function GET(request: NextRequest) {
  try {
    const orders = getAllOrders();
    const { searchParams } = new URL(request.url);
    let filtered = [...orders];

    const search = searchParams.get('search');
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q)
      );
    }

    const status = searchParams.get('status');
    if (status) filtered = filtered.filter((o) => o.status === status);

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ orders: filtered, total: filtered.length });
  } catch {
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.customer?.name) {
      return NextResponse.json({ error: 'Nombre del cliente es obligatorio' }, { status: 400 });
    }

    const items = (body.items || []).map((item: any) => ({
      productId: item.productId || '',
      productName: item.productName || '',
      sku: item.sku || '',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
    }));

    const subtotal = items.reduce((s: number, i: any) => s + i.total, 0);

    const order = createOrder({
      status: body.status || 'pending',
      paymentStatus: body.paymentStatus || 'pending',
      customer: {
        name: body.customer.name,
        email: body.customer.email || '',
        phone: body.customer.phone || '',
        address: body.customer.address || '',
        city: body.customer.city || '',
        notes: body.customer.notes || '',
      },
      items,
      subtotal,
      shipping: Number(body.shipping) || 0,
      discount: Number(body.discount) || 0,
      total: subtotal + (Number(body.shipping) || 0) - (Number(body.discount) || 0),
      paymentMethod: body.paymentMethod || 'pending',
      adminNotes: body.adminNotes || '',
    });

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear pedido' }, { status: 500 });
  }
}
