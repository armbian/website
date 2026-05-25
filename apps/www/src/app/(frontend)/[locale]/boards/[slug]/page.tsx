import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getApiClient } from '@/lib/api.server';
import { SupportBadge } from '@/components/ui/support-badge';
import { PageHero } from '@/components/layout/page-hero';
import { ScrollReveal } from '@/components/scroll-reveal';
import {
  parseVariant,
  getOsRelease,
  KERNEL_BRANCHES,
  APP_META,
  ARMBIAN_URLS,
  vendorLogoUrl,
  formatBytes,
} from '@armbian/config';
import { ApiClientError } from '@armbian/api-client';
import { DonationBanner } from '@/components/board/donation-banner';
import { BoardJsonLd } from '@/components/board/board-jsonld';
import { BoardImage as BoardImageWithFallback } from '@/components/board/board-image';
import { Link } from '@/i18n/navigation';
import type { BoardSummary, Image as BoardImage } from '@armbian/schemas';
import { Download, BookOpen, Code, ArrowRight, ArrowLeft } from 'lucide-react';
import { SiGithub } from '@icons-pack/react-simple-icons';
import type { Metadata } from 'next';
import { BoardPageDownloads } from '@/components/board/board-page-downloads';
import { FlashGuideModal } from '@/components/board/flash-guide-modal';
import { SiblingBoardsCarousel } from '@/components/board/sibling-boards-carousel';
import { getPayload } from 'payload';
import config from '@payload-config';
import { renderLexicalContent } from '@/lib/cms-lexical';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

function kernelColor(branch: string): string {
  return KERNEL_BRANCHES[branch]?.badgeColor ?? '#6b7280';
}

const CATEGORY_META: Record<string, { color: string; translationKey: string }> = {
  desktop: { color: '#3b82f6', translationKey: 'desktop' },
  minimal: { color: '#10b981', translationKey: 'minimal' },
  cloud: { color: '#0ea5e9', translationKey: 'cloud' },
  server: { color: '#8b5cf6', translationKey: 'server' },
  apps: { color: '#f59e0b', translationKey: 'apps' },
};

function groupImages(images: BoardImage[]) {
  const groups: Record<
    string,
    { color: string; translationKey: string; categoryKey: string; images: BoardImage[] }
  > = {};
  for (const img of images) {
    const categoryKey = img.application
      ? 'apps'
      : img.kernel_branch === 'cloud'
        ? 'cloud'
        : img.variant === 'minimal'
          ? 'minimal'
          : img.variant === 'server'
            ? 'server'
            : 'desktop';
    if (!groups[categoryKey]) {
      const meta = CATEGORY_META[categoryKey] ?? CATEGORY_META['apps']!;
      groups[categoryKey] = { ...meta!, categoryKey, images: [] };
    }
    groups[categoryKey]!.images.push(img);
  }
  return groups;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const tSupport = await getTranslations({ locale, namespace: 'support' });
  const tBoards = await getTranslations({ locale, namespace: 'boards' });
  try {
    const api = await getApiClient();
    const [boardRes, imagesRes] = await Promise.all([
      api.getBoard(slug),
      api.getBoardImages(slug).catch(() => ({ data: [] as { distribution: string }[] })),
    ]);
    const board = boardRes.data;
    const distroNames: string[] = [];
    const seen = new Set<string>();
    for (const img of imagesRes.data as { distribution: string }[]) {
      const d = img.distribution;
      if (d && !seen.has(d)) {
        seen.add(d);
        distroNames.push(d.charAt(0).toUpperCase() + d.slice(1));
      }
    }
    const distros = distroNames.join(', ');
    const tierLabel = tSupport(board.support_tier);
    const templateVars = {
      board: board.name,
      vendor: board.vendor_name,
      tier: tierLabel,
      count: board.image_count,
    };
    const description = distros
      ? tBoards('og_description_with_distros', { ...templateVars, distros })
      : tBoards('og_description', templateVars);
    const ogImage = `/api/v1/images/boards/480/${slug}.png`;
    const fullTitle = `${board.name} — Armbian`;

    return {
      title: board.name,
      description,
      alternates: { canonical: `/boards/${slug}` },
      openGraph: {
        type: 'article',
        siteName: 'Armbian',
        title: fullTitle,
        description,
        url: `/boards/${slug}`,
        locale,
        images: [{ url: ogImage, width: 480, height: 480, alt: board.name }],
      },
      twitter: {
        card: 'summary_large_image',
        title: fullTitle,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return { title: 'Board' };
  }
}

function MaintainersList({
  maintainers,
  label,
}: {
  maintainers: { name: string; avatar: string; github: string | null }[];
  label: string;
}) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border)/0.5)] bg-[rgb(var(--bg-el)/0.5)] px-4 py-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-[rgb(var(--fg-3))] mb-2">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {maintainers.map((m) => (
          <a
            key={m.name}
            href={m.github ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-3 text-xs hover:bg-[rgb(var(--bg-sub))] transition-colors"
          >
            <img src={m.avatar} alt={m.name} width={28} height={28} className="rounded-md" />
            <span className="font-medium">{m.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default async function BoardPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('board');
  const tDownload = await getTranslations('download');

  const api = await getApiClient();
  let board: Awaited<ReturnType<typeof api.getBoard>>['data'];
  let images: BoardImage[];

  try {
    const [boardRes, imagesRes] = await Promise.all([api.getBoard(slug), api.getBoardImages(slug)]);
    board = boardRes.data;
    images = imagesRes.data;
  } catch (err) {
    if (err instanceof ApiClientError && err.isNotFound) {
      notFound();
    }
    throw err;
  }

  // Sibling boards (for the "More from X" carousel) and the Payload flash
  // guide both depend only on `board` and are independent — fire them in
  // parallel to save a round trip on every page render.
  const [siblingResult, flashGuideResult] = await Promise.allSettled([
    api.getBoards({
      vendor: board.vendor_slug,
      sort: 'popularity',
      // 13 = 12 siblings the carousel can show + room to filter out the
      // current board if it appears in the popularity ordering.
      limit: 13,
    }),
    (async () => {
      const payload = await getPayload({ config });
      return payload.find({
        collection: 'flash-guides',
        where: { boardSlug: { equals: slug } },
        locale: locale as 'en' | 'it',
        fallbackLocale: 'en',
        limit: 1,
      });
    })(),
  ]);

  let siblingBoards: BoardSummary[] = [];
  let vendorBoardCount = 0;
  if (siblingResult.status === 'fulfilled') {
    vendorBoardCount = siblingResult.value.meta.total ?? 0;
    siblingBoards = siblingResult.value.data.filter((b) => b.slug !== board.slug).slice(0, 12);
  }

  let flashGuide: { title: string; content: string; prerequisites: string[] } | null = null;
  if (flashGuideResult.status === 'fulfilled') {
    const doc = flashGuideResult.value.docs[0];
    if (doc) {
      const prereqs = Array.isArray(doc.prerequisites)
        ? doc.prerequisites.map((p: { item?: string }) => p.item ?? '')
        : [];
      flashGuide = {
        title: doc.title,
        content: await renderLexicalContent(doc.content),
        prerequisites: prereqs.filter(Boolean),
      };
    }
  }

  const isTrunk = (img: BoardImage) => img.release.toLowerCase().includes('trunk');
  const stableImages = images.filter((img) => !isTrunk(img));
  const rollingImages = images.filter(isTrunk);

  const imageGroups = groupImages(stableImages);
  const rollingGroups = groupImages(rollingImages);
  const promotedImages = stableImages.filter((img) => img.promoted);

  const formattedPromotedImages = promotedImages.map((img) => {
    const os = getOsRelease(img.distribution);
    const { base: variantLabel, extension: variantExtension } = parseVariant(img.variant);
    return {
      ...img,
      os,
      variantLabel,
      variantExtension,
      formattedSize: formatBytes(img.download.size_bytes),
    };
  });

  const formatGroup = ([category, group]: [string, ReturnType<typeof groupImages>[string]]) => ({
    category,
    ...group,
    images: group.images.map((img) => {
      const os = getOsRelease(img.distribution);
      const { base: variantLabel, extension: variantExtension } = parseVariant(img.variant);
      return {
        ...img,
        os,
        variantLabel,
        variantExtension,
        appMeta: img.application ? (APP_META[img.application] ?? null) : null,
        formattedSize: formatBytes(img.download.size_bytes),
      };
    }),
  });

  const formattedGroups = Object.entries(imageGroups).map(formatGroup);
  const formattedRollingGroups = Object.entries(rollingGroups).map(formatGroup);

  return (
    <div className="min-h-screen">
      <BoardJsonLd board={board} />

      <PageHero className="!pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/boards"
            className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--fg-3))] hover:text-[rgb(var(--fg))] transition-colors mb-4"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            {t('back_to_catalog')}
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="hw-card rounded-2xl shrink-0 w-full sm:w-72 overflow-hidden relative">
                  <div className="aspect-square w-full flex items-center justify-center">
                    <BoardImageWithFallback
                      src={board.image_url}
                      alt={board.name}
                      width={224}
                      height={224}
                      className="w-full h-full object-contain drop-shadow-xl scale-125 relative z-10"
                    />
                  </div>
                  <div className="absolute bottom-3 right-3 w-10 h-10 rounded-lg bg-white shadow-lg flex items-center justify-center overflow-hidden p-1.5">
                    <img
                      src={vendorLogoUrl(board.vendor_slug, '480')}
                      alt={board.vendor_name}
                      width={40}
                      height={40}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/vendors/${board.vendor_slug}`}
                    className="text-[11px] text-[rgb(var(--brand))] font-mono font-bold uppercase tracking-widest mb-2 inline-block hover:underline"
                  >
                    {board.vendor_name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h1 className="text-fluid-2xl font-black tracking-tight">{board.name}</h1>
                    <SupportBadge tier={board.support_tier} />
                  </div>
                  {board.summary && (
                    <p className="text-[rgb(var(--fg-2))] text-sm leading-relaxed mb-4">
                      {board.summary}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgb(var(--bg-el))] border border-[rgb(var(--border)/0.5)] text-[11px] font-medium">
                      <Download size={12} strokeWidth={2} stroke="rgb(var(--brand))" />
                      {tDownload('images_count', { count: images.length })}
                    </span>
                    {board.kernel_branches.map((kb) => (
                      <span
                        key={kb.branch}
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
                        style={{
                          background: `linear-gradient(135deg, ${kernelColor(kb.branch)} 0%, ${kernelColor(kb.branch)}cc 100%)`,
                          boxShadow: `0 1px 4px ${kernelColor(kb.branch)}44`,
                        }}
                      >
                        {kb.branch}{' '}
                        <span className="opacity-80 font-mono">{kb.kernel_version}</span>
                      </span>
                    ))}
                  </div>
                  <a
                    href={ARMBIAN_URLS.IMAGER}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[rgb(var(--brand))] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[rgb(var(--brand)/0.2)] transition-all hover:bg-[rgb(var(--brand-hover))] hover:-translate-y-0.5"
                  >
                    <Download size={16} strokeWidth={2} />
                    {t('download_imager')}
                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
                      {t('download_imager_recommended')}
                    </span>
                  </a>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              {board.maintainers.length > 0 && (
                <MaintainersList maintainers={board.maintainers} label={t('maintained_by')} />
              )}
              <div className="rounded-xl border border-[rgb(var(--border)/0.5)] bg-[rgb(var(--bg-el)/0.5)] overflow-hidden">
                {board.github_url && (
                  <a
                    href={board.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[rgb(var(--fg-2))] transition-colors hover:bg-[rgb(var(--bg-sub))] hover:text-[rgb(var(--fg))]"
                  >
                    <SiGithub size={16} className="opacity-50 shrink-0" />
                    <span className="flex-1">{t('board_config')}</span>
                    <ArrowRight size={12} strokeWidth={2} className="opacity-30 shrink-0" />
                  </a>
                )}
                <a
                  href={ARMBIAN_URLS.BUILD_DOCS}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium text-[rgb(var(--fg-2))] transition-colors hover:bg-[rgb(var(--bg-sub))] hover:text-[rgb(var(--fg))] ${board.github_url ? 'border-t border-[rgb(var(--border)/0.3)]' : ''}`}
                >
                  <Code size={16} strokeWidth={1.5} className="opacity-50 shrink-0" />
                  <span className="flex-1">{t('build_docs')}</span>
                  <ArrowRight size={12} strokeWidth={2} className="opacity-30 shrink-0" />
                </a>
                {flashGuide && (
                  <FlashGuideModal
                    title={flashGuide.title}
                    content={flashGuide.content}
                    prerequisites={flashGuide.prerequisites}
                    buttonLabel={t('flash_guide')}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <BoardPageDownloads
          formattedPromotedImages={formattedPromotedImages}
          formattedGroups={formattedGroups}
          formattedRollingGroups={formattedRollingGroups}
          locale={locale}
          boardGithubUrl={board.github_url ?? undefined}
        />

        {board.build_command && (
          <ScrollReveal>
            <section className="mb-20">
              <div className="rounded-2xl border border-[rgb(var(--border)/0.5)] overflow-hidden bg-[rgb(var(--bg-el)/0.3)]">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-[rgb(var(--border)/0.3)]">
                  <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand)/0.1)] flex items-center justify-center">
                    <Code size={18} strokeWidth={2} stroke="rgb(var(--brand))" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{t('build_from_source')}</h2>
                    <p className="text-xs text-[rgb(var(--fg-3))]">{t('build_description')}</p>
                  </div>
                </div>
                <div className="bg-[rgb(10_10_12)] p-5">
                  <pre className="text-sm font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap break-all">
                    <span className="text-green-400 select-none">$ </span>
                    {board.build_command}
                  </pre>
                </div>
                <div className="px-6 py-4 flex gap-4 border-t border-[rgb(var(--border)/0.2)]">
                  <a
                    href={ARMBIAN_URLS.BUILD_DOCS}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[rgb(var(--brand))] hover:underline inline-flex items-center gap-1.5"
                  >
                    <BookOpen size={14} strokeWidth={2} />
                    {t('build_docs')}
                  </a>
                  {board.github_url && (
                    <a
                      href={board.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[rgb(var(--brand))] hover:underline inline-flex items-center gap-1.5"
                    >
                      <SiGithub size={14} />
                      {t('board_config')}
                    </a>
                  )}
                </div>
              </div>
            </section>
          </ScrollReveal>
        )}

        {siblingBoards.length > 0 && (
          <ScrollReveal>
            <section className="mb-20">
              <SiblingBoardsCarousel
                boards={siblingBoards}
                vendorName={board.vendor_name}
                vendorSlug={board.vendor_slug}
                vendorBoardCount={vendorBoardCount}
              />
            </section>
          </ScrollReveal>
        )}

        <DonationBanner />
      </div>
    </div>
  );
}
