import Stripe from 'stripe';

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(secret, {
  apiVersion: '2024-12-03',
});

export default stripe;
