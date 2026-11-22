import type { AppDeps } from '../deps';

/**
 * Metodu sistem bağlamında çalıştırır (RLS: `app.system = on`). Yalnız kimse adına olmayan işler için:
 * giriş/kayıt, ödeme bildirimi, zamanlanmış işler. Sınıfın `deps` alanı olmalı.
 */
export function SystemScope(): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: unknown[]) => Promise<unknown>;
    descriptor.value = function (this: { deps: AppDeps }, ...args: unknown[]) {
      return this.deps.db.asSystem(() => original.apply(this, args));
    };
    return descriptor;
  };
}
