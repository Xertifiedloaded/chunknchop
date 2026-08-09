import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { paystack } from '../lib/paystack';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const stuckOrders = await prisma.order.findMany({
    where: {
      paymentStatus: 'PENDING',
      paystackReference: { not: null },
    },
  });

  console.log(`Found ${stuckOrders.length} pending order(s) with a saved reference.`);

  let fixed = 0;
  let stillPending = 0;
  let mismatched = 0;
  let errored = 0;

  for (const order of stuckOrders) {
    try {
      const verified = await paystack.verifyTransaction(order.paystackReference!);
      const transaction = verified.data;

      if (transaction.status !== 'success') {
        stillPending++;
        continue;
      }

      const expectedAmount = Math.round(Number(order.total) * 100);
      if (transaction.amount !== expectedAmount) {
        console.warn(`Order ${order.id} (${order.orderNumber}): amount mismatch — expected ${expectedAmount}, got ${transaction.amount}. Skipping, needs manual review.`);
        mismatched++;
        continue;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'PROCESSING',
          paidAt: transaction.paid_at ? new Date(transaction.paid_at) : new Date(),
        },
      });

      console.log(`Order ${order.id} (${order.orderNumber}): fixed → PAID`);
      fixed++;
    } catch (err) {
      console.error(`Order ${order.id} (${order.orderNumber}): error verifying —`, err);
      errored++;
    }
  }

  console.log('\nDone.');
  console.log(`  Fixed:         ${fixed}`);
  console.log(`  Still pending: ${stillPending}`);
  console.log(`  Amount mismatch (needs review): ${mismatched}`);
  console.log(`  Errored:       ${errored}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
