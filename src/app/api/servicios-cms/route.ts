import { NextRequest, NextResponse } from 'next/server';
import { getAllServices, createService } from '@/lib/services-store';

export async function GET(req: NextRequest) {
  try {
    let services = getAllServices();
    const { searchParams } = new URL(req.url);
    if (searchParams.get('active') === 'true') services = services.filter((s) => s.isActive);
    const cat = searchParams.get('category');
    if (cat) services = services.filter((s) => s.category === cat);
    services.sort((a, b) => a.order - b.order);
    return NextResponse.json({ services, total: services.length });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title) return NextResponse.json({ error: 'Titulo obligatorio' }, { status: 400 });
    const svc = createService({
      title: body.title, description: body.description || '', category: body.category || 'mantenimiento',
      icon: body.icon || 'Wrench', features: body.features || [], image: body.image || '',
      isActive: body.isActive !== false, isFeatured: Boolean(body.isFeatured), order: body.order || 0,
    });
    return NextResponse.json(svc, { status: 201 });
  } catch { return NextResponse.json({ error: 'Error al crear' }, { status: 500 }); }
}
