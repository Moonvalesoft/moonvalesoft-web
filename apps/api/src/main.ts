import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { loadConfig } from './config';
import { systemClock } from './common/clock';
import { Db } from './db/db';
import { migrate } from './db/migrate';
import { SmtpMailer } from './mail/mailer';
import { FakePaymentProvider } from './payments/provider';
import { HttpRandevuProvisioner, LoggingProvisioner } from './provisioning/provisioner';
import { createApp } from './app';
import { JobsService } from './jobs/jobs.service';

async function main() {
  const config = loadConfig();
  await migrate(config.databaseUrl);
  const db = new Db(config.databaseUrl);
  const app = await createApp({
    config,
    db,
    clock: systemClock,
    mailer: new SmtpMailer(config.smtpUrl, config.mailFrom),
    payments: new FakePaymentProvider(config.paymentWebhookSecret, config.webOrigin),
    provisioner: config.randevuApiUrl
      ? new HttpRandevuProvisioner(config.randevuApiUrl, config.randevuApiKey)
      : new LoggingProvisioner(),
  });
  await app.listen(config.port, '0.0.0.0');
  Logger.log(`API http://localhost:${config.port} adresinde`, 'Main');

  const jobs = app.get(JobsService);
  const timer = setInterval(() => jobs.runDue().catch((e) => Logger.error(e, 'Jobs')), 10_000);
  const stop = async () => {
    clearInterval(timer);
    await app.close();
    await db.close();
    process.exit(0);
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
