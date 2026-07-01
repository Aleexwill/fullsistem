import { NextRequest, NextResponse } from 'next/server';
import { getLeadById, updateLead, addNoteToLead, addActivityToLead, addTaskToLead, toggleTask, deleteLead } from '@/lib/leads-store';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lead = getLeadById(params.id);
    if (!lead) return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    return NextResponse.json(lead);
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    if (body._addNote) {
      const lead = addNoteToLead(params.id, body._addNote);
      if (!lead) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      return NextResponse.json(lead);
    }

    if (body._addActivity) {
      const lead = addActivityToLead(params.id, body._addActivity.type, body._addActivity.text, body._addActivity.metadata);
      if (!lead) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      return NextResponse.json(lead);
    }

    if (body._addTask) {
      const lead = addTaskToLead(params.id, body._addTask.text, body._addTask.dueDate || '');
      if (!lead) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      return NextResponse.json(lead);
    }

    if (body._toggleTask) {
      const lead = toggleTask(params.id, body._toggleTask);
      if (!lead) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      return NextResponse.json(lead);
    }

    const lead = updateLead(params.id, body);
    if (!lead) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(lead);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ok = deleteLead(params.id);
    if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
