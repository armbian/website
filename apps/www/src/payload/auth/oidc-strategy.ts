import { createRemoteJWKSet, jwtVerify } from 'jose';

type AuthStrategy = {
  name: string;
  authenticate: (args: {
    payload: any;
    headers: Headers;
  }) => Promise<{ user: any; responseHeaders?: Headers }>;
};

const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID ?? '';
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET ?? '';
const OIDC_ISSUER_URL = process.env.OIDC_ISSUER_URL ?? '';
const JWKS_URL = OIDC_ISSUER_URL
  ? new URL(`${OIDC_ISSUER_URL}/protocol/openid-connect/certs`)
  : null;
const JWKS = JWKS_URL ? createRemoteJWKSet(JWKS_URL) : null;
const OIDC_ALLOWED_DOMAINS = (process.env.OIDC_ALLOWED_DOMAINS ?? '').split(',').filter(Boolean);

/**
 * Authentik group → Payload role mapping.
 * Configure these groups in Authentik and assign users to them.
 * First match wins — order from most privileged to least.
 */
const GROUP_ROLE_MAP: Array<{ group: string; role: string }> = [
  { group: 'armbian-admin', role: 'admin' },
  { group: 'armbian-maintainer', role: 'maintainer' },
  { group: 'armbian-editor', role: 'editor' },
];
const DEFAULT_ROLE = 'editor';

/** Resolve Payload role from Authentik groups */
function resolveRole(groups: string[]): string {
  for (const { group, role } of GROUP_ROLE_MAP) {
    if (groups.includes(group)) return role;
  }
  return DEFAULT_ROLE;
}

export const isOidcEnabled = Boolean(OIDC_CLIENT_ID && OIDC_CLIENT_SECRET && OIDC_ISSUER_URL);

if (isOidcEnabled && OIDC_ALLOWED_DOMAINS.length === 0) {
  console.warn(
    '[oidc] OIDC_ALLOWED_DOMAINS is not set — any authenticated OIDC user can be auto-created. ' +
      'Set OIDC_ALLOWED_DOMAINS to restrict sign-ups to specific email domains.',
  );
}

/** Verify JWT signature and extract claims, or fall back to userinfo endpoint for opaque tokens */
async function resolveTokenClaims(token: string): Promise<{
  sub: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  groups?: string[];
} | null> {
  // Try JWT verification first (signed tokens from Authentik)
  if (JWKS && token.split('.').length === 3) {
    try {
      const { payload: claims } = await jwtVerify(token, JWKS, {
        issuer: OIDC_ISSUER_URL,
        audience: OIDC_CLIENT_ID,
      });
      if (typeof claims.sub !== 'string' || claims.sub.length === 0) return null;
      return {
        sub: claims.sub,
        email: claims.email as string | undefined,
        preferred_username: claims.preferred_username as string | undefined,
        name: claims.name as string | undefined,
        groups: Array.isArray(claims.groups) ? (claims.groups as string[]) : [],
      };
    } catch {
      // JWT verification failed — do not fall back, reject the token
      return null;
    }
  }

  // Opaque token — validate via userinfo endpoint
  const userinfoUrl = `${OIDC_ISSUER_URL}/protocol/openid-connect/userinfo`;
  const res = await fetch(userinfoUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;

  const userinfo = (await res.json()) as {
    sub: string;
    email?: string;
    preferred_username?: string;
    name?: string;
    groups?: string[];
  };

  if (
    typeof userinfo !== 'object' ||
    userinfo === null ||
    typeof userinfo.sub !== 'string' ||
    userinfo.sub.length === 0
  ) {
    return null;
  }
  return userinfo;
}

export const oidcStrategy: AuthStrategy = {
  name: 'oidc',
  authenticate: async ({ payload, headers }) => {
    const token = headers.get('x-oidc-token');
    if (!token) return { user: null };

    if (token.length < 20 || token.length > 4096) return { user: null };

    try {
      const claims = await resolveTokenClaims(token);
      if (!claims) return { user: null };

      const sub = claims.sub;
      // Link only by a real email claim; preferred_username could hijack an account.
      const email = typeof claims.email === 'string' ? claims.email : '';
      if (!sub || !email) return { user: null };

      const groups = claims.groups ?? [];
      const role = resolveRole(groups);

      // Look up by OIDC subject ID first, then by email
      let existing = await payload.find({
        collection: 'users',
        where: { oidcSub: { equals: sub } },
        limit: 1,
      });

      if (!existing.docs[0]) {
        existing = await payload.find({
          collection: 'users',
          where: { email: { equals: email } },
          limit: 1,
        });
      }

      if (existing.docs[0]) {
        const updates: Record<string, any> = {};
        // Link OIDC sub if not set yet
        if (!existing.docs[0].oidcSub) updates.oidcSub = sub;
        // Sync role from groups, but never auto-demote the last admin (lockout guard).
        if (existing.docs[0].role !== role) {
          const demotingAdmin = existing.docs[0].role === 'admin' && role !== 'admin';
          if (demotingAdmin) {
            const admins = await payload.count({
              collection: 'users',
              where: { role: { equals: 'admin' } },
            });
            if ((admins.totalDocs ?? 0) > 1) updates.role = role;
          } else {
            updates.role = role;
          }
        }

        if (Object.keys(updates).length > 0) {
          await payload.update({
            collection: 'users',
            id: existing.docs[0].id,
            data: updates,
          });
          existing.docs[0] = { ...existing.docs[0], ...updates };
        }
        return { user: { collection: 'users', ...existing.docs[0] } };
      }

      // Auto-create user on first OIDC login (restricted by domain if configured)
      if (OIDC_ALLOWED_DOMAINS.length > 0) {
        const domain = email.split('@')[1];
        if (!domain || !OIDC_ALLOWED_DOMAINS.includes(domain)) {
          return { user: null };
        }
      }

      const newUser = await payload.create({
        collection: 'users',
        data: {
          email,
          name: claims.name ?? email,
          password: crypto.randomUUID(),
          role,
          oidcSub: sub,
        },
      });

      return { user: { collection: 'users', ...newUser } };
    } catch {
      return { user: null };
    }
  },
};
