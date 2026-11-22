import { Button } from './ui/button';
import { Notice } from './ui/notice';

export function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4">
      <Notice tone="error">{message}</Notice>
      <Button variant="outline" onClick={retry}>
        Tekrar dene
      </Button>
    </div>
  );
}

export function Skeleton({ className = 'h-32' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-surface ${className}`} />;
}
