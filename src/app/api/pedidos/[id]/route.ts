import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrder, deleteOrder } from '@/lib/orders-store';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = getOrderById(params.id);
    if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const order = updateOrder(params.id, body);
    if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ok = deleteOrder(params.id);
    if (!ok) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
