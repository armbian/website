import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './src/i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Wraps the next-intl middleware to fix cross-domain redirect URLs.
 *
 * next-intl constructs redirect Location headers using `req.nextUrl`
 * which carries the internal container port (3000). Behind a reverse
 * proxy (Caddy on 443) the port leaks into the redirect URL, producing
 * `https://armbian.de:3000/de` instead of `https://armbian.de/de`.
 *
 * The wrapper strips non-standard ports from any redirect Location so
 * the browser always sees clean HTTPS URLs.
 */
export default function middleware(req: NextRequest) {
  const response = intlMiddleware(req);

  const location = response.headers.get('location');
  if (location) {
    // Strip explicit ports from https URLs (443 is implicit).
    const fixed = location.replace(/^(https:\/\/[^/]+):(\d+)/, (match, host, port) => {
      return port === '443' || port === '3000' ? host : match;
    });
    if (fixed !== location) {
      return NextResponse.redirect(new URL(fixed), response.status as 301 | 302 | 307 | 308);
    }
  }

  return response;
}

export const config = {
  matcher: '/((?!api|admin|_next|_vercel|.*\\..*).*)',
};
