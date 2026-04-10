import { NextResponse } from 'next/server';
import { getApiClient } from '@/lib/api.server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const params: Record<string, string | number> = {};
  const vendor = searchParams.get('vendor');
  const support = searchParams.get('support');
  const sort = searchParams.get('sort');
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');

  if (vendor) params.vendor = vendor;
  if (support) params.support = support;
  if (sort) params.sort = sort as string;
  if (page) params.page = parseInt(page, 10) || 1;
  if (limit) params.limit = parseInt(limit, 10) || 24;

  try {
    const api = getApiClient();
    const result = await api.getBoards(params as Parameters<typeof api.getBoards>[0]);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ data: [], meta: { total: 0 } }, { status: 500 });
  }
}
