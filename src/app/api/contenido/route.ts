import { NextRequest, NextResponse } from 'next/server';
import { getContent, updateContent } from '@/lib/content-store';

export async function GET() {
  try { return NextResponse.json(getContent()); }
  catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  try { const body = await req.json(); return NextResponse.json(updateContent(body)); }
  catch { return NextResponse.json({ error: 'Error al guardar' }, { status: 500 }); }
}
