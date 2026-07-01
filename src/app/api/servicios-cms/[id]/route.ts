import { NextRequest, NextResponse } from 'next/server';
import { getServiceById, updateService, deleteService } from '@/lib/services-store';

export async function GET(_r: NextRequest, { params }: { params: { id: string } }) {
  try { const s = getServiceById(params.id); return s ? NextResponse.json(s) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try { const body = await req.json(); const s = updateService(params.id, body); return s ? NextResponse.json(s) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
export async function DELETE(_r: NextRequest, { params }: { params: { id: string } }) {
  try { return deleteService(params.id) ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
