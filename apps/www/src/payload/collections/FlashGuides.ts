import type { CollectionConfig, Access, CollectionBeforeValidateHook } from 'payload';
import { APIError } from 'payload';
import { isAdminOrEditor, adminOrEditorField } from '../access';

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

// Public/admin/editor read every guide; maintainers see only their boards.
const canReadFlashGuide: Access = ({ req: { user } }) => {
  const u = user as UserWithBoards | undefined;
  if (u?.role === 'maintainer') {
    const boards = u.assignedBoards?.map((b) => b.boardSlug) ?? [];
    return boards.length ? { boardSlug: { in: boards } } : false;
  }
  return true;
};

// The access where-clause scopes which docs a maintainer touches, not the boardSlug
// value, so enforce the value on create and update.
const enforceMaintainerBoardScope: CollectionBeforeValidateHook = ({ data, req: { user } }) => {
  const u = user as UserWithBoards | undefined;
  if (!u || u.role === 'admin' || u.role === 'editor') return data;
  if (u.role === 'maintainer' && data?.boardSlug) {
    const allowed = u.assignedBoards?.map((b) => b.boardSlug) ?? [];
    if (!allowed.includes(data.boardSlug)) {
      throw new APIError('You can only manage flash guides for your assigned boards.', 403);
    }
  }
  return data;
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
    read: canReadFlashGuide,
    update: canManageFlashGuide,
    delete: isAdminOrEditor,
  },
  hooks: {
    beforeValidate: [enforceMaintainerBoardScope],
  },
  fields: [
    {
      name: 'boardSlug',
      type: 'text',
      required: true,
      index: true,
      unique: true,
      // Maintainers must not reassign an existing guide to another board.
      access: { update: adminOrEditorField },
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
