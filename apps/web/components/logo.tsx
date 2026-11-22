import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex min-h-11 items-center gap-3 font-heading text-xl font-semibold text-fg no-underline">
      <span aria-hidden="true" className="h-7 w-7 rounded-full bg-moon shadow-[0_0_24px_var(--mv-moon)]" />
      moonvalesoft
    </Link>
  );
}
