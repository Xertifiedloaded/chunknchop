import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { hashToken, isValidEmail, normalizeEmail } from '@/lib/auth';

type CodePurpose = 'verify' | 'reset';

function codeHash(code: string) {
  const pepper =
    process.env.AUTH_TOKEN_PEPPER || process.env.BETTER_AUTH_SECRET || process.env.MONGODB_URI;
  if (!pepper) throw new Error('Authentication token secret is not configured.');
  return createHmac('sha256', pepper).update(code).digest('hex');
}

function rateIdentifier(email: string, purpose: CodePurpose) {
  return `email-code:${purpose}:${hashToken(normalizeEmail(email))}`;
}

export async function issueEmailCode(rawEmail: string, name: string, purpose: CodePurpose) {
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) return false;
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  const templateId =
    purpose === 'verify'
      ? process.env.EMAILJS_VERIFY_TEMPLATE_ID
      : process.env.EMAILJS_RESET_TEMPLATE_ID;
  if (!serviceId || !publicKey || !privateKey || !templateId) return false;

  const identifier = rateIdentifier(email, purpose);
  const now = new Date();
  const previous = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: 'desc' },
  });
  if (previous && now.getTime() - previous.createdAt.getTime() < 60_000) return false;
  await prisma.verification.deleteMany({ where: { identifier } });

  const code = String(randomInt(10_000_000, 100_000_000));
  await prisma.verification.create({
    data: {
      identifier,
      value: JSON.stringify({ hash: codeHash(code), attempts: 0 }),
      expiresAt: new Date(now.getTime() + 10 * 60_000),
    },
  });

  const body = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: {
      to_email: email,
      to_name: name.slice(0, 80),
      otp_code: code,
      expires_in: '10 minutes',
      purpose: purpose === 'verify' ? 'email verification' : 'password reset',
    },
  };
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return true;
    console.error('[emailjs] send failed', response.status, await response.text());
  } catch (err) {
    console.error('[emailjs] request threw', err);
  }
  await prisma.verification.deleteMany({ where: { identifier } });
  return false;
}

export async function consumeEmailCode(rawEmail: string, purpose: CodePurpose, rawCode: unknown) {
  const email = normalizeEmail(rawEmail);
  const code = typeof rawCode === 'string' ? rawCode.trim() : '';
  if (!isValidEmail(email) || !/^\d{8}$/.test(code)) return false;

  const identifier = rateIdentifier(email, purpose);
  const record = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: 'desc' },
  });
  if (!record || record.expiresAt.getTime() <= Date.now()) {
    if (record) await prisma.verification.deleteMany({ where: { identifier } });
    return false;
  }

  let stored: { hash?: string; attempts?: number };
  try {
    stored = JSON.parse(record.value);
  } catch {
    await prisma.verification.deleteMany({ where: { identifier } });
    return false;
  }
  if (!stored.hash || !Number.isSafeInteger(stored.attempts) || (stored.attempts ?? 5) >= 5) {
    await prisma.verification.deleteMany({ where: { identifier } });
    return false;
  }

  const nextValue = JSON.stringify({ hash: stored.hash, attempts: (stored.attempts ?? 0) + 1 });
  const consumedAttempt = await prisma.verification.updateMany({
    where: { id: record.id, value: record.value },
    data: { value: nextValue },
  });
  if (consumedAttempt.count !== 1) return false;

  const candidate = Buffer.from(codeHash(code), 'hex');
  const expected = Buffer.from(stored.hash, 'hex');
  if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) return false;

  await prisma.verification.deleteMany({ where: { identifier } });
  return true;
}
