import { describe, expect, it } from 'vitest';
import { ALL_OFFERINGS, TEXT, handleUpdate, parsePrompt } from '../src/bot';
import type { Message, Update, User } from '../src/telegram';
import worker from '../src/index';

const OWNER = 999;
const env = { OWNER_CHAT_ID: String(OWNER) };
const ayse = { id: 42, first_name: 'Ayşe', last_name: 'Kaya', username: 'aysekuafor' };
const bot = { id: 1, first_name: 'Moonvalesoft', is_bot: true };

function recorder() {
  const calls: { method: string; params: any }[] = [];
  const api = async (method: string, params: Record<string, unknown>) => {
    calls.push({ method, params });
    return { ok: true };
  };
  return { calls, api, sent: () => calls.filter((c) => c.method === 'sendMessage').map((c) => c.params) };
}

let uid = 1;
const msg = (text: string, extra: Partial<Message> = {}, from: User = ayse): Update => ({
  update_id: uid++,
  message: { message_id: uid, from, chat: { id: from.id, type: 'private' }, text, ...extra },
});
const press = (data: string): Update => ({
  update_id: uid++,
  callback_query: { id: `cb${uid}`, from: ayse, data, message: { message_id: 5, chat: { id: ayse.id, type: 'private' } } },
});
const botPrompt = (text: string): Message => ({ message_id: 77, from: bot, chat: { id: ayse.id, type: 'private' }, text });

describe('menü', () => {
  it('/start: teklif, şikâyet, öneri düğmeleri', async () => {
    const r = recorder();
    await handleUpdate(msg('/start'), env, r.api);
    const [m] = r.sent();
    expect(m.text).toBe(TEXT.welcome);
    expect(m.reply_markup.inline_keyboard.flat().map((b: any) => b.callback_data)).toEqual(['k:teklif', 'k:sikayet', 'k:oneri']);
  });

  it('düğmeye basmadan yazılan mesaj "💬 Mesaj" olarak Ozanay\'a gider, kişiye 24 saat yanıtı döner', async () => {
    const r = recorder();
    await handleUpdate(msg('merhaba fiyat ne'), env, r.api);
    const [toOwner, thanks] = r.sent();
    expect(toOwner.chat_id).toBe(OWNER);
    expect(toOwner.text.split('\n')[0]).toBe('💬 Mesaj');
    expect(toOwner.text).toContain('#u42');
    expect(toOwner.text).toContain('merhaba fiyat ne');
    expect(thanks).toMatchObject({ chat_id: 42, text: TEXT.thanks });
  });

  it('yazısız mesaj ve bilinmeyen komut menüyü gösterir, Ozanay\'a bir şey gitmez', async () => {
    const r = recorder();
    await handleUpdate(msg(''), env, r.api);
    await handleUpdate(msg('/yardim'), env, r.api);
    expect(r.sent().map((m) => m.text)).toEqual([TEXT.welcome, TEXT.welcome]);
  });

  it('Teklif: bütün ürünler ve "Başka bir konu" düğmesi', async () => {
    const r = recorder();
    await handleUpdate(press('k:teklif'), env, r.api);
    expect(r.calls[0].method).toBe('answerCallbackQuery');
    const slugs = r.sent()[0].reply_markup.inline_keyboard.flat().map((b: any) => b.callback_data);
    expect(slugs).toEqual([...ALL_OFFERINGS.map((o) => `t:${o.slug}`), 't:diger']);
    for (const s of slugs) expect(new TextEncoder().encode(s).length).toBeLessThanOrEqual(64);
  });

  it('ürün seçilince yanıt kutulu soru gelir', async () => {
    const r = recorder();
    await handleUpdate(press('t:crm'), env, r.api);
    const m = r.sent()[0];
    expect(m.text.split('\n')[0]).toBe('Teklif · CRM');
    expect(m.reply_markup.force_reply).toBe(true);
  });

  it('siteden "Teklif al" ile gelince ürün seçili başlar', async () => {
    const r = recorder();
    await handleUpdate(msg('/start t-kasa-entegrasyonu'), env, r.api);
    expect(r.sent()[0].text.split('\n')[0]).toBe('Teklif · Kasa Entegrasyonu');
  });

  it('bilinmeyen ürün kodu menüye döner', async () => {
    const r = recorder();
    await handleUpdate(msg('/start t-yok-boyle'), env, r.api);
    expect(r.sent()[0].text).toBe(TEXT.welcome);
  });
});

describe('talep iletimi', () => {
  it('teklif yanıtı: kişiye 24 saat mesajı, Ozanay\'a etiketli talep', async () => {
    const r = recorder();
    await handleUpdate(msg('3 çalışanlı salon, online randevu', { reply_to_message: botPrompt(TEXT.askQuote('Randevu')) }), env, r.api);
    const [toOwner, toUser] = r.sent();
    expect(toOwner.chat_id).toBe(OWNER);
    expect(toOwner.text).toContain('🆕 Teklif · Randevu');
    expect(toOwner.text).toContain('Ayşe Kaya (@aysekuafor)');
    expect(toOwner.text).toContain('#u42');
    expect(toOwner.text).toContain('3 çalışanlı salon, online randevu');
    expect(toUser.chat_id).toBe(42);
    expect(toUser.text).toContain('24 saat içerisinde dönüş yapılacaktır');
  });

  it('şikâyet ve öneri kendi etiketleriyle gider', async () => {
    const r = recorder();
    await handleUpdate(msg('Hatırlatma gelmedi', { reply_to_message: botPrompt(TEXT.askComplaint) }), env, r.api);
    await handleUpdate(msg('Karanlık mod olsun', { reply_to_message: botPrompt(TEXT.askSuggestion) }), env, r.api);
    const owner = r.sent().filter((m) => m.chat_id === OWNER).map((m) => m.text.split('\n')[0]);
    expect(owner).toEqual(['⚠️ Şikâyet', '💡 Öneri']);
  });

  it('kişi kendi mesajını yanıtlarsa kategori taklit edilemez, düz mesaj olarak gider', async () => {
    const r = recorder();
    const own: Message = { message_id: 3, from: ayse, chat: { id: 42, type: 'private' }, text: 'Teklif · CRM' };
    await handleUpdate(msg('selam', { reply_to_message: own }), env, r.api);
    const toOwner = r.sent().find((m) => m.chat_id === OWNER);
    expect(toOwner?.text.split('\n')[0]).toBe('💬 Mesaj');
  });

  it('grup sohbetlerine yanıt verilmez', async () => {
    const r = recorder();
    const u = msg('/start');
    u.message!.chat.type = 'group';
    await handleUpdate(u, env, r.api);
    expect(r.calls).toHaveLength(0);
  });
});

describe('Ozanay\'ın cevabı', () => {
  const owner = { id: OWNER, first_name: 'Ozanay' };
  const forwarded: Message = { message_id: 50, from: bot, chat: { id: OWNER, type: 'private' }, text: '🆕 Teklif · CRM\nKimden: Ayşe · #u42\n\nmerhaba' };

  it('iletilen talebi yanıtlayınca cevap kişiye gider', async () => {
    const r = recorder();
    await handleUpdate(msg('Yarın 10:00 arayayım mı?', { reply_to_message: forwarded }, owner), env, r.api);
    const [toUser, ack] = r.sent();
    expect(toUser).toMatchObject({ chat_id: 42, text: 'Ozanay: Yarın 10:00 arayayım mı?' });
    expect(ack.text).toBe(TEXT.delivered);
  });

  it('etiketsiz mesajı yanıtlarsa nasıl cevap verileceğini söyler', async () => {
    const r = recorder();
    await handleUpdate(msg('test', { reply_to_message: { ...forwarded, text: 'başka bir şey' } }, owner), env, r.api);
    expect(r.sent()[0]).toMatchObject({ chat_id: OWNER, text: TEXT.replyHint });
  });

  it('kendi hesabından deneyebilir: botun sorusunu yanıtlarsa talep olarak kendisine gelir, yanıtı da kendisine döner', async () => {
    const r = recorder();
    const prompt: Message = { message_id: 60, from: bot, chat: { id: OWNER, type: 'private' }, text: TEXT.askQuote('CRM') };
    await handleUpdate(msg('deneme', { reply_to_message: prompt, chat: { id: OWNER, type: 'private' } }, owner), env, r.api);
    const [toOwner, thanks] = r.sent();
    expect(toOwner.chat_id).toBe(OWNER);
    expect(toOwner.text).toContain(`#u${OWNER}`);
    expect(thanks).toMatchObject({ chat_id: OWNER, text: TEXT.thanks });

    const r2 = recorder();
    const forwardedToSelf: Message = { message_id: 61, from: bot, chat: { id: OWNER, type: 'private' }, text: toOwner.text };
    await handleUpdate(msg('cevap', { reply_to_message: forwardedToSelf, chat: { id: OWNER, type: 'private' } }, owner), env, r2.api);
    expect(r2.sent()[0]).toMatchObject({ chat_id: OWNER, text: 'Ozanay: cevap' });
  });

  it('/kimim sohbet kimliğini söyler (kurulum için)', async () => {
    const r = recorder();
    await handleUpdate(msg('/kimim'), env, r.api);
    expect(r.sent()[0].text).toBe('Sohbet kimliğin: 42');
  });
});

describe('parsePrompt', () => {
  it('soru metinlerini tanır', () => {
    expect(parsePrompt(TEXT.askQuote('B2B'))).toEqual({ kind: 'quote', product: 'B2B' });
    expect(parsePrompt(TEXT.askComplaint)).toEqual({ kind: 'complaint' });
    expect(parsePrompt(TEXT.askSuggestion)).toEqual({ kind: 'suggestion' });
    expect(parsePrompt('merhaba')).toBeNull();
  });
});

describe('Worker', () => {
  const wenv = { TELEGRAM_TOKEN: 'x', WEBHOOK_SECRET: 's3cret', OWNER_CHAT_ID: '999' };
  it('gizli anahtar başlığı yoksa 403', async () => {
    const res = await worker.fetch(new Request('https://w/', { method: 'POST', body: '{}' }), wenv);
    expect(res.status).toBe(403);
  });
  it('bozuk gövde 400', async () => {
    const res = await worker.fetch(
      new Request('https://w/', { method: 'POST', body: 'x', headers: { 'x-telegram-bot-api-secret-token': 's3cret' } }),
      wenv,
    );
    expect(res.status).toBe(400);
  });
});
