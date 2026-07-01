import { NextRequest, NextResponse } from 'next/server';
import { getPresupuestoById, updatePresupuesto, addNoteToPresupuesto, deletePresupuesto } from '@/lib/presupuestos-store';

export async function GET(_r: NextRequest, { params }: { params: { id: string } }) {
  try { const p = getPresupuestoById(params.id); return p ? NextResponse.json(p) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (body._addNote) { const p = addNoteToPresupuesto(params.id, body._addNote); return p ? NextResponse.json(p) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
    const p = updatePresupuesto(params.id, body);
    return p ? NextResponse.json(p) : NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function DELETE(_r: NextRequest, { params }: { params: { id: string } }) {
  try { return deletePresupuesto(params.id) ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
