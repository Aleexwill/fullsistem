import { NextResponse } from 'next/server';
import { getProductStats } from '@/lib/products-store';

export async function GET() {
  try {
    const stats = getProductStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener estadisticas' }, { status: 500 });
  }
}
