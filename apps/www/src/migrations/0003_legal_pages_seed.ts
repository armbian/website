import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

/**
 * Seed the three legal CMS pages (privacy, terms, imprint) so the site
 * has linkable URLs from day one. Idempotent: an UPSERT on the unique
 * `slug` index re-applies the canonical text on every run, so editing
 * this file and removing the migration's row from `payload_migrations`
 * is the supported way to push corrected legal copy to existing
 * deployments. Title and meta fields are also overwritten; the publish
 * status is left alone so an editor can take a page offline temporarily
 * without it being re-published by the next migration run.
 *
 * Content is in English only by design.
 */

interface TextNode {
  type: 'text';
  text: string;
  format: number;
  detail: number;
  mode: 'normal';
  style: string;
  version: number;
}

interface LinkNode {
  type: 'link';
  fields: { linkType: 'custom'; url: string; newTab: boolean };
  format: '';
  indent: 0;
  version: 3;
  direction: 'ltr';
  children: TextNode[];
}

type InlineNode = TextNode | LinkNode;

interface ParagraphNode {
  type: 'paragraph';
  format: '';
  indent: 0;
  version: 1;
  direction: 'ltr';
  textFormat: 0;
  textStyle: '';
  children: InlineNode[];
}

interface HeadingNode {
  type: 'heading';
  tag: 'h2' | 'h3';
  format: '';
  indent: 0;
  version: 1;
  direction: 'ltr';
  children: InlineNode[];
}

interface ListItemNode {
  type: 'listitem';
  format: '';
  indent: 0;
  version: 1;
  direction: 'ltr';
  value: number;
  children: InlineNode[];
}

interface ListNode {
  type: 'list';
  tag: 'ul' | 'ol';
  listType: 'bullet' | 'number';
  start: 1;
  format: '';
  indent: 0;
  version: 1;
  direction: 'ltr';
  children: ListItemNode[];
}

type BlockNode = ParagraphNode | HeadingNode | ListNode;

const FORMAT_BOLD = 1;

function text(value: string, format: number = 0): TextNode {
  return {
    type: 'text',
    text: value,
    format,
    detail: 0,
    mode: 'normal',
    style: '',
    version: 1,
  };
}

function link(url: string, label: string): LinkNode {
  return {
    type: 'link',
    fields: { linkType: 'custom', url, newTab: !url.startsWith('/') },
    format: '',
    indent: 0,
    version: 3,
    direction: 'ltr',
    children: [text(label)],
  };
}

function p(...children: InlineNode[]): ParagraphNode {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    textFormat: 0,
    textStyle: '',
    children,
  };
}

function h2(value: string): HeadingNode {
  return {
    type: 'heading',
    tag: 'h2',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [text(value)],
  };
}

function h3(value: string): HeadingNode {
  return {
    type: 'heading',
    tag: 'h3',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [text(value)],
  };
}

function ul(...items: string[]): ListNode {
  return {
    type: 'list',
    tag: 'ul',
    listType: 'bullet',
    start: 1,
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: items.map((item, idx) => ({
      type: 'listitem' as const,
      format: '' as const,
      indent: 0 as const,
      version: 1,
      direction: 'ltr' as const,
      value: idx + 1,
      children: [text(item)],
    })),
  };
}

function lexical(...blocks: BlockNode[]) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: blocks,
    },
  };
}

const EFFECTIVE_DATE = '3 May 2026';
const ENTITY = 'Armbian d.o.o.';
const ENTITY_VAT = 'SI38201194';
const ENTITY_ADDRESS = 'Slovenia, EU';
const ENTITY_EMAIL = 'info@armbian.com';
const SITE = 'www.armbian.com';

const privacyContent = lexical(
  p(text(`Effective date: ${EFFECTIVE_DATE}.`)),
  p(
    text(
      `This Privacy Policy explains how ${ENTITY} ("Armbian", "we", "us") collects, uses and shares personal data when you visit ${SITE} or interact with us through our forms. We process personal data in accordance with the EU General Data Protection Regulation (GDPR).`,
    ),
  ),

  h2('1. Data controller'),
  p(
    text(
      `${ENTITY}, registered in Slovenia (VAT ${ENTITY_VAT}). For privacy questions or to exercise your rights, contact `,
    ),
    link(`mailto:${ENTITY_EMAIL}`, ENTITY_EMAIL),
    text('.'),
  ),

  h2('2. What we collect and why'),
  h3('2.1 Information you provide via forms'),
  p(
    text(
      'When you submit the contact form (/contact) we collect your first name, last name, company name, email address and the content of your message. When you submit the maintainer update form (/update-data) we additionally collect: forum username, GitHub URL, list of maintained hardware, areas of expertise, payment email (PayPal), phone number and postal address.',
    ),
  ),
  p(
    text('Legal basis: '),
    text('Article 6(1)(b)', FORMAT_BOLD),
    text(' GDPR (steps prior to a contract / contractual performance) for business inquiries; '),
    text('Article 6(1)(f)', FORMAT_BOLD),
    text(' GDPR (legitimate interest in maintaining a contributor directory) for the maintainer form.'),
  ),

  h3('2.2 Server logs'),
  p(
    text(
      'Our reverse proxy (Caddy) and API (Fastify) log the requesting IP address, user agent, requested URL, HTTP status and response time to standard output, captured by the container runtime. We do not deliberately persist these logs beyond what is operationally needed for debugging and abuse mitigation; effective retention is determined by the host operating system and the lifetime of the container.',
    ),
  ),
  p(
    text('Legal basis: '),
    text('Article 6(1)(f)', FORMAT_BOLD),
    text(' GDPR (legitimate interest in operating a secure service).'),
  ),

  h3('2.3 Cookies and local storage'),
  p(
    text(
      'We use a small number of strictly necessary cookies and browser-storage entries to operate the site:',
    ),
  ),
  ul(
    'locale (HTTP cookie, 1 year): remembers your preferred language.',
    'armbian-theme (localStorage): remembers your light/dark theme preference.',
    'armbian-consent (localStorage): records your cookie-banner choices.',
    'Payload session cookie (HTTP-only, /admin only): authenticates editorial users.',
  ),
  p(
    text(
      'Functional resources (third-party flag icons served from a public CDN, see section 3) are loaded only after you grant explicit consent through our cookie banner.',
    ),
  ),

  h2('3. Third-party processors and recipients'),
  p(
    text(
      'We share the minimum amount of personal data needed. The following third parties process or receive personal data through services we use or link to:',
    ),
  ),
  ul(
    'Zoho Corporation (Zoho Bigin CRM, EU region) — receives the data you submit through /contact and /update-data so we can manage business inquiries and maintainer records. Stored on Zoho EU infrastructure.',
    'Google Ireland Ltd. (reCAPTCHA v2) — anti-spam protection on the /contact and /update-data form pages. Processes interaction signals to score whether you are human; the script is loaded only on those pages.',
    'Calendly LLC (United States) — handles scheduling for our Office Hours and paid Business Consultation slots when you click "Schedule a Meeting" or "Book Consultation" on /contact. You are redirected to calendly.com/armbian; data you enter there is processed by Calendly under their own privacy policy.',
    'Payment platforms — when you donate via /donate you are redirected to one of: PayPal (PayPal Holdings, Inc.), Liberapay (open-source platform), or GitHub Sponsors (GitHub, Inc.). Each transaction is processed by the chosen platform under its own terms. Armbian receives the resulting funds and any information the platform passes on (typically your name and email if you opt to share it).',
    'jsDelivr (Prospect One sp. z o.o.) — public CDN that serves the country-flag icons used by the language switcher. Loaded only after you grant functional cookie consent.',
    'GitHub, Inc. — when you view pages that list contributors or maintainers (/authors, individual board pages), your browser may load avatar images directly from avatars.githubusercontent.com.',
    'Automattic, Inc. (Gravatar) — those same pages may also load avatar images directly from www.gravatar.com.',
    'Authentik (single sign-on, optional) — if this Armbian deployment is configured with OIDC single sign-on, authentication for the editorial admin (/admin) is delegated to an Authentik server we operate. Only Armbian editorial users interact with this system.',
    'Hosting provider — operates the servers where the site, API and database run, under contractual confidentiality.',
  ),
  p(
    text(
      'Where any of these recipients transfer data outside the EU/EEA, transfers rely on the EU-U.S. Data Privacy Framework or Standard Contractual Clauses as appropriate. The Site additionally links out to community platforms (forum, Discord, Mastodon, X, IRC, LinkedIn, GitHub) which operate under their own terms and privacy policies and are not controlled by Armbian.',
    ),
  ),

  h2('4. Retention'),
  ul(
    'Form submissions: kept in our CRM for as long as the relationship is active and up to 24 months thereafter, unless a longer retention period is required by law.',
    'Server logs: see section 2.2 — not deliberately persisted; retention is governed by the host operating system and container lifecycle.',
    'Maintainer profile data: kept while you are listed as an active contributor; removed on request.',
  ),

  h2('5. Your rights'),
  p(text('Under the GDPR you have the right to:')),
  ul(
    'access the personal data we hold about you;',
    'request rectification of inaccurate data;',
    'request erasure ("right to be forgotten");',
    'restrict or object to processing;',
    'data portability for data you provided directly;',
    'withdraw consent at any time, where processing is based on consent;',
    'lodge a complaint with the Slovenian Information Commissioner (Informacijski pooblaščenec, www.ip-rs.si) or the supervisory authority of your habitual residence.',
  ),
  p(text('To exercise any of these rights, write to '), link(`mailto:${ENTITY_EMAIL}`, ENTITY_EMAIL), text('.')),

  h2('6. Security'),
  p(
    text(
      'We apply reasonable technical and organisational measures to protect personal data against unauthorised access, alteration, disclosure or destruction, including encryption in transit (HTTPS), least-privilege access controls, and regular software updates.',
    ),
  ),

  h2('7. Children'),
  p(
    text(
      'The site is not directed to children under 16. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal data, please contact us so we can delete it.',
    ),
  ),

  h2('8. Changes to this policy'),
  p(
    text(
      'We may update this policy to reflect changes to our practices or legal obligations. Material changes will be highlighted on this page with a new effective date.',
    ),
  ),

  h2('9. Contact'),
  p(
    text(`${ENTITY} — ${ENTITY_ADDRESS} — `),
    link(`mailto:${ENTITY_EMAIL}`, ENTITY_EMAIL),
  ),
);

const termsContent = lexical(
  p(text(`Effective date: ${EFFECTIVE_DATE}.`)),
  p(
    text(
      `These Terms of Service ("Terms") govern your access to and use of ${SITE} (the "Site"), operated by ${ENTITY}. By accessing or using the Site you agree to be bound by these Terms. If you do not agree, please do not use the Site.`,
    ),
  ),

  h2('1. The service'),
  p(
    text(
      'The Site provides information about the Armbian Linux distribution, supported hardware, downloads, documentation and community resources. Some content is editorial and may change without notice. Hardware compatibility data is provided on a best-effort basis.',
    ),
  ),

  h2('2. Open-source software'),
  p(
    text(
      'The Armbian build framework, kernels, configuration and tooling are distributed under their respective open-source licences (primarily GPL-2.0 and compatible licences). Nothing in these Terms restricts the rights granted to you under those licences. The licence text accompanying each component governs its use, modification and redistribution.',
    ),
  ),

  h2('3. Acceptable use'),
  p(text('You agree not to:')),
  ul(
    'use the Site in violation of any applicable law or regulation;',
    'attempt to gain unauthorised access to systems, accounts or data;',
    'interfere with or disrupt the integrity, availability or performance of the Site;',
    'use automated means (bots, scrapers) to overload our infrastructure;',
    'submit false, misleading or unlawful content through any of our forms.',
  ),

  h2('4. User submissions'),
  p(
    text(
      'By submitting content through our forms (contact form, maintainer registration, etc.) you confirm that you have the right to share that content and grant us a non-exclusive, worldwide, royalty-free licence to use it for the purposes described in our Privacy Policy. You are solely responsible for the content you submit.',
    ),
  ),

  h2('5. Intellectual property'),

  h3('5.1 Trademarks'),
  p(
    text(
      'Armbian® is a registered trademark of Armbian d.o.o. The Armbian name, wordmark and logo are protected trademarks; all rights are reserved.',
    ),
  ),
  p(
    text(
      'Nominative use of the "Armbian" name to refer to the Armbian project or its software is permitted, provided that you do not: (a) imply sponsorship, endorsement, certification or affiliation by Armbian that does not exist; (b) use the name or logo as part of a product name, company name, domain name or social-media handle that may cause confusion with Armbian or its official channels; or (c) modify the Armbian logo, recolour it, or use it in a way that disparages the project. Any other use of the Armbian trademarks — including merchandise, redistribution under the Armbian brand, or commercial use of the logo — requires our prior written permission. For licensing requests contact ',
    ),
    link(`mailto:${ENTITY_EMAIL}`, ENTITY_EMAIL),
    text('.'),
  ),

  h3('5.2 Copyright'),
  p(
    text(
      'The Site\'s editorial content, design and code (where not licensed under an open-source licence) are protected by copyright and may not be copied, reproduced or redistributed without prior written permission, except where permitted by law.',
    ),
  ),

  h2('6. Third-party services and links'),
  p(
    text(
      'The Site links to or embeds resources operated by third parties (forum, GitHub, downloads mirrors, payment processors, scheduling platforms). We do not control those services and are not responsible for their content, availability or terms. Your use of third-party services is governed by their own terms and privacy policies.',
    ),
  ),

  h2('7. Paid services'),
  p(
    text(
      'The Site advertises paid services — currently the Business Consultation listed on /contact, which is paid in advance via the third-party scheduling and payment provider (Calendly). Bookings and refunds are subject to the policy presented at the time of booking by that provider. If you need to reschedule or have questions about a paid booking, contact us at ',
    ),
    link(`mailto:${ENTITY_EMAIL}`, ENTITY_EMAIL),
    text(
      '. Donations made through /donate are voluntary contributions and are not refundable, except where required by applicable consumer-protection law.',
    ),
  ),

  h2('8. Disclaimer of warranties'),
  p(
    text(
      'THE SITE AND ALL CONTENT ARE PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR ACCURACY. WE DO NOT WARRANT THAT THE SITE WILL BE UNINTERRUPTED OR ERROR-FREE.',
    ),
  ),

  h2('9. Limitation of liability'),
  p(
    text(
      'TO THE MAXIMUM EXTENT PERMITTED BY LAW, ARMBIAN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL OR PUNITIVE DAMAGES, OR FOR LOSS OF DATA, REVENUE OR PROFITS, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SITE OR ANY ARMBIAN SOFTWARE. NOTHING IN THESE TERMS LIMITS LIABILITY THAT CANNOT BE EXCLUDED UNDER APPLICABLE LAW (INCLUDING LIABILITY FOR GROSS NEGLIGENCE, WILFUL MISCONDUCT OR DEATH/PERSONAL INJURY CAUSED BY OUR NEGLIGENCE).',
    ),
  ),

  h2('10. Changes to the Terms'),
  p(
    text(
      'We may update these Terms from time to time. Updated Terms will be posted on this page with a new effective date. Continued use of the Site after changes constitutes acceptance of the new Terms.',
    ),
  ),

  h2('11. Governing law and jurisdiction'),
  p(
    text(
      'These Terms are governed by the laws of the Republic of Slovenia, without regard to its conflict-of-laws rules. The competent courts of Slovenia have exclusive jurisdiction over any disputes arising out of or related to these Terms or the Site, subject to mandatory consumer-protection rules of your country of residence.',
    ),
  ),

  h2('12. Contact'),
  p(
    text(`${ENTITY} — ${ENTITY_ADDRESS} — `),
    link(`mailto:${ENTITY_EMAIL}`, ENTITY_EMAIL),
  ),
);

const imprintContent = lexical(
  p(
    text(
      'Information in accordance with § 5 TMG (German Telemedia Act) and Article 5 of Directive 2000/31/EC.',
    ),
  ),

  h2('Operator'),
  p(text(ENTITY, FORMAT_BOLD)),
  p(text(`Address: ${ENTITY_ADDRESS}`)),
  p(text(`VAT identification number: ${ENTITY_VAT}`)),
  p(text('Registered in Slovenia.')),

  h2('Contact'),
  p(text('Email: '), link(`mailto:${ENTITY_EMAIL}`, ENTITY_EMAIL)),
  p(text('Website: '), link(`https://${SITE}`, SITE)),

  h2('Responsible for content'),
  p(
    text(
      `${ENTITY}, represented by its directors. Editorial responsibility under § 18 (2) MStV lies with ${ENTITY} at the address above.`,
    ),
  ),

  h2('EU dispute resolution'),
  p(
    text(
      'The European Commission provides a platform for online dispute resolution (ODR), available at ',
    ),
    link('https://ec.europa.eu/consumers/odr/', 'https://ec.europa.eu/consumers/odr/'),
    text(
      '. We are not obliged and not willing to participate in dispute-resolution proceedings before a consumer arbitration board.',
    ),
  ),

  h2('Liability for content'),
  p(
    text(
      'As a service provider, we are responsible for our own content on these pages in accordance with general laws (§ 7 (1) TMG). We are however not under obligation to monitor transmitted or stored third-party information, or to investigate circumstances that indicate illegal activity (§§ 8–10 TMG). Obligations to remove or block the use of information under general laws remain unaffected.',
    ),
  ),

  h2('Liability for links'),
  p(
    text(
      'Our offer contains links to external third-party websites. We have no influence on the content of those websites and accept no responsibility for it. The respective provider or operator of the linked sites is always responsible for their content. Linked pages were checked for possible legal violations at the time of linking; illegal content was not recognisable at that time.',
    ),
  ),

  h2('Copyright'),
  p(
    text(
      'Content and works on these pages created by the operator are subject to Slovenian copyright law. Reproduction, processing, distribution and any kind of exploitation outside the limits of copyright law require the written consent of the respective author or creator. Downloads and copies of these pages are only permitted for private, non-commercial use.',
    ),
  ),
);

const PAGES: Array<{
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  content: ReturnType<typeof lexical>;
}> = [
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    metaTitle: 'Privacy Policy | Armbian',
    metaDescription:
      'How Armbian collects, uses and protects your personal data. GDPR rights, data processors, retention and contact details.',
    content: privacyContent,
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    metaTitle: 'Terms of Service | Armbian',
    metaDescription:
      'Terms governing your use of www.armbian.com, including acceptable use, disclaimers, governing law and contact information.',
    content: termsContent,
  },
  {
    slug: 'imprint',
    title: 'Imprint',
    metaTitle: 'Imprint | Armbian',
    metaDescription:
      'Legal information about Armbian d.o.o. as required under § 5 TMG and EU Directive 2000/31/EC.',
    content: imprintContent,
  },
];

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const page of PAGES) {
    await db.execute(sql`
      INSERT INTO "pages" ("title", "slug", "content", "status", "meta_title", "meta_description")
      VALUES (
        ${page.title},
        ${page.slug},
        ${JSON.stringify(page.content)}::jsonb,
        'published',
        ${page.metaTitle},
        ${page.metaDescription}
      )
      ON CONFLICT ("slug") DO UPDATE SET
        "title" = EXCLUDED."title",
        "content" = EXCLUDED."content",
        "meta_title" = EXCLUDED."meta_title",
        "meta_description" = EXCLUDED."meta_description",
        "updated_at" = now();
    `);
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DELETE FROM "pages"
    WHERE "slug" IN ('privacy', 'terms', 'imprint');
  `);
}
