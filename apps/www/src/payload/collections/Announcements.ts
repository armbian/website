import type { CollectionConfig } from 'payload';
import { isAdminOrEditor, hiddenForMaintainer } from '../access';

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'active', 'publishDate'],
    group: 'Content',
    hidden: hiddenForMaintainer,
  },
  access: {
    create: isAdminOrEditor,
    read: () => true,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'richText', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'info',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Warning', value: 'warning' },
        { label: 'Release', value: 'release' },
        { label: 'Event', value: 'event' },
      ],
    },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'pinned', type: 'checkbox', defaultValue: false },
    {
      name: 'publishDate',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: { description: 'Auto-hides after this date', date: { pickerAppearance: 'dayOnly' } },
    },
    { name: 'link', type: 'text', admin: { description: 'Optional URL for Read More' } },
  ],
};
