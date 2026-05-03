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
          <AlertTriangle className="text-muted-foreground h-8 w-8" />
          <p className="text-muted-foreground text-sm">
            Unable to load {this.props.sectionName ?? 'this section'}
          </p>
          <p className="text-muted-foreground/70 text-xs">Please try refreshing the page</p>
        </div>
      );
    }

    return this.props.children;
  }
}
