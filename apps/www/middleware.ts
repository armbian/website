import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { ARMBIAN_URLS } from '@armbian/config';
import { routing } from './src/i18n/routing';

const intlMiddleware = createMiddleware(routing);

const IMAGER_HOST = new URL(ARMBIAN_URLS.IMAGER).hostname;

export default function middleware(req: NextRequest) {
  const host = req.headers.get('host')?.split(':')[0]?.toLowerCase();

  // Must run before intlMiddleware: it would rewrite `/` to `/en`.
  if (host === IMAGER_HOST && req.nextUrl.pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/imager';
    return NextResponse.rewrite(url);
  }

  const response = intlMiddleware(req);

  // Strip leaked container port from next-intl redirects (`req.nextUrl`
  // carries :3000, which surfaces in Location behind Caddy).
  const location = response.headers.get('location');
  if (location) {
    const fixed = location.replace(/^(https:\/\/[^/]+):(\d+)/, (match, hostname, port) => {
      return port === '443' || port === '3000' ? hostname : match;
    });
    if (fixed !== location) {
      return NextResponse.redirect(new URL(fixed), response.status as 301 | 302 | 307 | 308);
    }
  }

  return response;
}

export const config = {
  matcher: '/((?!api|admin|imager|_next|_vercel|.*\\..*).*)',
};
