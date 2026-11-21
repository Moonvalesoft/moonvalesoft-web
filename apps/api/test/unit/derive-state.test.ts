import { describe, expect, it } from 'vitest';
import { deriveState } from '../../src/billing/webhooks.service';
import { parsePlanPrices } from '../../src/config';

const ev = (event_id: string, type: any, at: string, period_end: string | null = null) => ({
  event_id,
  type,
  occurred_at: new Date(at),
  period_end: period_end ? new Date(period_end) : null,
});

describe('deriveState', () => {
  it('ödeme başarılı → aktif', () => {
    const s = deriveState([ev('a', 'payment.succeeded', '2026-01-01', '2026-02-01')]);
    expect(s).toMatchObject({ orderStatus: 'paid', hasSubscription: true, subStatus: 'active' });
  });

  it('olayların geliş sırası sonucu değiştirmez', () => {
    const a = ev('a', 'payment.succeeded', '2026-01-01', '2026-02-01');
    const b = ev('b', 'subscription.canceled', '2026-01-10');
    expect(deriveState([b, a])).toEqual(deriveState([a, b]));
    expect(deriveState([b, a]).subStatus).toBe('canceled');
  });

  it('başarısız ödemeden sonra yenileme aktif yapar, eski tarihli hata yeniyi ezmez', () => {
    const s = deriveState([
      ev('c', 'subscription.renewed', '2026-02-02', '2026-03-01'),
      ev('a', 'payment.succeeded', '2026-01-01', '2026-02-01'),
      ev('b', 'payment.failed', '2026-02-01'),
    ]);
    expect(s.subStatus).toBe('active');
    expect(s.periodEnd?.toISOString()).toBe(new Date('2026-03-01').toISOString());
  });

  it('iade kalıcıdır', () => {
    const s = deriveState([ev('a', 'payment.succeeded', '2026-01-01'), ev('b', 'payment.refunded', '2026-01-02')]);
    expect(s).toMatchObject({ orderStatus: 'refunded', subStatus: 'canceled' });
  });
});

describe('parsePlanPrices', () => {
  it('geçersiz değerleri atlar', () => {
    expect(parsePlanPrices('randevu-aylik=49900, crm-aylik=abc,emlak-aylik=-5,,x')).toEqual({ 'randevu-aylik': 49900 });
  });
});
