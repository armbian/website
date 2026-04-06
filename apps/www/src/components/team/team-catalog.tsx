'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Pill } from '@/components/ui/pill';
import type { Maintainer } from '@armbian/schemas';
import { SiGithub } from '@icons-pack/react-simple-icons';

interface TeamCatalogProps {
  maintainers: Maintainer[];
  boardNames: Record<string, string>;
}

export function TeamCatalog({ maintainers, boardNames }: TeamCatalogProps) {
  const t = useTranslations('team');
  const [activeTeam, setActiveTeam] = useState('');

  const validBoards = useMemo(() => new Set(Object.keys(boardNames)), [boardNames]);

  // Extract unique teams with counts
  const teams = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of maintainers) {
      if (m.teams.length === 0) {
        map[t('contributors')] = (map[t('contributors')] || 0) + 1;
      } else {
        for (const team of m.teams) {
          map[team] = (map[team] || 0) + 1;
        }
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [maintainers, t]);

  const INACTIVE_THRESHOLD = 365; // days

  // Sort: active first (by days asc), then alphabetical
  const sorted = useMemo(() => {
    return [...maintainers].sort((a, b) => {
      const daysA = a.days_since_last_activity < 0 ? 9999 : a.days_since_last_activity;
      const daysB = b.days_since_last_activity < 0 ? 9999 : b.days_since_last_activity;
      if (daysA !== daysB) return daysA - daysB;
      return a.name.localeCompare(b.name);
    });
  }, [maintainers]);

  // Filter
  const filtered = useMemo(() => {
    let list = sorted;
    if (activeTeam) {
      if (activeTeam === t('contributors')) {
        list = list.filter((m) => m.teams.length === 0);
      } else {
        list = list.filter((m) => m.teams.includes(activeTeam));
      }
    }
    return list;
  }, [sorted, activeTeam, t]);

  // Split active vs inactive
  const active = useMemo(() => filtered.filter((m) => m.days_since_last_activity < INACTIVE_THRESHOLD && m.days_since_last_activity >= 0), [filtered]);
  const inactive = useMemo(() => filtered.filter((m) => m.days_since_last_activity >= INACTIVE_THRESHOLD || m.days_since_last_activity < 0), [filtered]);

  return (
    <div>
      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6">
        <Pill active={!activeTeam} onClick={() => setActiveTeam('')}>
          {t('all')} ({maintainers.length})
        </Pill>
        {teams.map(([team, count]) => (
          <Pill key={team} active={activeTeam === team} onClick={() => setActiveTeam(activeTeam === team ? '' : team)}>
            {team} ({count})
          </Pill>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-[rgb(var(--fg-3))] mb-4 tabular-nums">
        {t('member_count', { count: filtered.length })}
      </p>

      {/* Active members */}
      {active.length > 0 && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {active.map((m, i) => (
            <MemberCard
              key={`${m.name}-${m.github ?? i}`}
              member={m}
              boardNames={boardNames}
              validBoards={validBoards}
              maintainsLabel={t('maintains_boards', { count: m.boards_maintained.filter((s) => validBoards.has(s)).length })}
              t={t}
            />
          ))}
        </div>
      )}

      {/* No results at all */}
      {active.length === 0 && inactive.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-[rgb(var(--fg-3))]">{t('no_results')}</p>
        </div>
      )}

      {/* Inactive members */}
      {inactive.length > 0 && (
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-sm font-bold text-[rgb(var(--fg-3))]">{t('inactive_title')}</h2>
            <div className="flex-1 h-px bg-[rgb(var(--border)/0.2)]" />
            <span className="text-xs text-[rgb(var(--fg-3))] tabular-nums">{inactive.length}</span>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {inactive.map((m, i) => (
              <MemberCard
                key={`inactive-${m.name}-${m.github ?? i}`}
                member={m}
                boardNames={boardNames}
                validBoards={validBoards}
                maintainsLabel={t('maintains_boards', { count: m.boards_maintained.filter((s) => validBoards.has(s)).length })}
                t={t}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MemberCard({ member: m, boardNames, validBoards, maintainsLabel, t }: {
  member: Maintainer;
  boardNames: Record<string, string>;
  validBoards: Set<string>;
  maintainsLabel: string;
  t: ReturnType<typeof useTranslations<'team'>>;
}) {
  const realBoards = m.boards_maintained.filter((s) => validBoards.has(s));
  const [expanded, setExpanded] = useState(false);
  const visibleBoards = expanded ? realBoards : realBoards.slice(0, 3);
  const hasMore = realBoards.length > 3;

  return (
    <div className="group text-center p-4 rounded-xl border border-[rgb(var(--border)/0.4)] hover:border-[rgb(var(--brand)/0.3)] bg-[rgb(var(--bg-el)/0.3)] hover:bg-[rgb(var(--bg-el))] transition-all duration-200">
      {/* Avatar */}
      <div className="mx-auto mb-3">
        {m.avatar?.startsWith('http') ? (
          <img src={m.avatar} alt={m.name} width={72} height={72}
            className="w-[72px] h-[72px] rounded-full mx-auto ring-2 ring-[rgb(var(--border)/0.3)] group-hover:ring-[rgb(var(--brand)/0.4)] transition-all" />
        ) : (
          <div className="w-[72px] h-[72px] rounded-full bg-[rgb(var(--bg-sub))] flex items-center justify-center text-xl font-bold text-[rgb(var(--fg-3))] mx-auto ring-2 ring-[rgb(var(--border)/0.3)]">
            {m.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Name + activity dot */}
      <div className="flex items-center justify-center gap-1.5">
        <p className="text-sm font-bold group-hover:text-[rgb(var(--brand))] transition-colors">{m.name}</p>
        {m.days_since_last_activity >= 0 && (
          <div
            className="w-2 h-2 rounded-full shrink-0"
            title={m.days_since_last_activity === 0 ? t('active_today') : t('last_active_days', { days: m.days_since_last_activity })}
            style={{
              backgroundColor: m.days_since_last_activity <= 30 ? '#10b981'
                : m.days_since_last_activity <= 180 ? '#f59e0b'
                : '#ef4444',
            }}
          />
        )}
      </div>

      {/* GitHub */}
      {m.github && (
        <a href={m.github} target="_blank" rel="noopener noreferrer"
          className="text-[11px] text-[rgb(var(--fg-3))] hover:text-[rgb(var(--brand))] transition-colors inline-flex items-center gap-1 mt-0.5">
          <SiGithub size={12} className="opacity-50" />
          {t('github')}
        </a>
      )}

      {/* Teams */}
      {m.teams.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {m.teams.map((team) => (
            <span key={team} className="rounded-full bg-[rgb(var(--brand)/0.1)] text-[rgb(var(--brand))] px-2 py-0.5 text-[10px] font-semibold">
              {team}
            </span>
          ))}
        </div>
      )}

      {/* Competences */}
      {m.competences.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {m.competences.map((c) => (
            <span key={c} className="rounded-full border border-[rgb(var(--border)/0.5)] px-2 py-0.5 text-[9px] text-[rgb(var(--fg-3))]">
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Boards maintained */}
      {realBoards.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[rgb(var(--border)/0.2)]">
          <p className="text-[10px] text-[rgb(var(--fg-3))] mb-1.5">{maintainsLabel}</p>
          <div className="text-[10px] text-center leading-relaxed">
            {visibleBoards.map((slug, idx, arr) => (
              <span key={slug}>
                <Link href={`/boards/${slug}`}
                  className="text-[rgb(var(--brand))] hover:underline">
                  {boardNames[slug]}
                </Link>
                {idx < arr.length - 1 && (
                  <span className="text-[rgb(var(--fg-3))]">, </span>
                )}
              </span>
            ))}
            {hasMore && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-[10px] font-semibold text-[rgb(var(--brand))] hover:underline ml-1"
              >
                {expanded ? t('show_less') : t('show_more', { count: realBoards.length - 3 })}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
