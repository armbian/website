import type { GlobalConfig } from 'payload';
import { isAdminOrEditor } from '../access';

export const CompanyConfig: GlobalConfig = {
  slug: 'company-config',
  admin: {
    group: 'Settings',
  },
  access: {
    read: () => true,
    update: isAdminOrEditor,
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'companyName', type: 'text', defaultValue: 'Armbian d.o.o.', admin: { width: '50%' } },
        { name: 'email', type: 'text', defaultValue: 'info@armbian.com', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'street', type: 'text', defaultValue: 'Reboljeva ulica 5', admin: { width: '50%' } },
        { name: 'city', type: 'text', defaultValue: '1000 Ljubljana', admin: { width: '25%' } },
        { name: 'country', type: 'text', defaultValue: 'Slovenia', admin: { width: '25%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'vatId', type: 'text', defaultValue: 'SI38201194', admin: { width: '33%' } },
        { name: 'iban', type: 'text', defaultValue: 'SI56 0400 0028 2106 011', admin: { width: '33%' } },
        { name: 'swift', type: 'text', defaultValue: 'KBMASI2X', admin: { width: '33%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'officeHoursDay', type: 'text', defaultValue: 'Every Wednesday', admin: { width: '33%' } },
        { name: 'calendlyOfficeHours', type: 'text', admin: { width: '33%', description: 'Calendly URL for community office hours' } },
        { name: 'calendlyConsultation', type: 'text', admin: { width: '33%', description: 'Calendly URL for paid consultation' } },
      ],
    },
  ],
};
