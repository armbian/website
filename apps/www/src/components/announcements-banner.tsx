import { getPayload } from 'payload';
import config from '@payload-config';
import { Info, AlertTriangle, Rocket, CalendarDays, ArrowRight } from 'lucide-react';
import { AnnouncementDismiss } from './announcement-dismiss';
import { sanitizeCmsHtml } from '@/lib/sanitize';

const TYPE_CONFIG = {
  info: { icon: Info, bg: 'bg-blue-600', text: 'text-white' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-500', text: 'text-black' },
  release: { icon: Rocket, bg: 'bg-emerald-600', text: 'text-white' },
  event: { icon: CalendarDays, bg: 'bg-purple-600', text: 'text-white' },
} as const;

interface Props {
  readMoreLabel: string;
}

export async function AnnouncementsBanner({ readMoreLabel }: Props) {
  let announcement;
  try {
    const payload = await getPayload({ config });
    const now = new Date().toISOString();
    const result = await payload.find({
      collection: 'announcements',
      where: {
        and: [
          { active: { equals: true } },
          { publishDate: { less_than_equal: now } },
        ],
      },
      sort: '-pinned,-publishDate',
      limit: 1,
    });

    const doc = result.docs[0];
    if (!doc) return null;
    if (doc.expiresAt && new Date(doc.expiresAt) < new Date()) return null;

    let html = '';
    if (doc.content && typeof doc.content === 'object') {
      const { convertLexicalToHTMLAsync, defaultHTMLConvertersAsync } =
        await import('@payloadcms/richtext-lexical/html-async');
      html = await convertLexicalToHTMLAsync({
        converters: defaultHTMLConvertersAsync,
        data: doc.content as any,
      });
    }
    announcement = { ...doc, html };
  } catch {
    return null;
  }

  if (!announcement) return null;

  const style = TYPE_CONFIG[announcement.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info;
  const Icon = style.icon;

  return (
    <AnnouncementDismiss announcementId={String(announcement.id)} className={`fixed top-16 left-0 right-0 z-40 ${style.bg} ${style.text} shadow-lg`}>
      <div className="max-w-7xl mx-auto px-4 pr-10 sm:px-6 sm:pr-12 py-2.5 sm:py-2 flex items-center justify-center gap-2 text-xs sm:text-sm">
        <Icon size={14} strokeWidth={2.5} className="shrink-0" />
        <span className="font-bold truncate">{announcement.title}</span>
        <span className="hidden md:inline opacity-80">—</span>
        <span
          className="hidden md:inline opacity-80 truncate [&>div]:inline [&>p]:inline"
          dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(announcement.html) }}
        />
        {announcement.link && (
          <a
            href={announcement.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`${style.text} font-bold hover:underline inline-flex items-center gap-1 shrink-0`}
          >
            {readMoreLabel} <ArrowRight size={12} strokeWidth={2.5} />
          </a>
        )}
      </div>
    </AnnouncementDismiss>
  );
}
