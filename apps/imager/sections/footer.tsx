import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { footerSections, socialLinks, footerLicense, footerCopyright } from '@/content/footer';
import { ServiceStatusBadge } from '@/components/service-status';

export function Footer() {
  return (
    <footer className="border-border border-t">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Main footer content */}
        <div className="grid gap-10 py-12 lg:grid-cols-[1fr_2fr] lg:gap-16">
          {/* Brand */}
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <Image
                src="/assets/armbian-icon.png"
                alt="Armbian Imager"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-base font-semibold">Armbian Imager</span>
            </div>
            <p className="text-muted-foreground mb-5 max-w-xs text-[13px] leading-relaxed">
              The open-source imaging tool for Armbian OS. Flash with confidence.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-1">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            <ServiceStatusBadge />
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h4 className="text-muted-foreground mb-3 text-[11px] font-semibold uppercase tracking-wider">
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1 text-sm transition-colors"
                        {...(link.href.startsWith('http')
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                      >
                        {link.label}
                        {link.href.startsWith('http') && (
                          <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-border flex flex-col items-center justify-between gap-2 border-t py-6 text-center sm:flex-row sm:text-left">
          <span className="text-muted-foreground text-xs">{footerCopyright}</span>
          <span className="text-muted-foreground text-xs">{footerLicense}</span>
        </div>
      </div>
    </footer>
  );
}
