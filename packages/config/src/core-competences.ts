/**
 * Options posted verbatim to the Zoho Bigin `CONTACTCF2` field on the
 * /update-data form. The strings are the Zoho-side values and must match
 * what the upstream form expects; user-visible labels live in each
 * locale's `update_data.competences.*` i18n key.
 */
export const CORE_COMPETENCES = [
  'Kernel development',
  'OS and desktop development',
  'Forum moderating',
  'Project management',
  'Devops and servers',
  'Professional support',
  'Fundraising',
  'CI & automated testing',
  'Human resources',
  'Business development',
] as const;

type CoreCompetence = (typeof CORE_COMPETENCES)[number];

/** Stable i18n key for each competence, matching `update_data.competences.<key>`. */
export const CORE_COMPETENCE_I18N_KEYS: Record<CoreCompetence, string> = {
  'Kernel development': 'kernel',
  'OS and desktop development': 'os',
  'Forum moderating': 'forum',
  'Project management': 'pm',
  'Devops and servers': 'devops',
  'Professional support': 'support',
  Fundraising: 'fundraising',
  'CI & automated testing': 'ci',
  'Human resources': 'hr',
  'Business development': 'bizdev',
};
