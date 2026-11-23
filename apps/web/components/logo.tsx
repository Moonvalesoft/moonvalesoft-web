import { Mark } from './mark';

export function Logo() {
  return (
    <a href="/" className="flex min-h-11 items-center gap-3 font-heading text-xl font-semibold text-fg no-underline">
      <Mark size={38} />
      moonvalesoft
    </a>
  );
}
