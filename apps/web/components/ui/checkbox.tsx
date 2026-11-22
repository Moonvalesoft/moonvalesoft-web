import { useId, type ReactNode } from 'react';

/** 44 px dokunma alanı; etiket tıklanabilir. Bağlantılar etiketin içinde olabilir. */
export function Checkbox({
  checked,
  onChange,
  children,
  error,
  required,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  error?: string | null;
  required?: boolean;
  id?: string;
}) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex min-h-11 items-start gap-3">
        <input
          id={fid}
          type="checkbox"
          checked={checked}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-error` : undefined}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-[var(--mv-accent)]"
        />
        <label htmlFor={fid} className="cursor-pointer text-sm text-muted">
          {children}
        </label>
      </div>
      {error && (
        <p id={`${fid}-error`} className="ml-9 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
