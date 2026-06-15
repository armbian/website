import type { CollectionConfig } from 'payload';
import { isAdminOrEditor, publishedOrAuthed, hiddenForMaintainer } from '../access';

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    group: 'Content',
    hidden: hiddenForMaintainer,
  },
  access: {
    create: isAdminOrEditor,
    read: publishedOrAuthed,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL path (e.g. privacy, terms)' },
    },
    { name: 'content', type: 'richText', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    },
    { name: 'metaTitle', type: 'text', admin: { description: 'SEO title override' } },
    { name: 'metaDescription', type: 'textarea', admin: { description: 'SEO description' } },
  ],
};
