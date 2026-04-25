const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
}

export async function sendPush(token: string | null | undefined, title: string, body: string, data?: Record<string, unknown>) {
  if (!token || !token.startsWith('ExponentPushToken')) return;

  const message: PushMessage = { to: token, title, body, sound: 'default', data: data ?? {} };

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(message),
    });
    const json = await res.json();
    if (json.data?.status === 'error') {
      console.error('Push error:', json.data.message);
    }
  } catch (err) {
    console.error('Push send failed:', err);
  }
}

export async function sendPushBatch(tokens: (string | null | undefined)[], title: string, body: string, data?: Record<string, unknown>) {
  const valid = tokens.filter((t): t is string => !!t && t.startsWith('ExponentPushToken'));
  if (!valid.length) return;

  const messages = valid.map((to) => ({ to, title, body, sound: 'default', data: data ?? {} }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    await res.json();
  } catch (err) {
    console.error('Push batch failed:', err);
  }
}
