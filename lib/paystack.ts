const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

async function paystackFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok || data.status === false) {
    throw new Error(data.message ?? 'Paystack request failed');
  }

  return data;
}

export const paystack = {
  initializeTransaction: (params: { email: string; amount: number; currency?: string; reference?: string; callback_url?: string; metadata?: Record<string, unknown> }) =>
    paystackFetch('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  verifyTransaction: (reference: string) =>
    paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
    }),
};
