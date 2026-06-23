import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import rateLimit from 'express-rate-limit';
import { Types } from 'mongoose';
import { Order } from '../models/Order';
import { protect, AuthRequest } from '../middleware/auth';
import { createStripeCheckoutSession, constructStripeWebhookEvent } from '../services/payment';

const router = Router();

const webhookRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many webhook requests, please try again later.' },
});

const checkoutSessionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many checkout session requests, please try again later.' },
});

// POST /api/stripe/checkout-session
// Creates a Stripe Checkout Session and returns the URL to redirect to
router.post('/checkout-session', checkoutSessionRateLimiter, protect, async (req: AuthRequest, res: Response) => {
  try {
    const { items, orderId } = req.body;
    if (!items?.length) return res.status(400).json({ message: 'No items' });

    const origin = req.headers.origin || process.env.CLIENT_URL || 'http://localhost:3000';

    const result = await createStripeCheckoutSession({
      items,
      orderId: orderId || '',
      userId: req.user?.id || '',
      origin,
    });

    res.json({ url: result.url, sessionId: result.sessionId });
  } catch (err: unknown) {
    console.error('Stripe session error:', err);
    res.status(500).json({ message: 'Stripe error', error: String(err) });
  }
});

// POST /api/stripe/webhook — Stripe sends events here
// Must have raw body (configured in index.ts with express.raw)
router.post('/webhook', webhookRateLimiter, async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    event = constructStripeWebhookEvent(req.body, sig, secret);
  } catch (err) {
    console.error('Webhook signature error:', err);
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (typeof orderId === 'string' && Types.ObjectId.isValid(orderId)) {
      await Order.findByIdAndUpdate(new Types.ObjectId(orderId), {
        status: 'processing',
        stripeSessionId: session.id,
        paidAt: new Date(),
      });
      console.log(`✅ Order ${orderId} marked as paid via Stripe`);
    } else if (orderId !== undefined) {
      console.warn('Ignoring webhook with invalid orderId metadata');
    }
  }

  res.json({ received: true });
});

export default router;
