import { Logger } from '@nestjs/common';

export interface CreateTenantInput {
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

  private async post(path: string, body: unknown) {
    const res = await fetch(new URL(path, this.baseUrl), {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    // 409: zaten var / zaten dondurulmuş → başarılı say (işlem tekrar edilebilir olmalı).
    if (!res.ok && res.status !== 409) throw new Error(`Randevu API ${path}: HTTP ${res.status}`);
  }

  createTenant(input: CreateTenantInput) {
    return this.post('/internal/tenants', input);
  }

  freezeTenant(input: { slug: string }) {
    return this.post(`/internal/tenants/${encodeURIComponent(input.slug)}/freeze`, {});
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

  async createTenant(input: CreateTenantInput) {
    this.maybeFail();
    this.calls.push({ op: 'createTenant', ...input });
  }

  async freezeTenant(input: { slug: string }) {
    this.maybeFail();
    this.calls.push({ op: 'freezeTenant', slug: input.slug });
  }
}
