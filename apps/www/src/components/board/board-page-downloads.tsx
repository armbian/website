'use client';

import { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';
import { KERNEL_BRANCHES } from '@armbian/config';
import type {
  ImageFormat,
  StorageVariant,
  CompanionFile,
  DisplayVariant,
} from '@armbian/schemas';
import { ScrollReveal } from '@/components/scroll-reveal';
import { Download, Star, ChevronDown } from 'lucide-react';
import { Monitor, Zap, Server, Package } from 'lucide-react';

interface FormattedImage {
  id: string;
  os?: { family: string; name: string } | null;
  release: string;
  variantLabel: string;
  variantExtension: string | null;
  kernel_branch: string;
  kernel_version: string;
  formattedSize: string;
  promoted?: boolean;
  distribution: string;
  application?: string | null;
  appMeta?: { logo?: string; label?: string } | null;
  format: ImageFormat;
  storage?: StorageVariant | null;
  companions?: CompanionFile[];
  display_variants?: DisplayVariant[];
  download: {
    file_url: string;
    torrent_url?: string | null;
    sha_url?: string | null;
    asc_url?: string | null;
    updated_at: string;
    size_bytes: number;
  };
}

/** Semantic chip kinds rendered in the per-row extras strip. */
type ChipKind = 'format' | 'storage' | 'app' | 'modifier';

interface Chip {
  kind: ChipKind;
  label: string;
}

const FORMAT_LABEL: Record<ImageFormat, string> = {
  sd: '',
  rootfs: 'Rootfs tarball',
  qemu: 'QEMU / QCOW2',
  hyperv: 'Hyper-V VHD',
  qdl: 'QDL image',
};

const CHIP_STYLE: Record<ChipKind, string> = {
  // Amber warning: non-SD format — user needs a different flashing tool.
  format:
    'bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300 dark:ring-amber-500/25',
  // Cyan info: special storage hardware (UFS).
  storage:
    'bg-cyan-500/15 text-cyan-700 ring-cyan-500/30 dark:text-cyan-300 dark:ring-cyan-500/25',
  // Violet: pre-bundled app overlay (Home Assistant / Kali / OMV / openHAB).
  app: 'bg-violet-500/15 text-violet-700 ring-violet-500/30 dark:text-violet-300 dark:ring-violet-500/25',
  // Fuchsia: variant modifier (Mesa, backported stacks).
  modifier:
    'bg-fuchsia-500/15 text-fuchsia-700 ring-fuchsia-500/30 dark:text-fuchsia-300 dark:ring-fuchsia-500/25',
};

/** Derive the chip list for a single image. Returns [] when nothing is special. */
function deriveChips(img: FormattedImage, hideAppChip = false): Chip[] {
  const chips: Chip[] = [];
  if (img.format !== 'sd') chips.push({ kind: 'format', label: FORMAT_LABEL[img.format] });
  if (img.storage === 'ufs') chips.push({ kind: 'storage', label: 'UFS' });
  if (!hideAppChip && img.appMeta?.label) chips.push({ kind: 'app', label: img.appMeta.label });
  if (img.variantExtension) {
    // parseVariant emits labels like "(Backported Mesa)" — strip the parens.
    const cleaned = img.variantExtension.replace(/^\(|\)$/g, '').trim();
    if (cleaned) chips.push({ kind: 'modifier', label: cleaned });
  }
  return chips;
}

function formatBytesShort(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

interface FormattedGroup {
  category: string;
  color: string;
  translationKey: string;
  categoryKey: string;
  images: FormattedImage[];
}

interface BoardPageDownloadsProps {
  formattedPromotedImages: FormattedImage[];
  formattedGroups: FormattedGroup[];
  formattedRollingGroups?: FormattedGroup[];
  locale: string;
  tBoard?: unknown;
  boardBuildCommand?: string;
  boardGithubUrl?: string;
}

function CategoryIcon({ category, color }: { category: string; color: string }) {
  const props = { size: 16 as number, strokeWidth: 2 as number, stroke: color };
  switch (category) {
    case 'desktop':
      return <Monitor {...props} />;
    case 'minimal':
      return <Zap {...props} />;
    case 'server':
      return <Server {...props} />;
    case 'apps':
      return <Package {...props} />;
    default:
      return <Package {...props} />;
  }
}

function kernelColor(branch: string): string {
  return KERNEL_BRANCHES[branch]?.badgeColor ?? '#6b7280';
}

/**
 * Renders the "Type" column cell: a stack of color-coded chips for every
 * non-default property (format, storage, app overlay, variant modifier).
 * Shows an em dash when the image has nothing special.
 */
function TypeCell({ img, hideAppChip = false }: { img: FormattedImage; hideAppChip?: boolean }) {
  const chips = deriveChips(img, hideAppChip);
  if (chips.length === 0) {
    return <span className="text-[rgb(var(--fg-4))] text-xs">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((chip, i) => (
        <span
          key={`${chip.kind}-${i}`}
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ${CHIP_STYLE[chip.kind]}`}
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}

/**
 * Conditional sub-row rendered only when an image ships with companion
 * files or display panel variants. Shows a collapsible list with one entry
 * per file. Visually attached to the row above via no top border, subtle
 * background and indented content.
 */
function ExtrasStrip({ img, colSpan }: { img: FormattedImage; colSpan: number }) {
  const tBoard = useTranslations('board');
  const [open, setOpen] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState(0);

  const companions = img.companions ?? [];
  const displays = img.display_variants ?? [];
  const fileCount = companions.length + displays.length;

  if (fileCount === 0) return null;

  const selected = displays[selectedDisplay];

  return (
    <tr className="!border-t-0 bg-[rgb(var(--bg-sub)/0.35)]">
      <td colSpan={colSpan} className="!border-t-0 px-5 py-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 my-2 rounded-md py-0.5 text-[10px] font-semibold text-[rgb(var(--fg-3))] hover:text-[rgb(var(--fg))] transition-colors"
        >
          <ChevronDown
            size={11}
            strokeWidth={2.5}
            className={`transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
          />
          {tBoard('required_files')} · {fileCount}
        </button>
        {open && (
          <div className="pb-4 pr-3 space-y-3">
            {displays.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--fg-3))]">
                  {tBoard('display_panel')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {displays.map((v, i) => (
                    <label
                      key={v.url}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedDisplay === i
                          ? 'border-[rgb(var(--brand))] bg-[rgb(var(--brand)/0.1)] text-[rgb(var(--fg))]'
                          : 'border-[rgb(var(--border)/0.5)] text-[rgb(var(--fg-2))] hover:border-[rgb(var(--border))]'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`display-${img.id}`}
                        checked={selectedDisplay === i}
                        onChange={() => setSelectedDisplay(i)}
                        className="h-3 w-3 accent-[rgb(var(--brand))]"
                      />
                      <span>{v.label}</span>
                      <span className="text-[10px] text-[rgb(var(--fg-3))]">
                        {formatBytesShort(v.size_bytes)}
                      </span>
                    </label>
                  ))}
                </div>
                {selected && (
                  <a
                    href={selected.url}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--brand)/0.12)] px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--brand))] hover:bg-[rgb(var(--brand)/0.2)] transition-colors"
                  >
                    <Download size={10} strokeWidth={2.5} />
                    {tBoard('boot_for_display', { label: selected.label })}
                  </a>
                )}
              </div>
            )}
            {companions.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--fg-3))]">
                  {tBoard('flash_alongside_main')}
                </p>
                <ul className="space-y-1.5">
                  {companions.map((c) => (
                    <li key={c.url} className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center rounded-md bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-purple-300 ring-1 ring-purple-500/25">
                        {c.type}
                      </span>
                      <span className="text-[rgb(var(--fg-2))]">{c.label}</span>
                      <span className="text-[10px] text-[rgb(var(--fg-3))]">
                        {formatBytesShort(c.size_bytes)}
                      </span>
                      <a
                        href={c.url}
                        className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[rgb(var(--brand))] hover:underline"
                      >
                        <Download size={10} strokeWidth={2.5} />
                        {tBoard('direct_download')}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

export function BoardPageDownloads({
  formattedPromotedImages,
  formattedGroups,
  formattedRollingGroups = [],
  locale,
}: BoardPageDownloadsProps) {
  const t = useTranslations('board');
  const tDownload = useTranslations('download');

  return (
    <section id="downloads" className="mb-12 mt-8">
      {formattedPromotedImages.length > 0 && (
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Star size={20} strokeWidth={2} stroke="#10b981" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">{t('promoted_title')}</h2>
              <p className="text-sm text-[rgb(var(--fg-3))]">{t('promoted_desc')}</p>
            </div>
          </div>
        </ScrollReveal>
      )}

      {formattedPromotedImages.length > 0 && (
        <ScrollReveal>
          <div
            className={`grid gap-4 mb-10 ${
              formattedPromotedImages.length === 1
                ? 'grid-cols-1'
                : formattedPromotedImages.length === 2
                  ? 'sm:grid-cols-2'
                  : 'sm:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {formattedPromotedImages.map((img) => (
              <div
                key={img.id}
                className={`group relative rounded-2xl overflow-hidden transition-all hover:-translate-y-1 shadow-lg hover:shadow-2xl ${
                  img.os?.family === 'ubuntu' ? 'promoted-card-ubuntu' : 'promoted-card-debian'
                }`}
              >
                <div
                  className="absolute inset-0 opacity-[0.04] pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '20px 20px',
                  }}
                />
                <div className="relative p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 ring-1 ring-white/10">
                      <img
                        src={img.os?.family === 'ubuntu' ? '/ubuntu.png' : '/debian.svg'}
                        alt={img.os?.family ?? 'linux'}
                        width={36}
                        height={36}
                        className={`w-9 h-9 object-contain ${img.os?.family === 'debian' ? 'brightness-0 invert' : ''}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-base font-bold leading-tight truncate"
                        style={{ color: '#fff' }}
                      >
                        Armbian {img.release} {img.variantLabel}
                      </h3>
                      <p
                        className="text-xs font-medium mt-0.5 flex items-center gap-1.5"
                        style={{ color: 'rgba(255,255,255,0.75)' }}
                      >
                        {img.os ? img.os.name : img.distribution}
                        {img.format !== 'sd' && (
                          <span className="inline-flex items-center rounded-md bg-white/15 px-1.5 py-0.5 text-[9px] font-bold text-white ring-1 ring-white/20">
                            {FORMAT_LABEL[img.format]}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold text-white bg-black/25 backdrop-blur-sm ring-1 ring-white/10 shrink-0">
                      {img.kernel_branch} {img.kernel_version}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-black/20 backdrop-blur-sm px-4 py-2.5 mb-4 ring-1 ring-white/5">
                    <div>
                      <p className="text-[9px] text-white/50 uppercase tracking-wider font-semibold">
                        {t('promoted_status')}
                      </p>
                      <p className="text-sm font-bold text-green-400 flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                        {t('promoted_stable')}
                      </p>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex-1">
                      <p className="text-[9px] text-white/50 uppercase tracking-wider font-semibold">
                        {tDownload('size')}
                      </p>
                      <p className="text-base font-black text-white">{img.formattedSize}</p>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex-1">
                      <p className="text-[9px] text-white/50 uppercase tracking-wider font-semibold">
                        {tDownload('build_date')}
                      </p>
                      <p className="text-sm font-bold text-white">
                        {(() => {
                          try {
                            return new Date(img.download.updated_at).toLocaleDateString(locale, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            });
                          } catch {
                            return '--';
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={img.download.file_url}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white text-gray-900 px-4 py-3 text-sm font-bold hover:bg-white/90 transition-all shadow-lg mb-2"
                  >
                    <Download size={16} strokeWidth={2.5} />
                    {t('direct_download')}
                  </a>
                  <div className="flex items-center justify-center gap-3 text-[11px] font-medium text-white/50">
                    {img.download.torrent_url && (
                      <a
                        href={img.download.torrent_url}
                        className="hover:text-white/80 transition-colors"
                      >
                        {tDownload('torrent')}
                      </a>
                    )}
                    {img.download.torrent_url && img.download.sha_url && <span>·</span>}
                    {img.download.sha_url && (
                      <a
                        href={img.download.sha_url}
                        className="hover:text-white/80 transition-colors"
                      >
                        SHA {tDownload('checksum')}
                      </a>
                    )}
                    {img.download.sha_url && img.download.asc_url && <span>·</span>}
                    {img.download.asc_url && (
                      <a
                        href={img.download.asc_url}
                        className="hover:text-white/80 transition-colors"
                      >
                        PGP {tDownload('signature')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      )}

      <div className="space-y-8">
        {formattedGroups.map((group, groupIdx) => (
          <ScrollReveal key={group.category} delay={groupIdx * 0.05}>
            <div className="rounded-2xl border border-[rgb(var(--border)/0.5)] overflow-hidden bg-[rgb(var(--bg-el)/0.3)]">
              <div
                className="flex items-center gap-3 px-5 py-4 border-b border-[rgb(var(--border)/0.3)]"
                style={{ borderLeftWidth: 3, borderLeftColor: group.color }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${group.color}15` }}
                >
                  <CategoryIcon category={group.categoryKey} color={group.color} />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {tDownload(
                      `category_${group.translationKey}` as Parameters<typeof tDownload>[0],
                    )}
                  </h3>
                  <p className="text-[11px] text-[rgb(var(--fg-3))]">
                    {tDownload('build_date')}:{' '}
                    {(() => {
                      try {
                        return new Date(
                          Math.max(
                            ...group.images.map((img) =>
                              new Date(img.download.updated_at).getTime(),
                            ),
                          ),
                        ).toLocaleDateString(locale, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        });
                      } catch {
                        return '--';
                      }
                    })()}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-[rgb(var(--fg-3))] text-[11px] uppercase tracking-wider">
                      <th className="text-left py-2.5 px-5 font-semibold">
                        {tDownload('distribution')}
                      </th>
                      <th className="text-left py-2.5 px-5 font-semibold">
                        {group.category === 'apps'
                          ? tDownload('application')
                          : tDownload('variant')}
                      </th>
                      <th className="text-left py-2.5 px-5 font-semibold">{tDownload('type')}</th>
                      <th className="text-left py-2.5 px-5 font-semibold">{tDownload('kernel')}</th>
                      <th className="text-left py-2.5 px-5 font-semibold">{tDownload('size')}</th>
                      <th className="text-right py-2.5 px-5 font-semibold">
                        {tDownload('download')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgb(var(--border)/0.2)]">
                    {group.images.map((img) => (
                      <Fragment key={img.id}>
                        <tr className="hover:bg-[rgb(var(--bg-sub)/0.5)] transition-colors">
                          <td className="py-3 px-5">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={img.os?.family === 'ubuntu' ? '/ubuntu.png' : '/debian.svg'}
                                alt={img.os?.family ?? 'linux'}
                                width={20}
                                height={20}
                                className="w-5 h-5 object-contain shrink-0"
                              />
                              <div className="flex flex-col leading-tight">
                                <span className="font-semibold whitespace-nowrap">
                                  {img.os ? img.os.name : img.distribution}
                                </span>
                                {img.os && (
                                  <span className="text-[10px] uppercase tracking-wider text-[rgb(var(--fg-3))]">
                                    {img.distribution}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-5 text-[rgb(var(--fg-2))]">
                            {img.appMeta ? (
                              <div className="flex items-center gap-2">
                                {img.appMeta.logo && (
                                  <img
                                    src={img.appMeta.logo}
                                    alt={img.appMeta.label}
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 object-contain rounded"
                                  />
                                )}
                                <span>{img.appMeta.label ?? img.application}</span>
                              </div>
                            ) : (
                              img.variantLabel
                            )}
                          </td>
                          <td className="py-3 px-5">
                            <TypeCell img={img} hideAppChip={group.category === 'apps'} />
                          </td>
                          <td className="py-3 px-5">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                              style={{
                                background: `linear-gradient(135deg, ${kernelColor(img.kernel_branch)} 0%, ${kernelColor(img.kernel_branch)}cc 100%)`,
                                boxShadow: `0 2px 6px ${kernelColor(img.kernel_branch)}44`,
                              }}
                            >
                              {img.kernel_branch}
                              <span style={{ opacity: 0.85 }}>{img.kernel_version}</span>
                            </span>
                          </td>
                          <td className="py-3 px-5 text-xs font-medium text-[rgb(var(--fg-2))] tabular-nums whitespace-nowrap">
                            {img.formattedSize}
                          </td>
                          <td className="py-3 px-5">
                            <div className="flex items-center justify-end gap-2.5">
                              <a
                                href={img.download.file_url}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[rgb(var(--brand))] px-3 py-1.5 text-xs font-bold text-white hover:bg-[rgb(var(--brand-hover))] transition-colors shadow-sm"
                              >
                                <Download size={11} strokeWidth={2.5} />
                                {t('direct_download')}
                              </a>
                              <div className="flex items-center gap-1.5">
                                {img.download.sha_url && (
                                  <a
                                    href={img.download.sha_url}
                                    className="text-[10px] font-semibold text-[rgb(var(--fg-3))] hover:text-[rgb(var(--fg))] transition-colors px-1"
                                  >
                                    SHA
                                  </a>
                                )}
                                {img.download.asc_url && (
                                  <a
                                    href={img.download.asc_url}
                                    className="text-[10px] font-semibold text-[rgb(var(--fg-3))] hover:text-[rgb(var(--fg))] transition-colors px-1"
                                  >
                                    ASC
                                  </a>
                                )}
                                {img.download.torrent_url && (
                                  <a
                                    href={img.download.torrent_url}
                                    className="text-[10px] font-semibold text-[rgb(var(--fg-3))] hover:text-[rgb(var(--fg))] transition-colors px-1"
                                  >
                                    {tDownload('torrent')}
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                        <ExtrasStrip img={img} colSpan={6} />
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        ))}

        {/* Rolling Release — same style as other category tables */}
        {formattedRollingGroups.length > 0 &&
          (() => {
            const allRollingImages = formattedRollingGroups.flatMap((g) => g.images);
            const buildDate = allRollingImages[0]?.download.updated_at;
            const rollingColor = '#06b6d4';
            return (
              <ScrollReveal>
                <div className="rounded-2xl border border-[rgb(var(--border)/0.5)] overflow-hidden bg-[rgb(var(--bg-el)/0.3)]">
                  <div
                    className="flex items-center gap-3 px-5 py-4 border-b border-[rgb(var(--border)/0.3)]"
                    style={{ borderLeftWidth: 3, borderLeftColor: rollingColor }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${rollingColor}15` }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={rollingColor}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-bold">{tDownload('rolling_title')}</h3>
                      <p className="text-[11px] text-[rgb(var(--fg-3))]">
                        {tDownload('build_date')}:{' '}
                        {buildDate
                          ? new Date(buildDate).toLocaleDateString(locale, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[rgb(var(--border)/0.3)] text-[11px] uppercase tracking-wider text-[rgb(var(--fg-3))]">
                          <th className="text-left py-2.5 px-5 font-semibold">
                            {tDownload('distribution')}
                          </th>
                          <th className="text-left py-2.5 px-5 font-semibold">
                            {tDownload('variant')}
                          </th>
                          <th className="text-left py-2.5 px-5 font-semibold">
                            {tDownload('type')}
                          </th>
                          <th className="text-left py-2.5 px-5 font-semibold">
                            {tDownload('kernel')}
                          </th>
                          <th className="text-left py-2.5 px-5 font-semibold">
                            {tDownload('size')}
                          </th>
                          <th className="text-right py-2.5 px-5 font-semibold">
                            {tDownload('download')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allRollingImages.map((img) => (
                          <Fragment key={img.id}>
                            <tr className="border-b border-[rgb(var(--border)/0.15)] last:border-0 hover:bg-[rgb(var(--bg-sub))] transition-colors">
                              <td className="py-3 px-5">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={
                                      img.os?.family === 'ubuntu' ? '/ubuntu.png' : '/debian.svg'
                                    }
                                    alt={img.os?.family ?? 'linux'}
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 object-contain shrink-0"
                                  />
                                  <div className="flex flex-col leading-tight">
                                    <span className="font-semibold whitespace-nowrap">
                                      {img.os ? img.os.name : img.distribution}
                                    </span>
                                    {img.os && (
                                      <span className="text-[10px] uppercase tracking-wider text-[rgb(var(--fg-3))]">
                                        {img.distribution}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-5 text-[rgb(var(--fg-2))]">
                                {img.variantLabel}
                              </td>
                              <td className="py-3 px-5">
                                <TypeCell img={img} />
                              </td>
                              <td className="py-3 px-5">
                                <span
                                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                                  style={{
                                    background: `linear-gradient(135deg, ${kernelColor(img.kernel_branch)} 0%, ${kernelColor(img.kernel_branch)}cc 100%)`,
                                  }}
                                >
                                  {img.kernel_branch}{' '}
                                  <span style={{ opacity: 0.85 }}>{img.kernel_version}</span>
                                </span>
                              </td>
                              <td className="py-3 px-5 text-xs font-medium text-[rgb(var(--fg-2))] tabular-nums whitespace-nowrap">
                                {img.formattedSize}
                              </td>
                              <td className="py-3 px-5">
                                <div className="flex items-center justify-end gap-2.5">
                                  <a
                                    href={img.download.file_url}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[rgb(var(--brand))] px-3 py-1.5 text-xs font-bold text-white hover:bg-[rgb(var(--brand-hover))] transition-colors shadow-sm"
                                  >
                                    <Download size={11} strokeWidth={2.5} />
                                    {tDownload('direct_download')}
                                  </a>
                                  <div className="flex items-center gap-1.5">
                                    {img.download.sha_url && (
                                      <a
                                        href={img.download.sha_url}
                                        className="text-[10px] font-semibold text-[rgb(var(--fg-3))] hover:text-[rgb(var(--fg))] transition-colors px-1"
                                      >
                                        SHA
                                      </a>
                                    )}
                                    {img.download.asc_url && (
                                      <a
                                        href={img.download.asc_url}
                                        className="text-[10px] font-semibold text-[rgb(var(--fg-3))] hover:text-[rgb(var(--fg))] transition-colors px-1"
                                      >
                                        ASC
                                      </a>
                                    )}
                                    {img.download.torrent_url && (
                                      <a
                                        href={img.download.torrent_url}
                                        className="text-[10px] font-semibold text-[rgb(var(--fg-3))] hover:text-[rgb(var(--fg))] transition-colors px-1"
                                      >
                                        {tDownload('torrent')}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                            <ExtrasStrip img={img} colSpan={6} />
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ScrollReveal>
            );
          })()}
      </div>
    </section>
  );
}
