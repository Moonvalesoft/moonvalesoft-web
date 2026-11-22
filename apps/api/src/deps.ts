import type { Config } from './config';
import type { Clock } from './common/clock';
import type { Db } from './db/db';
import type { Mailer } from './mail/mailer';
import type { PaymentProvider } from './payments/provider';
import type { RandevuProvisioner } from './provisioning/provisioner';

/** Dışarıyla konuşan her şey buradan verilir; testler sahtelerini verir. */
export interface AppDeps {
  config: Config;
  db: Db;
  clock: Clock;
  mailer: Mailer;
  payments: PaymentProvider;
  provisioner: RandevuProvisioner;
}

export const DEPS = Symbol('DEPS');
