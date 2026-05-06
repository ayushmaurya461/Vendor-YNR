import { env } from '../config/env.js';

/** `mobile` already in 91XXXXXXXXXX form for MSG91. */
export async function sendOtpSms(mobile: string, otp: string): Promise<void> {
  if (env.OTP_LOG_ONLY) {
    console.info(`[OTP_LOG_ONLY] phone=${mobile} otp=${otp}`);
    return;
  }

  const authKey = env.MSG91_AUTH_KEY!;
  const templateId = env.MSG91_TEMPLATE_ID!;

  const body = JSON.stringify({
    template_id: templateId,
    short_url: '0',
    recipients: [{ mobiles: mobile, otp }],
  });

  const res = await fetch('https://control.msg91.com/api/v5/flow', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authkey: authKey,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MSG91 error ${res.status}: ${text}`);
  }
}
