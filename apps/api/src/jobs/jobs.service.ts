import { Inject, Injectable, Logger } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { MINUTE } from '../common/clock';
import { SystemScope } from '../db/scope';
import { DEPS, type AppDeps } from '../deps';
import { mails } from '../mail/templates';

export const MAX_ATTEMPTS = 5;
const CLEANUP_AFTER_MS = 24 * 60 * MINUTE;

export type JobKind = 'create_tenant' | 'freeze_tenant';

export async function enqueueJob(
  c: PoolClient,
  kind: JobKind,
  dedupeKey: string,
  payload: Record<string, unknown>,
  now: Date,
): Promise<void> {
  await c.query(
    `INSERT INTO jobs (kind, dedupe_key, payload, status, run_after) VALUES ($1, $2, $3, 'pending', $4)
     ON CONFLICT (dedupe_key) DO NOTHING`,
    [kind, dedupeKey, JSON.stringify(payload), now],
  );
}

/** Arka plan işleri: Randevu'da firma açma ve dondurma. Hata olursa üstel beklemeyle tekrar dener. */
@Injectable()
export class JobsService {
  private readonly logger = new Logger('Jobs');
  private running = false;

  constructor(@Inject(DEPS) private readonly deps: AppDeps) {}

  /** Zamanı gelmiş işleri bir tur işler. `ignoreSchedule` testler içindir. */
  @SystemScope()
  async runDue(opts: { ignoreSchedule?: boolean } = {}): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const now = this.deps.clock.now();
      const due = await this.deps.db.query(
        `SELECT * FROM jobs WHERE status = 'pending' AND ($1::boolean OR run_after <= $2) ORDER BY id LIMIT 50`,
        [opts.ignoreSchedule === true, now],
      );
      for (const job of due.rows) await this.runOne(job);
      await this.cleanup(now);
    } finally {
      this.running = false;
    }
  }

  /**
   * İstek sınırı ve hatalı giriş kayıtları en fazla 1 saatlik pencerelerde sayılır; 1 günden eskileri silinir
   * (tablo süresiz büyümesin, e-posta ve IP gereğinden uzun tutulmasın).
   */
  private async cleanup(now: Date) {
    const before = new Date(now.getTime() - CLEANUP_AFTER_MS);
    await this.deps.db.query('DELETE FROM rate_limit_hits WHERE at < $1', [before]);
    await this.deps.db.query('DELETE FROM login_failures WHERE at < $1', [before]);
  }

  private async runOne(job: any) {
    const p = job.payload;
    try {
      if (job.kind === 'create_tenant') {
        await this.deps.provisioner.createTenant({
          subscriptionId: p.subscriptionId,
          slug: p.slug,
          companyName: p.companyName,
          ownerEmail: p.ownerEmail,
          ownerName: p.ownerName,
          seats: p.seats,
        });
        await this.deps.db.query("UPDATE subscriptions SET provisioning = 'done' WHERE id = $1", [p.subscriptionId]);
      } else {
        await this.deps.provisioner.freezeTenant({ slug: p.slug });
      }
      await this.deps.db.query("UPDATE jobs SET status = 'done', attempts = attempts + 1, last_error = NULL WHERE id = $1", [job.id]);
    } catch (err) {
      const attempts = job.attempts + 1;
      const message = (err as Error).message.slice(0, 500);
      if (attempts >= MAX_ATTEMPTS) {
        await this.deps.db.query("UPDATE jobs SET status = 'failed', attempts = $2, last_error = $3 WHERE id = $1", [job.id, attempts, message]);
        if (job.kind === 'create_tenant') {
          await this.deps.db.query("UPDATE subscriptions SET provisioning = 'failed' WHERE id = $1", [p.subscriptionId]);
        }
        this.logger.error(`İş ${job.id} (${job.kind}) ${attempts}. denemede de başarısız: ${message}`);
        await this.alert(
          job.kind === 'create_tenant' ? `Firma açılamadı: ${p.slug}` : `Firma dondurulamadı: ${p.slug}`,
          `${p.slug}.moonvalesoft.com için "${job.kind}" işi ${attempts} denemede başarısız oldu.\nSon hata: ${message}\nİş no: ${job.id}`,
        );
      } else {
        const delay = 2 ** attempts * MINUTE;
        await this.deps.db.query('UPDATE jobs SET attempts = $2, last_error = $3, run_after = $4 WHERE id = $1', [
          job.id,
          attempts,
          message,
          new Date(this.deps.clock.now().getTime() + delay),
        ]);
      }
    }
  }

  private async alert(subject: string, body: string) {
    const to = this.deps.config.adminEmail;
    if (!to) return;
    await this.deps.mailer.send(mails.adminAlert(to, subject, body)).catch((e) => this.logger.error(e));
  }
}
