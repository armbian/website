import type { CollectionConfig } from 'payload';
import { isAdmin, adminOrSelf, adminOnlyField } from '../access';
import { oidcStrategy, isOidcEnabled } from '../auth/oidc-strategy';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    strategies: isOidcEnabled ? [oidcStrategy] : [],
  },
  admin: { useAsTitle: 'email' },
  access: {
    create: isAdmin,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      access: { update: adminOnlyField },
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Board Maintainer', value: 'maintainer' },
      ],
    },
    {
      name: 'assignedBoards',
      type: 'array',
      access: { update: adminOnlyField },
      admin: {
        description: 'Board slugs this maintainer can edit flash guides for',
        condition: (data: Record<string, unknown> | undefined) => data?.role === 'maintainer',
      },
      fields: [{ name: 'boardSlug', type: 'text', required: true }],
    },
    {
      name: 'oidcSub',
      type: 'text',
      access: { update: adminOnlyField },
      admin: {
        description: 'OIDC subject identifier (auto-populated)',
        readOnly: true,
        condition: () => isOidcEnabled,
      },
      index: true,
    },
  ],
};
