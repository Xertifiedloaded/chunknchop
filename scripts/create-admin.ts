import dotenv from 'dotenv';

dotenv.config({ path: '.env.development.local' });
dotenv.config();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !name || !password) {
    throw new Error('Set ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD before running this script.');
  }
  if (password.length < 12 || password.length > 256) {
    throw new Error('ADMIN_PASSWORD must be between 12 and 256 characters long.');
  }

  const [{ createOrUpdateCredential, getCredentialAccount }, { prisma }] = await Promise.all([
    import('@/lib/auth'),
    import('@/lib/prisma'),
  ]);

  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      user = await prisma.user.create({
        data: { email, name, emailVerified: true, role: 'admin' },
      });
    else
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'admin', emailVerified: true },
      });

    const credential = await getCredentialAccount(user.id);
    if (!credential) await createOrUpdateCredential(user.id, password);

    console.info(`Admin account is ready for ${email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Could not create the admin account.', error);
  process.exitCode = 1;
});
