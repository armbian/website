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
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'boardSlug', 'locale', 'updatedAt'], group: 'Content' },
  access: { create: canManageFlashGuide, read: () => true, update: canManageFlashGuide, delete: isAdminOrEditor },
  fields: [
    {
      name: 'boardSlug',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Select a board from the Armbian catalog',
        components: {
          Field: '@/payload/components/BoardSlugSelect#BoardSlugSelect',
        },
      },
    },
    {
      name: 'locale', type: 'select', required: true, defaultValue: 'en',
      options: [
        { label: 'English', value: 'en' }, { label: 'Italian', value: 'it' }, { label: 'German', value: 'de' },
        { label: 'French', value: 'fr' }, { label: 'Spanish', value: 'es' }, { label: 'Chinese', value: 'zh' },
        { label: 'Portuguese', value: 'pt' }, { label: 'Russian', value: 'ru' }, { label: 'Japanese', value: 'ja' },
        { label: 'Korean', value: 'ko' }, { label: 'Polish', value: 'pl' }, { label: 'Dutch', value: 'nl' },
        { label: 'Turkish', value: 'tr' }, { label: 'Ukrainian', value: 'uk' }, { label: 'Croatian', value: 'hr' },
        { label: 'Slovenian', value: 'sl' }, { label: 'Swedish', value: 'sv' },
      ],
    },
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'richText', required: true },
    { name: 'prerequisites', type: 'array', admin: { description: 'Items needed (e.g. "microSD card (16 GB+)")' }, fields: [{ name: 'item', type: 'text', required: true }] },
  ],
};
