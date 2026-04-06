import { z } from 'zod';

/** Core competence areas */
export const CompetenceEnum = z.enum([
  'Kernel development',
  'OS and desktop development',
  'Devops and servers',
  'CI & automated testing',
  'Documentation',
  'Community management',
]);
export type Competence = z.infer<typeof CompetenceEnum>;

/** Maintainer / team member */
export const MaintainerSchema = z.object({
  name: z.string(),
  avatar: z.string().url(),
  github: z.string().url().nullable(),
  teams: z.array(z.string()).default([]),
  boards_maintained: z.array(z.string()).default([]),
  competences: z.array(z.string()).default([]),
  days_since_last_activity: z.number().default(-1),
});
export type Maintainer = z.infer<typeof MaintainerSchema>;
