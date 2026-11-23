import { INTEGRATIONS, LOGO_SERVICES, SOFTWARE, type Offering } from '../../web/lib/offerings';
import type { Api, Button, CallbackQuery, Message, Update, User } from './telegram';

/**
 * Akış (kayıt tutmaz, durum mesajların içinde taşınır):
 *  1. /start → "Teklif / Şikâyet / Öneri" düğmeleri. Siteden "Teklif al" ile gelinirse (/start t-<ürün>) ürün seçili başlar.
 *  2. Teklif → ürün düğmeleri. Ürün seçilince "ihtiyacını yaz" sorusu yanıt kutusuyla (ForceReply) sorulur.
 *  3. Kişi soruyu yanıtlayınca: kişiye "24 saat içerisinde dönüş yapılacaktır", Ozanay'a talep iletilir.
 *     Kategori, sorunun ilk satırından anlaşılır (ör. "Teklif · Randevu").
 *  4. Ozanay iletilen talebi yanıtlarsa cevabı kişiye gider (#u<kimlik> etiketinden).
 */

export interface BotEnv {
  OWNER_CHAT_ID: string;
}

export const ALL_OFFERINGS: Offering[] = [...SOFTWARE, ...INTEGRATIONS, ...LOGO_SERVICES];
const OTHER = { slug: 'diger', title: 'Başka bir konu' };

export const TEXT = {
  welcome: "Merhaba, Moonvalesoft'a hoş geldin! 🌙\nNe için yazıyorsun?",
  chooseProduct: 'Hangi ürün ya da hizmet için teklif istiyorsun?',
  askQuote: (title: string) =>
    `Teklif · ${title}\nİhtiyacını kısaca yaz: işletmenin adı, ne yapmak istediğin, varsa kullanıcı sayısı.`,
  askComplaint: 'Şikâyet\nNe oldu, hangi üründe? Kısaca yaz.',
  askSuggestion: 'Öneri\nÖnerini yaz, dinliyorum.',
  thanks: 'Teşekkürler, mesajını aldım. ✅\n24 saat içerisinde dönüş yapılacaktır.\n\nYeni bir konu için /start yaz.',
  ownerReplyPrefix: 'Ozanay:',
  delivered: 'İletildi ✓',
  replyHint: 'Cevap vermek için iletilen talebi yanıtla (mesaja basılı tut → Yanıtla).',
};

const KIND_LABEL = { quote: '🆕 Teklif', complaint: '⚠️ Şikâyet', suggestion: '💡 Öneri' } as const;
type Kind = keyof typeof KIND_LABEL;

const mainMenu: Button[][] = [
  [{ text: 'Teklif almak istiyorum', callback_data: 'k:teklif' }],
  [{ text: 'Şikâyetim var', callback_data: 'k:sikayet' }],
  [{ text: 'Önerim var', callback_data: 'k:oneri' }],
];

function productMenu(): Button[][] {
  const buttons: Button[] = [...ALL_OFFERINGS, OTHER].map((o) => ({ text: o.title, callback_data: `t:${o.slug}` }));
  const rows: Button[][] = [];
  for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2));
  return rows;
}

function findTitle(slug: string): string | null {
  if (slug === OTHER.slug) return OTHER.title;
  return ALL_OFFERINGS.find((o) => o.slug === slug)?.title ?? null;
}

const forceReply = (placeholder: string) => ({ force_reply: true, input_field_placeholder: placeholder });

function displayName(u: User): string {
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ');
  return u.username ? `${name} (@${u.username})` : name;
}

/** Sorunun ilk satırından kategori: "Teklif · Ürün", "Şikâyet", "Öneri". */
export function parsePrompt(text: string | undefined): { kind: Kind; product?: string } | null {
  const first = (text ?? '').split('\n')[0].trim();
  if (first.startsWith('Teklif · ')) return { kind: 'quote', product: first.slice('Teklif · '.length) };
  if (first === 'Şikâyet') return { kind: 'complaint' };
  if (first === 'Öneri') return { kind: 'suggestion' };
  return null;
}

async function sendMenu(api: Api, chatId: number) {
  await api('sendMessage', { chat_id: chatId, text: TEXT.welcome, reply_markup: { inline_keyboard: mainMenu } });
}

async function askQuote(api: Api, chatId: number, title: string) {
  await api('sendMessage', { chat_id: chatId, text: TEXT.askQuote(title), reply_markup: forceReply('İhtiyacını yaz…') });
}

async function onCallback(api: Api, q: CallbackQuery) {
  const chatId = q.message?.chat.id ?? q.from.id;
  await api('answerCallbackQuery', { callback_query_id: q.id });
  const data = q.data ?? '';
  if (data === 'k:teklif') {
    await api('sendMessage', { chat_id: chatId, text: TEXT.chooseProduct, reply_markup: { inline_keyboard: productMenu() } });
  } else if (data === 'k:sikayet') {
    await api('sendMessage', { chat_id: chatId, text: TEXT.askComplaint, reply_markup: forceReply('Şikâyetini yaz…') });
  } else if (data === 'k:oneri') {
    await api('sendMessage', { chat_id: chatId, text: TEXT.askSuggestion, reply_markup: forceReply('Önerini yaz…') });
  } else if (data.startsWith('t:')) {
    const title = findTitle(data.slice(2));
    if (title) await askQuote(api, chatId, title);
    else await sendMenu(api, chatId);
  }
}

async function onOwnerMessage(api: Api, m: Message) {
  const ref = m.reply_to_message?.text?.match(/#u(\d+)/);
  if (!ref || !m.text) {
    await api('sendMessage', { chat_id: m.chat.id, text: TEXT.replyHint });
    return;
  }
  await api('sendMessage', { chat_id: Number(ref[1]), text: `${TEXT.ownerReplyPrefix} ${m.text}` });
  await api('sendMessage', { chat_id: m.chat.id, text: TEXT.delivered, reply_to_message_id: m.message_id });
}

async function onCustomerMessage(api: Api, env: BotEnv, m: Message) {
  const text = m.text?.trim() ?? '';
  const chatId = m.chat.id;

  if (text.startsWith('/start')) {
    const payload = text.split(/\s+/)[1] ?? '';
    const title = payload.startsWith('t-') ? findTitle(payload.slice(2)) : null;
    if (title) await askQuote(api, chatId, title);
    else await sendMenu(api, chatId);
    return;
  }
  if (text === '/kimim') {
    await api('sendMessage', { chat_id: chatId, text: `Sohbet kimliğin: ${chatId}` });
    return;
  }

  // Yalnız botun sorduğu soruya verilen yanıt talep sayılır.
  const prompt = m.reply_to_message?.from?.is_bot === true ? parsePrompt(m.reply_to_message.text) : null;
  if (!prompt || !text) {
    await sendMenu(api, chatId);
    return;
  }

  const who = m.from ? displayName(m.from) : 'Bilinmeyen';
  const head = prompt.kind === 'quote' ? `${KIND_LABEL.quote} · ${prompt.product}` : KIND_LABEL[prompt.kind];
  await api('sendMessage', { chat_id: Number(env.OWNER_CHAT_ID), text: `${head}\nKimden: ${who} · #u${chatId}\n\n${text}` });
  await api('sendMessage', { chat_id: chatId, text: TEXT.thanks });
}

export async function handleUpdate(update: Update, env: BotEnv, api: Api): Promise<void> {
  if (update.callback_query) return onCallback(api, update.callback_query);
  const m = update.message;
  if (!m || m.chat.type !== 'private') return;
  const isOwner = env.OWNER_CHAT_ID !== '' && String(m.chat.id) === String(env.OWNER_CHAT_ID);
  // Ozanay botun sorusunu yanıtlarsa müşteri gibi işlenir (kendi hesabından deneyebilsin diye).
  if (isOwner && m.reply_to_message && !parsePrompt(m.reply_to_message.text)) return onOwnerMessage(api, m);
  return onCustomerMessage(api, env, m);
}
