import { NextResponse } from 'next/server';
import { getPresupuestoStats } from '@/lib/presupuestos-store';

export async function GET() {
  try { return NextResponse.json(getPresupuestoStats()); }
  catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
