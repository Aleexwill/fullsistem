import { NextResponse } from 'next/server';
import { getOrderStats } from '@/lib/orders-store';

export async function GET() {
  try {
    return NextResponse.json(getOrderStats());
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
