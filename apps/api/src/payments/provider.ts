import { createHmac, timingSafeEqual } from 'node:crypto';

export type PaymentEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'subscription.renewed'
  | 'subscription.canceled'
  | 'payment.refunded';

export const PAYMENT_EVENT_TYPES: PaymentEventType[] = [
  'payment.succeeded',
  'payment.failed',
  'subscription.renewed',
  'subscription.canceled',
  'payment.refunded',
];

/** Sağlayıcıdan bağımsız iç olay biçimi (docs/api.md). */
export interface PaymentEvent {
  eventId: string;
  type: PaymentEventType;
  orderId: string;
  occurredAt: string;
  amountKurus?: number;
  periodEnd?: string;
}

export interface CheckoutRequest {
  orderId: string;
  amountKurus: number;
  planId: string;
  customerEmail: string;
}

/**
 * Bütün ödeme kodu bu arayüzün arkasındadır. Gerçek sağlayıcı (Lemon Squeezy, Paddle, iyzico, PayTR…)
 * seçildiğinde yalnızca bu arayüzü uygulayan yeni bir adaptör yazılır.
 */
export interface PaymentProvider {
  readonly name: string;
  /** Kart bilgisi bizden geçmez: sağlayıcının ödeme sayfasının adresini döner. */
  createCheckout(req: CheckoutRequest): Promise<{ checkoutUrl: string }>;
  /** İmzayı doğrular ve iç olaya çevirir. İmza geçersizse null. */
  parseWebhook(rawBody: string, headers: Record<string, string | string[] | undefined>): PaymentEvent | null;
  /** Aboneliği dönem sonunda iptal ettirir. */
  cancelSubscription(orderId: string): Promise<void>;
}

/**
 * Test sağlayıcısı: geliştirme ve testlerde kullanılır, üretimde config buna izin vermez.
 * Webhook imzası: X-Signature = hex(HMAC-SHA256(secret, rawBody)).
 */
export class FakePaymentProvider implements PaymentProvider {
  readonly name = 'fake';
  readonly cancelRequests: string[] = [];

  constructor(
    private readonly secret: string,
    private readonly webOrigin: string,
  ) {}

  async createCheckout(req: CheckoutRequest) {
    return { checkoutUrl: `${this.webOrigin}/test-odeme/${encodeURIComponent(req.orderId)}` };
  }

  signature(rawBody: string): string {
    return createHmac('sha256', this.secret).update(rawBody).digest('hex');
  }

  sign(event: PaymentEvent): { body: string; headers: Record<string, string> } {
    const body = JSON.stringify(event);
    return { body, headers: { 'content-type': 'application/json', 'x-signature': this.signature(body) } };
  }

  parseWebhook(rawBody: string, headers: Record<string, string | string[] | undefined>): PaymentEvent | null {
    const given = headers['x-signature'];
    if (typeof given !== 'string' || !/^[0-9a-f]{64}$/.test(given)) return null;
    const expected = Buffer.from(this.signature(rawBody), 'hex');
    const actual = Buffer.from(given, 'hex');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    let data: unknown;
    try {
      data = JSON.parse(rawBody);
    } catch {
      return null;
    }
    return toPaymentEvent(data);
  }

  async cancelSubscription(orderId: string) {
    this.cancelRequests.push(orderId);
  }
}

function toPaymentEvent(data: unknown): PaymentEvent | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  if (typeof d.eventId !== 'string' || !d.eventId || d.eventId.length > 200) return null;
  if (typeof d.type !== 'string' || !PAYMENT_EVENT_TYPES.includes(d.type as PaymentEventType)) return null;
  if (typeof d.orderId !== 'string' || !d.orderId || d.orderId.length > 200) return null;
  if (typeof d.occurredAt !== 'string' || Number.isNaN(Date.parse(d.occurredAt))) return null;
  if (d.amountKurus !== undefined && !Number.isSafeInteger(d.amountKurus)) return null;
  if (d.periodEnd !== undefined && (typeof d.periodEnd !== 'string' || Number.isNaN(Date.parse(d.periodEnd)))) return null;
  return {
    eventId: d.eventId,
    type: d.type as PaymentEventType,
    orderId: d.orderId,
    occurredAt: d.occurredAt,
    amountKurus: d.amountKurus as number | undefined,
    periodEnd: d.periodEnd as string | undefined,
  };
}
