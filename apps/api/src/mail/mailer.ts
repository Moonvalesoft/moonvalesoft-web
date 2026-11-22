import nodemailer from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

export class SmtpMailer implements Mailer {
  private readonly transport;
  constructor(
    smtpUrl: string,
    private readonly from: string,
  ) {
    this.transport = nodemailer.createTransport(smtpUrl);
  }
  async send(message: MailMessage): Promise<void> {
    await this.transport.sendMail({ from: this.from, ...message });
  }
}

export interface SentMail extends MailMessage {
  links: string[];
}

/** Testler için: e-postaları gönderir gibi yapar, saklar. */
export class InMemoryMailer implements Mailer {
  readonly sent: SentMail[] = [];
  async send(message: MailMessage): Promise<void> {
    const links = message.text.match(/https?:\/\/\S+/g) ?? [];
    this.sent.push({ ...message, links });
  }
}
