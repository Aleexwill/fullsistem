import { NextRequest, NextResponse } from 'next/server';
import { trackPageView, getAnalytics } from '@/lib/analytics-store';

export async function GET() {
  try { return NextResponse.json(getAnalytics()); }
  catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    trackPageView(body.path || '/', body.referrer || '', body.userAgent || '');
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Error' }, { status: 500 }); }
}
