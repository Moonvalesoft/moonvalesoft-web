import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

const base =
  'inline-flex whitespace-nowrap min-h-11 items-center justify-center gap-2 rounded-md px-6 py-3 font-semibold no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-60';
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:opacity-90',
  secondary: 'bg-secondary text-on-secondary hover:opacity-90',
  outline: 'border border-line-strong text-fg hover:bg-surface',
  ghost: 'text-fg hover:bg-surface',
  danger: 'border border-danger text-danger hover:bg-surface',
};

export function buttonClass(variant: Variant = 'primary', extra = '') {
  return `${base} ${variants[variant]} ${extra}`;
}

export function Button({ variant = 'primary', className = '', ...props }: ComponentProps<'button'> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({ href, variant = 'primary', className = '', children }: { href: string; variant?: Variant; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}
