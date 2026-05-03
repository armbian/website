'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
}

export class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[SectionErrorBoundary] ${this.props.sectionName ?? 'Section'} error:`,
      error,
      info,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <AlertTriangle className="h-8 w-8 text-[rgb(var(--fg-3))]" />
          <p className="text-sm text-[rgb(var(--fg-3))]">
            Unable to load {this.props.sectionName ?? 'this section'}
          </p>
          <p className="text-xs text-[rgb(var(--fg-3)/0.7)]">Please try refreshing the page</p>
        </div>
      );
    }

    return this.props.children;
  }
}
