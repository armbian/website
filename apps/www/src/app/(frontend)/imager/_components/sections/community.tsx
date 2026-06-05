import { ArrowRight, MessageCircle, Hash } from 'lucide-react';
import { SiGithub as Github } from '@icons-pack/react-simple-icons';
import type { ReactNode } from 'react';
import { ARMBIAN_URLS } from '@armbian/config';
import { SectionHeading } from '../section-heading';
import { ScrollReveal } from '@/components/scroll-reveal';
import { contributeContent, contributeWays } from '../../_content/community';

interface CommunityCardProps {
  title: string;
  description: string;
  href: string;
  tag: string;
  icon: ReactNode;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  hoverColor: string;
  hoverBorder: string;
}

const cards: CommunityCardProps[] = [
  {
    title: 'GitHub',
    description: 'Browse the source, track issues, and contribute code.',
    href: ARMBIAN_URLS.IMAGER_GITHUB,
    tag: 'Source code',
    icon: <Github size={22} />,
    iconBg: 'bg-white/5',
    iconBorder: 'border-white/10',
    iconColor: 'text-[rgb(var(--fg))]',
    hoverColor: 'group-hover:text-[rgb(var(--brand))]',
    hoverBorder: 'group-hover:bg-[rgb(var(--brand))] group-hover:border-[rgb(var(--brand))]',
  },
  {
    title: 'Forum',
    description: 'Get help, share builds, connect with the community.',
    href: ARMBIAN_URLS.FORUM,
    tag: 'Support',
    icon: <MessageCircle size={22} />,
    iconBg: 'bg-blue-500/10',
    iconBorder: 'border-blue-500/20',
    iconColor: 'text-blue-400',
    hoverColor: 'group-hover:text-blue-400',
    hoverBorder: 'group-hover:bg-blue-500 group-hover:border-blue-500',
  },
  {
    title: 'Discord',
    description: 'Real-time conversations with developers and makers.',
    href: ARMBIAN_URLS.DISCORD,
    tag: 'Live chat',
    icon: <Hash size={22} />,
    iconBg: 'bg-indigo-500/10',
    iconBorder: 'border-indigo-500/20',
    iconColor: 'text-indigo-400',
    hoverColor: 'group-hover:text-indigo-400',
    hoverBorder: 'group-hover:bg-indigo-500 group-hover:border-indigo-500',
  },
];

export function Community() {
  return (
    <section
      id="community"
      className="py-[var(--space-fluid-xl)] bg-[rgb(var(--bg-sub))] border-t border-white/5 relative scroll-mt-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <ScrollReveal>
          <SectionHeading
            label="Community"
            title="Built by makers, for makers"
            subtitle="Connect with developers and makers who run Armbian around the world."
          />
        </ScrollReveal>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <ScrollReveal key={card.title} delay={i * 0.1} distance={40} className="h-full">
              <a
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                className="bento-card rounded-2xl p-6 group relative overflow-hidden h-full flex flex-col"
              >
                <div
                  className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-xl ${card.iconBg} border ${card.iconBorder} mb-5 shadow-inner group-hover:scale-110 transition-transform`}
                >
                  <span className={card.iconColor}>{card.icon}</span>
                </div>

                <div className="relative z-10 mb-2">
                  <h3
                    className={`text-xl font-bold tracking-tight transition-colors ${card.hoverColor}`}
                  >
                    {card.title}
                  </h3>
                </div>

                <p className="relative z-10 mb-5 text-[13px] leading-relaxed text-[rgb(var(--fg-2))]">
                  {card.description}
                </p>

                <div className="relative z-10 mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[rgb(var(--fg-3))] font-mono text-[10px] uppercase tracking-widest font-bold">
                    {card.tag}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all ${card.hoverBorder}`}
                  >
                    <ArrowRight className="h-3 w-3 text-[rgb(var(--fg-3))] group-hover:text-white transition-colors" />
                  </div>
                </div>
              </a>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.4} direction="up" distance={50}>
          <div className="mt-8 feature-card-orange rounded-2xl p-8 sm:p-10 relative group overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[rgb(var(--brand)/0.2)] blur-[80px] rounded-full pointer-events-none transition-transform group-hover:scale-150" />
            <div className="relative z-10 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 text-center sm:text-left">
                <span className="text-[rgb(var(--brand))] font-mono text-xs uppercase tracking-widest font-bold mb-3 block">
                  Contribute
                </span>
                <h3 className="text-2xl font-black tracking-tight mb-2">
                  {contributeContent.title}
                </h3>
                <p className="text-sm leading-relaxed text-[rgb(var(--fg-2))] mb-5 max-w-2xl">
                  {contributeContent.description}
                </p>

                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  {contributeWays.map((way) => (
                    <span
                      key={way.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[rgb(var(--bg-el))] px-3 py-1 text-xs font-medium"
                    >
                      <way.icon className="h-3 w-3 text-[rgb(var(--brand))]" />
                      {way.label}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href={contributeContent.cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group/cta inline-flex shrink-0 items-center gap-2 rounded-md bg-[rgb(var(--brand))] hover:bg-[rgb(var(--brand-hover))] px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgb(var(--brand)/0.3)] transition-all hover:-translate-y-0.5"
              >
                {contributeContent.cta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" />
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
