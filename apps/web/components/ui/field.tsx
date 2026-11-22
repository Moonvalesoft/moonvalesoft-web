import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string | null;
}

export function Field({ label, hint, error, id, className = '', ...input }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const fid = id ?? auto;
  const describedBy = [hint ? `${fid}-hint` : null, error ? `${fid}-error` : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={fid} className="text-sm font-medium text-fg">
        {label}
      </label>
      <input
        id={fid}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-12 rounded-sm border bg-bg px-4 text-fg placeholder:text-subtle ${error ? 'border-danger' : 'border-line-strong'} ${className}`}
        {...input}
      />
      {hint && !error && (
        <p id={`${fid}-hint`} className="text-sm text-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fid}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextArea({ label, error, id, ...input }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={fid} className="text-sm font-medium text-fg">
        {label}
      </label>
      <textarea
        id={fid}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fid}-error` : undefined}
        className={`min-h-36 rounded-sm border bg-bg px-4 py-3 text-fg ${error ? 'border-danger' : 'border-line-strong'}`}
        {...input}
      />
      {error && (
        <p id={`${fid}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
