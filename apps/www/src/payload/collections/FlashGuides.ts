import type { CollectionConfig, Access } from 'payload';
import { isAdminOrEditor } from '../access';

type UserWithBoards = { role?: string; assignedBoards?: { boardSlug: string }[] };

const canManageFlashGuide: Access = ({ req: { user } }) => {
  if (!user) return false;
  const u = user as UserWithBoards;
  if (u.role === 'admin' || u.role === 'editor') return true;
  if (u.role === 'maintainer' && u.assignedBoards?.length) {
    return { boardSlug: { in: u.assignedBoards.map((b) => b.boardSlug) } };
  }
  return false;
};

export const FlashGuides: CollectionConfig = {
  slug: 'flash-guides',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'boardSlug', 'updatedAt'],
    group: 'Content',
  },
  access: {
    create: canManageFlashGuide,
    read: () => true,
    update: canManageFlashGuide,
    delete: isAdminOrEditor,
  },
  fields: [
    {
      name: 'boardSlug',
      type: 'text',
      required: true,
      index: true,
      unique: true,
      admin: {
        description: 'Select a board from the Armbian catalog',
        components: {
          Field: '@/payload/components/BoardSlugSelect#BoardSlugSelect',
        },
      },
    },
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'content', type: 'richText', required: true, localized: true },
    {
      name: 'prerequisites',
      type: 'array',
      localized: true,
      admin: { description: 'Items needed (e.g. "microSD card (16 GB+)")' },
      fields: [{ name: 'item', type: 'text', required: true }],
    },
  ],
};
