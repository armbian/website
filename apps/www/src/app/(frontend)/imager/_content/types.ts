import type { LucideIcon } from 'lucide-react';

export interface HeroContent {
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface Step {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface ContributeContent {
  title: string;
  description: string;
  cta: { label: string; href: string };
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  source: string;
}

export interface ContributeWay {
  label: string;
  icon: LucideIcon;
}

export interface SiteMetadata {
  title: string;
  description: string;
  url: string;
  ogImage: string;
}
