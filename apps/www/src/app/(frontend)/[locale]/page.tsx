import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getApiClient } from '@/lib/api.server';
import { ARMBIAN_URLS, formatCompactNumber } from '@armbian/config';
import { SupportBadge } from '@/components/ui/support-badge';
import { BoardImage } from '@/components/board/board-image';
import { TypingHeadline } from '@/components/typing-headline';
import {
  IconDownload,
  IconTerminal,
  IconCode,
  IconDocker,
  IconRepeat,
  IconArrowRight,
  IconGitHub,
  IconForum,
  IconBook,
  IconHome,
  IconStorage,
  IconDesktop,
  IconPrinter,
} from '@/components/ui/icons';
import { BuildTerminal } from '@/components/build-terminal';
import { ScrollReveal, CountUp } from '@/components/scroll-reveal';
import { HeroBoards } from '@/components/hero-boards';
import type { Metadata } from 'next';

interface BlogPost {
  title: string;
  link: string;
  date: string;
  image: string | null;
  excerpt: string;
}

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export const dynamic = 'force-dynamic';

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tHero = await getTranslations('hero');
  const tPhil = await getTranslations('philosophy');
  const tCatalog = await getTranslations('catalog');
  const tBuild = await getTranslations('build');
  const tDeploy = await getTranslations('deploy');
  const tComm = await getTranslations('community');
  const tPartners = await getTranslations('partners');
  const tBlog = await getTranslations('blog');

  const api = await getApiClient();

  const [homeResult, blogResult, statsResult] = await Promise.allSettled([
    api.getHomePage(),
    fetch(ARMBIAN_URLS.BLOG_RSS, { signal: AbortSignal.timeout(5000) }).then((r) => r.text()),
    api.getStats(),
  ]);

  let boards: Awaited<ReturnType<typeof api.getBoards>>['data'] = [];
  let heroBoardPool: Awaited<ReturnType<typeof api.getBoards>>['data'] = [];
  let partners: Awaited<ReturnType<typeof api.getPartners>>['data'] = [];
  if (homeResult.status === 'fulfilled') {
    const { platinum_boards, promoted_boards, partners: p } = homeResult.value.data;
    const platSlugs = new Set(platinum_boards.map((b) => b.slug));
    const others = promoted_boards.filter((b) => !platSlugs.has(b.slug));
    heroBoardPool = [...platinum_boards, ...others];
    boards = platinum_boards.filter((b) => b.image_url).slice(0, 6);
    partners = p;
  }

  let blogPosts: BlogPost[] = [];
  if (blogResult.status === 'fulfilled') {
    const xml = blogResult.value;
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
    blogPosts = items.slice(0, 3).map((item) => {
      const get = (tag: string) =>
        item.match(new RegExp(`<${tag}><!\\[CDATA\\[(.+?)\\]\\]></${tag}>`))?.[1] ??
        item.match(new RegExp(`<${tag}>(.+?)</${tag}>`))?.[1] ??
        '';
      const mediaMatch = item.match(/media:content[^>]+url="([^"]+)"/);
      const descRaw = get('description');
      const excerpt = descRaw
        .replace(/<[^>]+>/g, '')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#\d+;/g, '')
        .slice(0, 140)
        .trim();
      return {
        title: get('title'),
        link: get('link'),
        date: get('pubDate'),
        image: mediaMatch?.[1] ?? null,
        excerpt: excerpt ? excerpt + '...' : '',
      };
    });
  }

  let stats: Awaited<ReturnType<typeof api.getStats>>['data'] = {
    boards: 0,
    images: 0,
    vendors: 0,
    github_stars: null,
    distro_releases: { debian: [], ubuntu: [] },
    sample_image: null,
  };
  if (statsResult.status === 'fulfilled') {
    stats = statsResult.value.data;
  }

  const boardsWithImages = heroBoardPool
    .filter((b) => b.image_url)
    .map((b) => ({
      slug: b.slug,
      name: b.name,
      image_url: b.image_url!,
    }));

  const typingPhrases = tHero('typing_phrases');
  const debianReleases = stats.distro_releases?.debian ?? [];
  const ubuntuReleases = stats.distro_releases?.ubuntu ?? [];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden pt-24 sm:pt-28 lg:pt-36 pb-[var(--space-fluid-lg)]">
        <div className="hidden sm:block absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[rgb(var(--brand))] blur-[150px] opacity-20 pointer-events-none" />
        <div className="hidden sm:block absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[150px] opacity-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          <div className="lg:col-span-6 relative z-20">
            <ScrollReveal direction="left" duration={0.8}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-[rgb(var(--brand)/0.3)] bg-[rgb(var(--brand)/0.1)] text-[rgb(var(--brand))] text-xs font-mono font-bold mb-8 uppercase tracking-widest backdrop-blur-sm shadow-[0_0_15px_rgb(var(--brand)/0.1)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--brand))] animate-pulse" />
                {tHero('badge')}
              </div>

              <h1 className="text-fluid-hero font-extrabold tracking-tighter leading-[1.05] mb-[var(--space-fluid-sm)] drop-shadow-2xl">
                {tHero('typing_prefix')}
                <br />
                <TypingHeadline phrases={typingPhrases.split(',')} />
              </h1>

              <p className="text-fluid-lg text-[rgb(var(--fg-2))] max-w-xl font-medium leading-relaxed mb-[var(--space-fluid-lg)]">
                {tHero('subtitle')}
              </p>

              <div className="flex items-center gap-5 sm:gap-8 md:gap-12 p-3 sm:p-5 rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-md max-w-fit">
                <div>
                  <span className="block font-black tracking-tight text-fluid-2xl">
                    <CountUp value={stats.boards} suffix="+" />
                  </span>
                  <span className="text-[rgb(var(--fg-3))] uppercase tracking-widest text-[10px] font-bold mt-1 block">
                    {tHero('stat_boards')}
                  </span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <span className="block font-black tracking-tight text-fluid-2xl">
                    <CountUp value={stats.vendors} suffix="+" />
                  </span>
                  <span className="text-[rgb(var(--fg-3))] uppercase tracking-widest text-[10px] font-bold mt-1 block">
                    {tHero('stat_vendors')}
                  </span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <span className="block font-black tracking-tight text-fluid-2xl">
                    <CountUp value={100} suffix="%" />
                  </span>
                  <span className="text-[rgb(var(--fg-3))] uppercase tracking-widest text-[10px] font-bold mt-1 block">
                    {tHero('stat_opensource')}
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {boardsWithImages.length >= 3 && (
            <ScrollReveal direction="right" delay={0.2} duration={0.8} className="lg:col-span-6">
              <HeroBoards boards={boardsWithImages} />
            </ScrollReveal>
          )}
        </div>
      </section>

      <div className="divider-glow w-full pointer-events-none" />

      {/* WHAT IS ARMBIAN */}
      <section
        id="why-armbian"
        className="py-[var(--space-fluid-xl)] bg-[rgb(var(--bg-sub))] relative scroll-mt-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="mb-16 flex flex-col items-center text-center">
              <span className="text-[rgb(var(--brand))] font-mono text-sm tracking-widest uppercase font-bold mb-4">
                {tPhil('label')}
              </span>
              <h2 className="text-fluid-3xl font-black tracking-tight mb-[var(--space-fluid-sm)]">
                {tPhil('title')}
              </h2>
              <p className="text-[rgb(var(--fg-2))] max-w-2xl text-lg font-medium leading-relaxed">
                {tPhil('subtitle')}
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <ScrollReveal delay={0} className="phil-card h-full">
              <div className="bento-card rounded-2xl p-7 flex flex-col group relative overflow-hidden h-full">
                <div className="relative z-10">
                  <span className="text-[rgb(var(--brand))] font-mono text-xs uppercase tracking-widest font-bold mb-3 block">
                    {tPhil('base_label')}
                  </span>
                  <h3 className="text-xl font-bold mb-2 tracking-tight">{tPhil('base_title')}</h3>
                  <p className="text-[rgb(var(--fg-2))] text-[13px] leading-relaxed">
                    {tPhil('base_description')}
                  </p>
                </div>
                <div className="relative z-10 grid grid-cols-2 gap-2.5 mt-auto pt-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--bg))] border border-white/[0.06]">
                    <img src="/debian.svg" alt="Debian" width={32} height={32} />
                    <div>
                      <span className="text-sm font-bold block">Debian</span>
                      <span className="text-[10px] text-[rgb(var(--fg-3))] capitalize">
                        {debianReleases.length > 0 ? debianReleases.join(' / ') : '--'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--bg))] border border-white/[0.06]">
                    <img src="/ubuntu.png" alt="Ubuntu" width={32} height={32} />
                    <div>
                      <span className="text-sm font-bold block">Ubuntu</span>
                      <span className="text-[10px] text-[rgb(var(--fg-3))] capitalize">
                        {ubuntuReleases.length > 0 ? ubuntuReleases.join(' / ') : '--'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.12} className="phil-card h-full">
              <div className="bento-card rounded-2xl p-7 flex flex-col group relative overflow-hidden h-full">
                <div className="relative z-10">
                  <span className="text-[rgb(var(--brand))] font-mono text-xs uppercase tracking-widest font-bold mb-3 block">
                    {tPhil('kernels_label')}
                  </span>
                  <h3 className="text-xl font-bold mb-2 tracking-tight">
                    {tPhil('kernels_title')}
                  </h3>
                  <p className="text-[rgb(var(--fg-2))] text-[13px] leading-relaxed">
                    {tPhil('kernels_description')}
                  </p>
                </div>
                <div className="relative z-10 mt-auto pt-4 bg-black/60 p-4 rounded-lg border border-white/10 font-mono text-[11px] leading-relaxed shadow-lg overflow-hidden group-hover:border-[rgb(var(--brand)/0.3)] transition-colors">
                  <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-white/10">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                    <div className="w-2 h-2 rounded-full bg-green-500/50" />
                    <span className="text-gray-500 ml-2 text-[9px]">root@armbian</span>
                  </div>
                  <div className="text-[rgb(var(--brand))]">
                    $ <span className="text-gray-200">uname -a</span>
                  </div>
                  <div className="text-gray-400 mt-1">
                    Linux armbian{' '}
                    {stats.sample_image
                      ? `${stats.sample_image.kernel_version}-${stats.sample_image.kernel_branch}-rockchip64`
                      : '6.18.21-current-rockchip64'}{' '}
                    #1 SMP PREEMPT...
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.24} className="phil-card h-full">
              <div className="bento-card rounded-2xl p-7 flex flex-col group h-full">
                <div className="relative z-10">
                  <span className="text-[rgb(var(--brand))] font-mono text-xs uppercase tracking-widest font-bold mb-3 block">
                    {tPhil('ecosystem_label')}
                  </span>
                  <h3 className="text-xl font-bold tracking-tight mb-2">
                    {tPhil('ecosystem_title')}
                  </h3>
                  <p className="text-[rgb(var(--fg-2))] text-[13px] leading-relaxed">
                    {tPhil('ecosystem_description')}
                  </p>
                </div>
                <div className="relative z-10 grid grid-cols-2 gap-2 mt-auto pt-4 w-full">
                  {[
                    {
                      icon: <IconHome size={16} />,
                      label: tPhil('usecase_home'),
                      color: 'text-blue-400',
                    },
                    {
                      icon: <IconStorage size={16} />,
                      label: tPhil('usecase_nas'),
                      color: 'text-purple-400',
                    },
                    {
                      icon: <IconPrinter size={16} />,
                      label: tPhil('usecase_print'),
                      color: 'text-green-400',
                    },
                    {
                      icon: <IconDesktop size={16} />,
                      label: tPhil('usecase_desktop'),
                      color: 'text-yellow-500',
                    },
                  ].map((uc) => (
                    <div
                      key={uc.label}
                      className="bg-[rgb(var(--bg-el))] border border-white/5 p-2.5 rounded-lg flex items-center gap-2.5 hover:bg-[rgb(var(--bg-sub))] transition-colors"
                    >
                      <span className={uc.color}>{uc.icon}</span>
                      <span className="text-[13px] font-medium">{uc.label}</span>
                    </div>
                  ))}
                  <div className="col-span-2 bg-gradient-to-r from-[rgb(var(--brand)/0.1)] to-transparent border border-[rgb(var(--brand)/0.2)] p-2.5 rounded-lg flex items-center justify-center gap-2.5">
                    <IconCode size={18} className="text-[rgb(var(--brand))]" />
                    <span className="text-sm font-bold text-[rgb(var(--brand))]">
                      {tPhil('usecase_dev')}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* HARDWARE CATALOG */}
      {boards.length > 0 && (
        <section className="py-24 relative border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <ScrollReveal>
              <div className="mb-16">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-4">
                  <h2 className="text-fluid-3xl font-black tracking-tight drop-shadow-md">
                    {tCatalog('title')}
                  </h2>
                  <Link
                    href="/boards"
                    className="shrink-0 px-6 py-3.5 rounded-md bg-[rgb(var(--fg))] text-[rgb(var(--bg))] font-bold hover:opacity-80 transition-all flex items-center gap-2 hover:-translate-y-1"
                  >
                    {tCatalog('view_all')}
                    <IconArrowRight size={14} />
                  </Link>
                </div>
                <p className="text-[rgb(var(--fg-2))] text-lg font-medium max-w-2xl">
                  {tCatalog('subtitle')}
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boards
                .filter((b) => b.image_url)
                .slice(0, 6)
                .map((board, i) => (
                  <ScrollReveal
                    key={board.slug}
                    delay={i * 0.1}
                    distance={50}
                    once
                    className="h-full"
                  >
                    <Link
                      href={`/boards/${board.slug}`}
                      className="hw-card rounded-2xl p-6 group block relative overflow-hidden flex flex-col h-full"
                    >
                      <div className="absolute top-5 right-5 z-20">
                        <SupportBadge tier={board.support_tier} />
                      </div>
                      <div className="h-56 w-full flex items-center justify-center relative mb-4 z-10 p-4">
                        <div className="absolute inset-0 bg-white/[0.03] rounded-xl group-hover:bg-[rgb(var(--brand)/0.05)] transition-colors border border-white/5 group-hover:border-[rgb(var(--brand)/0.2)]" />
                        <BoardImage
                          src={board.image_url}
                          alt={board.name}
                          width={272}
                          height={224}
                          className="hw-img h-full w-auto object-contain relative z-10 transition-all duration-500 drop-shadow-xl"
                        />
                      </div>
                      <div className="mt-auto border-t border-white/10 pt-5 z-10 flex items-end justify-between gap-4">
                        <div>
                          <span className="text-[11px] text-[rgb(var(--brand))] font-mono font-bold uppercase tracking-widest mb-1 block">
                            {(board.vendor_name ?? '').split('(')[0]?.trim() ?? board.vendor_name}
                          </span>
                          <h3 className="text-2xl font-bold group-hover:text-[rgb(var(--brand))] transition-colors tracking-tight">
                            {board.name}
                          </h3>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-[rgb(var(--brand))] group-hover:border-[rgb(var(--brand))] transition-all">
                          <IconArrowRight
                            size={14}
                            className="text-[rgb(var(--fg-3))] group-hover:text-white transition-colors"
                          />
                        </div>
                      </div>
                    </Link>
                  </ScrollReveal>
                ))}
            </div>
          </div>
        </section>
      )}

      <div className="divider-glow w-full pointer-events-none" />

      {/* BUILD FRAMEWORK */}
      <section className="py-[var(--space-fluid-xl)] bg-[rgb(var(--bg-sub))] border-b border-white/5 relative overflow-hidden">
        <div
          className="absolute top-1/2 left-1/4 w-[600px] h-[600px] -translate-y-1/2 -translate-x-1/2 rounded-full bg-[rgb(var(--brand)/0.1)] blur-[120px] pointer-events-none"
          style={{ animation: 'glow-drift-1 15s ease-in-out infinite' }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            <ScrollReveal
              direction="left"
              duration={0.8}
              distance={80}
              className="lg:col-span-6 order-2 lg:order-1"
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-tr from-[rgb(var(--brand)/0.3)] to-purple-500/30 rounded-xl blur-lg opacity-40 group-hover:opacity-70 transition duration-1000 z-0" />
                <div className="relative z-10">
                  <BuildTerminal />
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" className="lg:col-span-6 order-1 lg:order-2">
              <div className="px-4 lg:pl-10">
                <span className="inline-flex items-center gap-2 text-[rgb(var(--brand))] font-mono text-sm uppercase tracking-widest font-bold mb-4 bg-[rgb(var(--brand)/0.1)] px-3 py-1 rounded">
                  <IconTerminal size={16} /> {tBuild('label')}
                </span>
                <h2 className="text-fluid-3xl font-black tracking-tight mb-[var(--space-fluid-sm)]">
                  {tBuild('title_1')}
                  <br />
                  <span className="text-gradient bg-gradient-to-r from-orange-300 to-[rgb(var(--brand))]">
                    {tBuild('title_2')}
                  </span>
                </h2>
                <p className="text-[rgb(var(--fg-2))] text-lg mb-8 font-medium leading-relaxed">
                  {tBuild('description')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-5">
                  {[
                    { key: '1', icon: <IconCode size={16} /> },
                    { key: '2', icon: <IconTerminal size={16} /> },
                    { key: '3', icon: <IconRepeat size={16} /> },
                    { key: '4', icon: <IconDocker size={16} /> },
                  ].map((f, i) => (
                    <ScrollReveal
                      key={f.key}
                      direction="right"
                      delay={0.1 + i * 0.1}
                      distance={40}
                      className="flex gap-3 items-start"
                    >
                      <div className="w-8 h-8 rounded-md bg-[rgb(var(--bg-el))] border border-white/10 flex items-center justify-center shrink-0 text-[rgb(var(--brand))]">
                        {f.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{tBuild(`feature_${f.key}_title`)}</h4>
                        <p className="text-[rgb(var(--fg-3))] text-xs leading-relaxed mt-0.5">
                          {tBuild(`feature_${f.key}_desc`)}
                        </p>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* GET STARTED */}
      <section className="py-[var(--space-fluid-xl)] relative z-20 border-b border-[rgb(var(--border))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-fluid-3xl font-black tracking-tight mb-[var(--space-fluid-sm)]">
                {tDeploy('title')}
              </h2>
              <p className="text-[rgb(var(--fg-2))] text-lg font-medium">{tDeploy('subtitle')}</p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-6">
            <ScrollReveal delay={0.1} className="deploy-card min-w-0 h-full">
              <div className="feature-card-orange rounded-2xl p-7 relative group overflow-hidden block shadow-2xl h-full">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[rgb(var(--brand)/0.2)] blur-[80px] rounded-full pointer-events-none transition-transform group-hover:scale-150" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-5">
                    <img
                      src="/armbian-imager-icon.png"
                      alt="Armbian Imager"
                      width={64}
                      height={64}
                      className="rounded-2xl shadow-[0_0_20px_rgb(var(--brand)/0.4)]"
                    />
                    <span className="px-3 py-1 bg-[rgb(var(--brand)/0.2)] text-[rgb(var(--brand))] text-xs font-bold uppercase tracking-widest rounded border border-[rgb(var(--brand)/0.3)]">
                      {tDeploy('imager_badge')}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black mb-2 tracking-tight">
                    {tDeploy('imager_title')}
                  </h3>
                  <p className="text-[rgb(var(--fg-2))] mb-6 text-sm leading-relaxed">
                    {tDeploy('imager_description')}
                  </p>
                  <div className="grid grid-cols-3 gap-3 mt-auto mb-5 flex-1 items-end">
                    {[
                      { icon: '/os-windows.svg', label: 'Windows' },
                      { icon: '/os-macos.svg', label: 'macOS' },
                      { icon: '/os-linux.svg', label: 'Linux' },
                    ].map((os) => (
                      <div
                        key={os.label}
                        className="flex flex-col items-center justify-center gap-3 py-5 rounded-xl bg-white/[0.03] border border-white/[0.06] dark:bg-white/[0.03] bg-[rgb(var(--bg-sub))]"
                      >
                        <img
                          src={os.icon}
                          alt={os.label}
                          className="w-8 h-8 opacity-60 os-icon-invert"
                        />
                        <span className="text-[11px] text-[rgb(var(--fg-3))] font-semibold uppercase tracking-wider">
                          {os.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <a
                    href={ARMBIAN_URLS.IMAGER}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[rgb(var(--brand))] hover:bg-[rgb(var(--brand-hover))] text-white text-center font-bold py-3.5 rounded-lg text-sm shadow-[0_0_30px_rgb(var(--brand)/0.3)] transition-colors flex items-center justify-center gap-2 hover:-translate-y-0.5"
                  >
                    <IconDownload size={16} />
                    {tDeploy('imager_cta')}
                  </a>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.25} className="deploy-card min-w-0 h-full">
              <div className="feature-card-dark rounded-2xl p-7 relative group overflow-hidden block h-full">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-5">
                    <Link
                      href="/boards"
                      className="w-16 h-16 bg-[rgb(var(--bg-el))] border border-white/10 text-[rgb(var(--fg-2))] hover:text-[rgb(var(--brand))] hover:border-[rgb(var(--brand)/0.3)] rounded-2xl flex items-center justify-center shadow-inner transition-colors"
                    >
                      <IconDownload size={28} />
                    </Link>
                    <span className="px-3 py-1 border border-white/10 text-[rgb(var(--fg-3))] text-xs font-bold uppercase tracking-widest rounded bg-[rgb(var(--bg-el))]">
                      {tDeploy('manual_badge')}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black mb-2 tracking-tight">
                    {tDeploy('manual_title')}
                  </h3>
                  <p className="text-[rgb(var(--fg-2))] mb-5 text-sm leading-relaxed">
                    {tDeploy('manual_description')}
                  </p>
                  {(() => {
                    const s = stats.sample_image;
                    const redir =
                      s?.file_url ?? 'https://dl.armbian.com/nanopi-r6s/Noble_current_minimal';
                    const fileName = redir.split('/').pop() ?? 'Armbian_image.img.xz';
                    return (
                      <div className="bg-[rgb(20_20_24)] border border-white/10 rounded-xl p-4 mb-8 font-mono text-[11px] leading-[1.7] overflow-x-auto">
                        <div className="text-gray-400">
                          <span className="text-emerald-400">$</span> wget {redir}
                        </div>
                        <div className="text-gray-400 mt-1">
                          <span className="text-emerald-400">$</span> wget {redir}.sha
                        </div>
                        <div className="text-gray-400 mt-1">
                          <span className="text-emerald-400">$</span> sha256sum -c *.sha
                        </div>
                        <div className="text-emerald-400/80 mt-1">
                          {fileName}: <span className="text-emerald-400 font-bold">OK</span>
                        </div>
                        <div className="text-gray-400 mt-1">
                          <span className="text-emerald-400">$</span> xzcat *.img.xz | sudo dd
                          of=/dev/mmcblk0 bs=1M status=progress
                        </div>
                      </div>
                    );
                  })()}
                  <div className="mt-auto">
                    <Link
                      href="/boards"
                      className="w-full bg-[rgb(var(--bg-el))] hover:bg-[rgb(var(--bg-sub))] border border-white/10 hover:border-white/30 rounded-lg py-4 flex items-center justify-center gap-3 font-bold transition-all hover:-translate-y-0.5"
                    >
                      {tDeploy('manual_cta')}
                      <IconArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="py-[var(--space-fluid-xl)] bg-[rgb(var(--bg-sub))] border-b border-[rgb(var(--border))] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-16 items-center">
            <ScrollReveal direction="left" className="lg:col-span-4">
              <div>
                <span className="text-[rgb(var(--brand))] font-mono text-sm tracking-widest uppercase font-bold mb-4 block">
                  {tComm('label')}
                </span>
                <h2 className="text-fluid-3xl font-black tracking-tight leading-none drop-shadow-md mb-[var(--space-fluid-sm)]">
                  {tComm('title')}
                </h2>
                <p className="text-[rgb(var(--fg-2))] text-lg mb-8 font-medium leading-relaxed">
                  {tComm('subtitle')}
                </p>
                <a
                  href={ARMBIAN_URLS.CONTRIBUTE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[rgb(var(--bg-el))] border border-white/10 font-bold hover:bg-[rgb(var(--bg))] hover:border-white/20 transition-all shadow-sm"
                >
                  <IconCode size={16} /> {tComm('contribute')}
                </a>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" className="lg:col-span-8">
              <div className="grid sm:grid-cols-2 gap-4 h-full">
                <a
                  href={ARMBIAN_URLS.FORUM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bento-card p-8 rounded-2xl flex flex-col group h-full"
                >
                  <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                    <IconForum size={24} className="text-blue-400 group-hover:text-blue-300" />
                  </div>
                  <h4 className="text-2xl font-bold mb-3 tracking-tight group-hover:text-blue-400 transition-colors">
                    {tComm('forums_title')}
                  </h4>
                  <p className="text-[rgb(var(--fg-2))] text-sm leading-relaxed mb-6 flex-grow">
                    {tComm('forums_description')}
                  </p>
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                    <span className="text-[rgb(var(--fg-3))] font-mono text-xs uppercase tracking-widest font-bold">
                      {tComm('forums_topics')}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:border-blue-500 transition-all">
                      <IconArrowRight
                        size={12}
                        className="text-[rgb(var(--fg-3))] group-hover:text-white transition-colors"
                      />
                    </div>
                  </div>
                </a>

                <div className="flex flex-col gap-4 h-full">
                  <a
                    href={ARMBIAN_URLS.GITHUB_ORG}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bento-card p-6 flex-1 rounded-2xl flex flex-col group justify-between"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <IconGitHub size={24} />
                      </div>
                      <span className="bg-[rgb(var(--bg-el))] border border-white/5 px-2 py-1 rounded text-xs font-mono font-bold text-[rgb(var(--fg-2))]">
                        {stats.github_stars
                          ? tComm('github_stars', {
                              count: formatCompactNumber(stats.github_stars),
                            })
                          : tComm('github_stars_empty')}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <h4 className="text-xl font-bold mb-2 tracking-tight group-hover:text-[rgb(var(--brand))] transition-colors">
                          {tComm('github_title')}
                        </h4>
                        <p className="text-[rgb(var(--fg-2))] text-sm">
                          {tComm('github_description')}
                        </p>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 ml-3 group-hover:bg-[rgb(var(--brand))] group-hover:border-[rgb(var(--brand))] transition-all">
                        <IconArrowRight
                          size={12}
                          className="text-[rgb(var(--fg-3))] group-hover:text-white transition-colors"
                        />
                      </div>
                    </div>
                  </a>

                  <a
                    href={ARMBIAN_URLS.DOCS}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bento-card p-6 flex-1 rounded-2xl flex flex-col group justify-between"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                        <IconBook size={24} className="text-green-400" />
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <h4 className="text-xl font-bold mb-2 tracking-tight group-hover:text-green-400 transition-colors">
                          {tComm('docs_title')}
                        </h4>
                        <p className="text-[rgb(var(--fg-2))] text-sm">
                          {tComm('docs_description')}
                        </p>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 ml-3 group-hover:bg-green-500 group-hover:border-green-500 transition-all">
                        <IconArrowRight
                          size={12}
                          className="text-[rgb(var(--fg-3))] group-hover:text-white transition-colors"
                        />
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* LATEST NEWS */}
      {blogPosts.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <ScrollReveal>
              <div className="flex items-baseline justify-between mb-8">
                <h2 className="text-fluid-2xl font-black tracking-tight">{tBlog('title')}</h2>
                <a
                  href={ARMBIAN_URLS.BLOG}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[rgb(var(--fg-3))] hover:text-[rgb(var(--brand))] transition-colors flex items-center gap-1.5 group"
                >
                  {tBlog('view_all')}
                  <IconArrowRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </a>
              </div>
            </ScrollReveal>

            <ScrollReveal className="grid md:grid-cols-3 gap-4">
              {blogPosts.map((post) => (
                <div key={post.link} className="blog-card">
                  <a
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col justify-between p-5 rounded-xl border border-white/[0.06] bg-[rgb(var(--bg-el))] hover:border-[rgb(var(--brand)/0.25)] transition-all duration-300 hover:-translate-y-1 h-full"
                  >
                    <div>
                      <time className="text-[10px] font-mono font-medium uppercase tracking-widest text-[rgb(var(--fg-3))]">
                        {(() => {
                          try {
                            return new Date(post.date).toLocaleDateString(locale, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            });
                          } catch {
                            return post.date;
                          }
                        })()}
                      </time>
                      <h3 className="text-sm font-bold leading-snug tracking-tight mt-2 mb-2 group-hover:text-[rgb(var(--brand))] transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-[rgb(var(--fg-3))] leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-[rgb(var(--brand))] opacity-0 group-hover:opacity-100 transition-opacity">
                      {tBlog('read_more')} <IconArrowRight size={11} />
                    </span>
                  </a>
                </div>
              ))}
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* PARTNERS MARQUEE */}
      {partners.length > 0 && (
        <section className="bg-[rgb(var(--bg-sub))] border-y border-white/5 py-12 relative overflow-hidden">
          <div className="absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-[rgb(var(--bg-sub))] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-[rgb(var(--bg-sub))] to-transparent z-10 pointer-events-none" />
          <ScrollReveal>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-hidden">
              <p className="text-[rgb(var(--brand))] font-mono text-sm tracking-widest uppercase font-bold mb-6 text-center">
                {tPartners('label')}
              </p>
              <div className="marquee-container w-full py-2">
                <div className="marquee-content flex gap-12 items-center">
                  {[...partners, ...partners].map((p, i) => {
                    const label = (p.name ?? '').split('(')[0]?.trim() ?? p.name ?? '';
                    const logoUrl = p.logo_url
                      ? p.logo_url.replace('-border.png', '.png').replace('/150/', '/1920/')
                      : null;
                    return (
                      <a
                        key={`${label}-${i}`}
                        href={p.website ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={label}
                        className="shrink-0 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-3 shadow-md transition-transform hover:scale-105"
                      >
                        {logoUrl ? (
                          <img src={logoUrl} alt={label} className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">{label.charAt(0)}</span>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      )}
    </>
  );
}
