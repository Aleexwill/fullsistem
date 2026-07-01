import { NextRequest, NextResponse } from 'next/server';
import { getAllPresupuestos, createPresupuesto } from '@/lib/presupuestos-store';

export async function GET(req: NextRequest) {
  try {
    let data = getAllPresupuestos();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    if (search) { const q = search.toLowerCase(); data = data.filter((p) => p.customer.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.serviceTitle.toLowerCase().includes(q)); }
    const status = searchParams.get('status');
    if (status) data = data.filter((p) => p.status === status);
    const type = searchParams.get('type');
    if (type) data = data.filter((p) => p.serviceType === type);
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ presupuestos: data, total: data.length });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.customer?.name || !body.serviceTitle) return NextResponse.json({ error: 'Nombre y servicio obligatorios' }, { status: 400 });
    const p = createPresupuesto({
      status: body.status || 'nuevo', serviceType: body.serviceType || 'otro', serviceTitle: body.serviceTitle,
      customer: { name: body.customer.name, email: body.customer.email || '', phone: body.customer.phone || '', company: body.customer.company || '', address: body.customer.address || '' },
      description: body.description || '', details: body.details || '',
      estimatedValue: body.estimatedValue ? Number(body.estimatedValue) : null, finalValue: body.finalValue ? Number(body.finalValue) : null,
      estimatedDuration: body.estimatedDuration || '', priority: body.priority || 'media', source: body.source || 'admin',
      notes: [], attachments: body.attachments || [], assignedTo: body.assignedTo || '', scheduledDate: body.scheduledDate || '',
    });
    return NextResponse.json(p, { status: 201 });
  } catch { return NextResponse.json({ error: 'Error al crear' }, { status: 500 }); }
}
