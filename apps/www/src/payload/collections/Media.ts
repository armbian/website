import type { CollectionConfig } from 'payload';
import { isAdminOrEditor, authenticated } from '../access';

export const Media: CollectionConfig = {
  slug: 'media',
  upload: { mimeTypes: ['image/png', 'image/jpeg', 'image/webp'] },
  admin: { useAsTitle: 'filename' },
  access: {
    create: authenticated,
    read: () => true,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [{ name: 'alt', type: 'text', required: true }],
};
