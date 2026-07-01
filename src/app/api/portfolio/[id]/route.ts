import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, updateProject, deleteProject } from '@/lib/portfolio-store';

export async function GET(_r: NextRequest, { params }: { params: { id: string } }) {
  try { const p = getProjectById(params.id); return p ? NextResponse.json(p) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try { const body = await req.json(); const p = updateProject(params.id, body); return p ? NextResponse.json(p) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
export async function DELETE(_r: NextRequest, { params }: { params: { id: string } }) {
  try { return deleteProject(params.id) ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'No encontrado' }, { status: 404 }); }
  catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
