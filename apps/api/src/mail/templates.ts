import type { MailMessage } from './mailer';

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
  adminAlert: (to: string, subject: string, body: string): MailMessage => ({
    to,
    subject: `[Moonvalesoft] ${subject}`,
    text: body,
  }),
};
