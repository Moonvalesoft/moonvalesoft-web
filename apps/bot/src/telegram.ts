/** Telegram Bot API'nin bot için gereken küçük parçası. */

export interface User {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface Message {
  message_id: number;
  from?: User;
  chat: { id: number; type: string };
  text?: string;
  reply_to_message?: Message;
}

export interface CallbackQuery {
  id: string;
  from: User;
  message?: Message;
  data?: string;
}

export interface Update {
  update_id: number;
  message?: Message;
  callback_query?: CallbackQuery;
}

export interface Button {
  text: string;
  callback_data: string;
}

/** Bot API çağrısı: yöntem adı ve parametreler. */
export type Api = (method: string, params: Record<string, unknown>) => Promise<unknown>;

export function createApi(token: string, fetcher: typeof fetch = fetch): Api {
  return async (method, params) => {
    const res = await fetcher(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Telegram ${method}: HTTP ${res.status} ${await res.text()}`);
    return res.json();
  };
}
