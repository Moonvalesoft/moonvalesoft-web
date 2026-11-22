import type { ReactNode } from 'react';

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error' | 'success'; children: ReactNode }) {
  const color = tone === 'error' ? 'border-danger text-danger' : tone === 'success' ? 'border-success text-success' : 'border-line-strong text-muted';
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-sm border bg-surface px-4 py-3 text-sm ${color}`}>
      {children}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-line bg-surface p-8 ${className}`}>{children}</div>;
}
