import { Logger } from '@nestjs/common';

export interface CreateTenantInput {
  /** Tekrar denemede aynı firmanın iki kez açılmaması için anahtar (Randevu aynı anahtara 200 döner). */
  subscriptionId: string;
  slug: string;
  companyName: string;
  ownerEmail: string;
  ownerName: string;
  seats: number;
}

/** Moonvale Randevu'da firma açar ve dondurur. */
export interface RandevuProvisioner {
  createTenant(input: CreateTenantInput): Promise<void>;
  freezeTenant(input: { slug: string }): Promise<void>;
}

/** Randevu API'sine HTTP ile gider. Uç noktalar Randevu tarafında yazılacak (teyit edilecek). */
export class HttpRandevuProvisioner implements RandevuProvisioner {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
  ) {}

  private async post(path: string, body: unknown, idempotencyKey: string) {
    return fetch(new URL(path, this.baseUrl), {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.apiKey}`, 'idempotency-key': idempotencyKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
  }

  /**
   * Sözleşme (Randevu tarafında yazılacak): aynı `Idempotency-Key` ile tekrar gelen istek 200 döner.
   * 409 = adres başka bir aboneliğe ait; bu bir hatadır, başarılı sayılmaz.
   */
  async createTenant(input: CreateTenantInput) {
    const res = await this.post('/internal/tenants', input, `create:${input.subscriptionId}`);
    if (!res.ok) throw new Error(`Randevu API firma açma: HTTP ${res.status}${res.status === 409 ? ' (adres başka bir aboneliğe ait)' : ''}`);
  }

  /** Zaten dondurulmuşsa 409 başarılı sayılır. */
  async freezeTenant(input: { slug: string }) {
    const res = await this.post(`/internal/tenants/${encodeURIComponent(input.slug)}/freeze`, {}, `freeze:${input.slug}`);
    if (!res.ok && res.status !== 409) throw new Error(`Randevu API dondurma: HTTP ${res.status}`);
  }
}

/** Randevu API adresi tanımlı değilken (geliştirme) sadece loglar. */
export class LoggingProvisioner implements RandevuProvisioner {
  private readonly logger = new Logger('Provisioner');
  async createTenant(input: CreateTenantInput) {
    this.logger.log(`(geliştirme) firma açılırdı: ${input.slug}.moonvalesoft.com, ${input.seats} kişi`);
  }
  async freezeTenant(input: { slug: string }) {
    this.logger.log(`(geliştirme) firma dondurulurdu: ${input.slug}`);
  }
}

export type ProvisionerCall =
  | ({ op: 'createTenant' } & CreateTenantInput)
  | { op: 'freezeTenant'; slug: string };

/** Testler için. */
export class FakeProvisioner implements RandevuProvisioner {
  readonly calls: ProvisionerCall[] = [];
  private failures = 0;

  failNext(n: number) {
    this.failures = n;
  }

  private maybeFail() {
    if (this.failures > 0) {
      this.failures -= 1;
      throw new Error('Randevu API geçici hata (test)');
    }
  }

  // Her deneme (başarısız olanlar dahil) kaydedilir.
  async createTenant(input: CreateTenantInput) {
    this.calls.push({ op: 'createTenant', ...input });
    this.maybeFail();
  }

  async freezeTenant(input: { slug: string }) {
    this.calls.push({ op: 'freezeTenant', slug: input.slug });
    this.maybeFail();
  }
}
