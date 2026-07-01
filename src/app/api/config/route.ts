import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/settings-store';

export async function GET() {
  try {
    return NextResponse.json(getSettings());
  } catch {
    return NextResponse.json({ error: 'Error al obtener configuracion' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = updateSettings(body);
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: 'Error al guardar configuracion' }, { status: 500 });
  }
}
