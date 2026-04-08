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

export const oidcStrategy: AuthStrategy = {
  name: 'oidc',
  authenticate: async ({ payload, headers }) => {
    const token = headers.get('x-oidc-token');
    if (!token) return { user: null };

    try {
      const userinfoUrl = `${OIDC_ISSUER_URL}/protocol/openid-connect/userinfo`;
      const res = await fetch(userinfoUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { user: null };

      const userinfo = (await res.json()) as {
        sub: string;
        email?: string;
        preferred_username?: string;
        name?: string;
        groups?: string[];
      };

      const sub = userinfo.sub;
      const email = userinfo.email ?? userinfo.preferred_username ?? '';
      if (!sub || !email) return { user: null };

      const groups = userinfo.groups ?? [];
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
        // Sync role from Authentik groups on every login
        if (existing.docs[0].role !== role) updates.role = role;

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
          name: userinfo.name ?? email,
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
