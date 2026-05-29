const KAVENEGAR_BASE = 'https://api.kavenegar.com/v1';

const normalizePhone = (phone: string): string =>
  phone.replace(/[^0-9]/g, '').replace(/^0/, '98');

export const smsService = {
  send: async (apiKey: string, phone: string, message: string): Promise<void> => {
    const receptor = normalizePhone(phone);
    if (!receptor) throw new Error('شماره تلفن نامعتبر است.');

    const url = `${KAVENEGAR_BASE}/${encodeURIComponent(apiKey)}/sms/send.json`;
    const body = new URLSearchParams({ receptor, message });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!res.ok) throw new Error(`خطای اتصال به سرویس پیامک: ${res.status}`);

    const data = await res.json();
    if (data?.return?.status !== 200) {
      throw new Error(data?.return?.message || 'ارسال پیامک ناموفق بود.');
    }
  },
};
