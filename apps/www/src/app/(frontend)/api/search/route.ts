import { NextResponse } from 'next/server';
import { getApiClient } from '@/lib/api.server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';

  if (q.length < 2) {
    return NextResponse.json({ data: [] });
  }

  try {
    const api = getApiClient();
    const result = await api.search(q);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
