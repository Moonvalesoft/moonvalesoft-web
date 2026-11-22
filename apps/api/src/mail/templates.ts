import type { MailMessage } from './mailer';

function formatTL(kurus: number): string {
  return `${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

const sign = '\n\nOzan\nMoonvalesoft';

export const mails = {
  verifyEmail: (to: string, name: string, link: string): MailMessage => ({
    to,
    subject: 'E-posta adresini doğrula',
    text: `Merhaba ${name},\n\nMoonvalesoft hesabını açtığın için teşekkürler. Adresini doğrulamak için bağlantıya tıkla:\n\n${link}\n\nBağlantı 24 saat geçerli. Bu hesabı sen açmadıysan bu e-postayı yok sayabilirsin.${sign}`,
  }),
  alreadyRegistered: (to: string, link: string): MailMessage => ({
    to,
    subject: 'Zaten bir hesabın var',
    text: `Merhaba,\n\nBu e-posta adresiyle yeni hesap açılmak istendi ama zaten bir hesabın var. Şifreni hatırlamıyorsan buradan yenileyebilirsin:\n\n${link}\n\nBu isteği sen yapmadıysan bir şey yapmana gerek yok.${sign}`,
  }),
  resetPassword: (to: string, link: string): MailMessage => ({
    to,
    subject: 'Şifreni yenile',
    text: `Merhaba,\n\nŞifreni yenilemek için bağlantıya tıkla:\n\n${link}\n\nBağlantı 1 saat geçerli. Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; şifren değişmez.${sign}`,
  }),
  preInfo: (
    to: string,
    name: string,
    o: { planName: string; seats: number; amountKurus: number; preInfoUrl: string; distanceSalesUrl: string },
  ): MailMessage => ({
    to,
    subject: 'Siparişin: ön bilgilendirme ve sözleşme',
    text: `Merhaba ${name},\n\nSiparişini aldım. Onayladığın belgelerin kopyası aşağıda.\n\nPaket: ${o.planName}\nKişi sayısı: ${o.seats}\nTutar: ${formatTL(o.amountKurus)}\n\nÖn Bilgilendirme Formu: ${o.preInfoUrl}\nMesafeli Satış Sözleşmesi: ${o.distanceSalesUrl}\n\nÖdemen tamamlanınca ayrıca haber vereceğim.${sign}`,
  }),
  adminAlert: (to: string, subject: string, body: string): MailMessage => ({
    to,
    subject: `[Moonvalesoft] ${subject}`,
    text: body,
  }),
};
