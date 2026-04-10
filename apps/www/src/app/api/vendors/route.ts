import { NextResponse } from 'next/server';
import { getApiClient } from '@/lib/api.server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const api = await getApiClient();
    const result = await api.getVendors();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}
