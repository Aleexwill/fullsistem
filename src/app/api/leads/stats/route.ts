import { NextResponse } from 'next/server';
import { getLeadStats } from '@/lib/leads-store';

export async function GET() {
  try {
    return NextResponse.json(getLeadStats());
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
