import { NextRequest, NextResponse } from 'next/server';
import { getAllLeads, createLead } from '@/lib/leads-store';

export async function GET(request: NextRequest) {
  try {
    const leads = getAllLeads();
    const { searchParams } = new URL(request.url);
    let filtered = [...leads];

    const search = searchParams.get('search');
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.customer.name.toLowerCase().includes(q) ||
          l.customer.email.toLowerCase().includes(q) ||
          l.subject.toLowerCase().includes(q)
      );
    }

    const status = searchParams.get('status');
    if (status) filtered = filtered.filter((l) => l.status === status);

    const priority = searchParams.get('priority');
    if (priority) filtered = filtered.filter((l) => l.priority === priority);

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ leads: filtered, total: filtered.length });
  } catch {
    return NextResponse.json({ error: 'Error al obtener leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.customer?.name || !body.subject) {
      return NextResponse.json({ error: 'Nombre y asunto son obligatorios' }, { status: 400 });
    }

    const lead = createLead({
      status: body.status || 'new',
      priority: body.priority || 'medium',
      source: body.source || 'contact_form',
      customer: {
        name: body.customer.name,
        email: body.customer.email || '',
        phone: body.customer.phone || '',
      },
      subject: body.subject,
      message: body.message || '',
      serviceInterest: body.serviceInterest || '',
      estimatedValue: body.estimatedValue ? Number(body.estimatedValue) : null,
      notes: [],
      assignedTo: body.assignedTo || '',
    });

    return NextResponse.json(lead, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear lead' }, { status: 500 });
  }
}
