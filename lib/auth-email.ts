import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

import { prisma } from '@/lib/prisma';
import { hashToken, isValidEmail, normalizeEmail } from '@/lib/auth';

type CodePurpose = 'verify' | 'reset' | 'invite';

const OTP_EXPIRY_MS = 10 * 60_000;
const OTP_RESEND_INTERVAL_MS = 60_000;
const MAX_OTP_ATTEMPTS = 5;

function codeHash(code: string): string {
  const pepper =
    process.env.AUTH_TOKEN_PEPPER || process.env.BETTER_AUTH_SECRET || process.env.MONGODB_URI;

  if (!pepper) {
    throw new Error('Authentication token secret is not configured.');
  }

  return createHmac('sha256', pepper).update(code).digest('hex');
}

function rateIdentifier(email: string, purpose: CodePurpose): string {
  return `email-code:${purpose}:${hashToken(normalizeEmail(email))}`;
}

function getSiteUrl(): string | null {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);

    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

async function sendEmailCode(
  email: string,
  name: string,
  code: string,
  purpose: CodePurpose,
): Promise<boolean> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  const templateId =
    purpose === 'reset'
      ? process.env.EMAILJS_RESET_TEMPLATE_ID
      : process.env.EMAILJS_VERIFY_TEMPLATE_ID;

  if (!serviceId || !publicKey || !privateKey || !templateId) {
    console.error('[emailjs] Missing EmailJS configuration.', {
      serviceIdConfigured: Boolean(serviceId),
      publicKeyConfigured: Boolean(publicKey),
      privateKeyConfigured: Boolean(privateKey),
      templateConfigured: Boolean(templateId),
      purpose,
    });

    return false;
  }

  let inviteUrl = '';

  if (purpose === 'invite') {
    const siteUrl = getSiteUrl();

    if (!siteUrl) {
      console.error('[emailjs] A valid NEXT_PUBLIC_SITE_URL is required for invitations.');

      return false;
    }

    inviteUrl = `${siteUrl}/invite/accept?email=${encodeURIComponent(email)}`;
  }

  const templateParams = {
    to_email: email,
    to_name: (name || 'Customer').slice(0, 80),
    otp_code: code,
    expires_in: '10 minutes',

    purpose:
      purpose === 'verify'
        ? 'email verification'
        : purpose === 'invite'
          ? 'account invitation'
          : 'password reset',

    invite_url: inviteUrl,
  };

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: templateParams,
  };

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('[emailjs] EmailJS rejected the email.', {
        status: response.status,
        response: responseText,
        purpose,
        recipient: email,
      });

      return false;
    }

    console.info('[emailjs] EmailJS accepted the email.', {
      status: response.status,
      purpose,
      recipient: email,
    });

    return true;
  } catch (error) {
    console.error('[emailjs] Email request failed.', {
      purpose,
      recipient: email,
      error,
    });

    return false;
  }
}

export async function issueEmailCode(
  rawEmail: string,
  name: string,
  purpose: CodePurpose,
): Promise<boolean> {
  const email = normalizeEmail(rawEmail);

  if (!isValidEmail(email)) {
    return false;
  }

  if (purpose === 'reset') {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        resetOtpCreatedAt: true,
      },
    });

    if (!user?.emailVerified) {
      return false;
    }

    const now = new Date();

    if (
      user.resetOtpCreatedAt &&
      now.getTime() - user.resetOtpCreatedAt.getTime() < OTP_RESEND_INTERVAL_MS
    ) {
      return false;
    }

    let code = '';
    let hash = '';

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = String(randomInt(10_000_000, 100_000_000));

      const candidateHash = codeHash(candidate);

      const collision = await prisma.user.findFirst({
        where: {
          resetOtpHash: candidateHash,
        },
        select: {
          id: true,
        },
      });

      if (!collision) {
        code = candidate;
        hash = candidateHash;
        break;
      }
    }

    if (!code || !hash) {
      console.error('[auth-email] Could not generate a unique reset OTP.');

      return false;
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetOtpHash: hash,
        resetOtpExpiresAt: new Date(now.getTime() + OTP_EXPIRY_MS),
        resetOtpCreatedAt: now,
        resetOtpAttempts: 0,
      },
    });

    const sent = await sendEmailCode(user.email, user.name || name || 'Customer', code, 'reset');

    if (!sent) {
      await prisma.user.updateMany({
        where: {
          id: user.id,
          resetOtpHash: hash,
        },
        data: {
          resetOtpHash: null,
          resetOtpExpiresAt: null,
          resetOtpCreatedAt: null,
          resetOtpAttempts: 0,
        },
      });
    }

    return sent;
  }

  if (purpose === 'invite' && !getSiteUrl()) {
    console.error('[auth-email] Cannot issue invitation without a valid NEXT_PUBLIC_SITE_URL.');

    return false;
  }

  const identifier = rateIdentifier(email, purpose);
  const now = new Date();

  const previous = await prisma.verification.findFirst({
    where: {
      identifier,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (previous && now.getTime() - previous.createdAt.getTime() < OTP_RESEND_INTERVAL_MS) {
    return false;
  }

  await prisma.verification.deleteMany({
    where: {
      identifier,
    },
  });

  const code = String(randomInt(10_000_000, 100_000_000));

  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

  await prisma.verification.create({
    data: {
      identifier,
      value: JSON.stringify({
        hash: codeHash(code),
        attempts: 0,
      }),
      expiresAt,
    },
  });

  const sent = await sendEmailCode(email, name, code, purpose);

  if (!sent) {
    await prisma.verification.deleteMany({
      where: {
        identifier,
      },
    });
  }

  return sent;
}

export async function consumeEmailCode(
  rawEmail: string,
  purpose: CodePurpose,
  rawCode: unknown,
): Promise<boolean> {
  const email = normalizeEmail(rawEmail);
  const code = typeof rawCode === 'string' ? rawCode.trim() : '';

  if (!isValidEmail(email) || !/^\d{8}$/.test(code) || purpose === 'reset') {
    return false;
  }

  const identifier = rateIdentifier(email, purpose);

  const record = await prisma.verification.findFirst({
    where: {
      identifier,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!record || record.expiresAt.getTime() <= Date.now()) {
    if (record) {
      await prisma.verification.deleteMany({
        where: {
          identifier,
        },
      });
    }

    return false;
  }

  let stored: {
    hash?: string;
    attempts?: number;
  };

  try {
    stored = JSON.parse(record.value);
  } catch {
    await prisma.verification.deleteMany({
      where: {
        identifier,
      },
    });

    return false;
  }

  const attempts = stored.attempts ?? 0;

  if (
    !stored.hash ||
    !Number.isSafeInteger(attempts) ||
    attempts < 0 ||
    attempts >= MAX_OTP_ATTEMPTS
  ) {
    await prisma.verification.deleteMany({
      where: {
        identifier,
      },
    });

    return false;
  }

  const nextValue = JSON.stringify({
    hash: stored.hash,
    attempts: attempts + 1,
  });

  const attemptResult = await prisma.verification.updateMany({
    where: {
      id: record.id,
      value: record.value,
      expiresAt: {
        gt: new Date(),
      },
    },
    data: {
      value: nextValue,
    },
  });

  if (attemptResult.count !== 1) {
    return false;
  }

  const candidateHash = Buffer.from(codeHash(code), 'hex');
  const expectedHash = Buffer.from(stored.hash, 'hex');

  const matches =
    candidateHash.length === expectedHash.length && timingSafeEqual(candidateHash, expectedHash);

  if (!matches) {
    if (attempts + 1 >= MAX_OTP_ATTEMPTS) {
      await prisma.verification.deleteMany({
        where: {
          id: record.id,
          value: nextValue,
        },
      });
    }

    return false;
  }

  await prisma.verification.deleteMany({
    where: {
      id: record.id,
      value: nextValue,
    },
  });

  return true;
}

export async function consumePasswordResetOtp(rawCode: unknown): Promise<string | null> {
  const code = typeof rawCode === 'string' ? rawCode.trim() : '';

  if (!/^\d{8}$/.test(code)) {
    return null;
  }

  const hash = codeHash(code);

  const matches = await prisma.user.findMany({
    where: {
      resetOtpHash: hash,
    },
    select: {
      id: true,
      emailVerified: true,
      resetOtpExpiresAt: true,
      resetOtpAttempts: true,
    },
    take: 2,
  });

  if (matches.length !== 1) {
    return null;
  }

  const user = matches[0];
  const now = new Date();

  if (
    !user.emailVerified ||
    !user.resetOtpExpiresAt ||
    user.resetOtpExpiresAt.getTime() <= now.getTime() ||
    user.resetOtpAttempts >= MAX_OTP_ATTEMPTS
  ) {
    await prisma.user.updateMany({
      where: {
        id: user.id,
        resetOtpHash: hash,
      },
      data: {
        resetOtpHash: null,
        resetOtpExpiresAt: null,
        resetOtpCreatedAt: null,
        resetOtpAttempts: 0,
      },
    });

    return null;
  }

  const attempt = await prisma.user.updateMany({
    where: {
      id: user.id,
      resetOtpHash: hash,
      resetOtpAttempts: user.resetOtpAttempts,
      resetOtpExpiresAt: {
        gt: now,
      },
    },
    data: {
      resetOtpAttempts: {
        increment: 1,
      },
    },
  });

  if (attempt.count !== 1) {
    return null;
  }

  const consumed = await prisma.user.updateMany({
    where: {
      id: user.id,
      resetOtpHash: hash,
      resetOtpAttempts: user.resetOtpAttempts + 1,
      resetOtpExpiresAt: {
        gt: now,
      },
    },
    data: {
      resetOtpHash: null,
      resetOtpExpiresAt: null,
      resetOtpCreatedAt: null,
      resetOtpAttempts: 0,
    },
  });

  return consumed.count === 1 ? user.id : null;
}
