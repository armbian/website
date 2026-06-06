import type { CollectionConfig } from 'payload';
import { isAdminOrEditor, publishedOrAuthed } from '../access';

export const Changelogs: CollectionConfig = {
  slug: 'changelogs',
  admin: {
    useAsTitle: 'version',
    defaultColumns: ['version', 'releaseDate', 'major', 'status'],
    group: 'Content',
  },
  access: {
    create: isAdminOrEditor,
    read: publishedOrAuthed,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'version',
          type: 'text',
          required: true,
          admin: { width: '50%', description: 'e.g. "25.05 Quail"' },
        },
        {
          name: 'releaseDate',
          type: 'date',
          required: true,
          admin: { width: '25%', date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'draft',
          admin: { width: '25%' },
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
        },
      ],
    },
    {
      name: 'summary',
      type: 'text',
      required: true,
      admin: { description: 'One-line summary for the listing page' },
    },
    { name: 'content', type: 'richText', required: true },
    {
      name: 'major',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Highlight as a major release' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'downloadUrl',
          type: 'text',
          admin: { width: '50%', description: 'Link to release downloads' },
        },
        {
          name: 'githubUrl',
          type: 'text',
          admin: { width: '50%', description: 'Link to GitHub release page' },
        },
      ],
    },
  ],
};
