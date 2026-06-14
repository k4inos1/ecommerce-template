/**
 * Payment Service — unified interface for Stripe and WebPay (Transbank) payments.
 * Routes delegate all payment logic here; this keeps route handlers thin.
 */
import Stripe from 'stripe';
import { WebpayPlus, Options, IntegrationCommerceCodes, IntegrationApiKeys, Environment } from 'transbank-sdk';

// ─── Stripe ─────────────────────────────────────────────────────────────────

if (!process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
  console.error(
    'CRITICAL: STRIPE_SECRET_KEY is not set in production. All payment operations will fail. ' +
    'This must be configured before accepting live payments.'
  );
}

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        'STRIPE_SECRET_KEY is not configured. Set this environment variable to enable Stripe payments.'
      );
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export interface StripeCheckoutItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface StripeCheckoutParams {
  items: StripeCheckoutItem[];
  orderId: string;
  userId: string;
  origin: string;
  customerEmail?: string;
}

export interface StripeCheckoutResult {
  url: string;
  sessionId: string;
}

/**
 * Creates a Stripe Checkout Session and returns the redirect URL.
 */
export async function createStripeCheckoutSession(
  params: StripeCheckoutParams
): Promise<StripeCheckoutResult> {
  const { items, orderId, userId, origin, customerEmail } = params;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
        ...(item.image?.startsWith('http') ? { images: [item.image] } : {}),
      },
      unit_amount: Math.round(item.price * 100), // cents
    },
    quantity: item.quantity,
  }));

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
    cancel_url: `${origin}/checkout?cancelled=1`,
    customer_email: customerEmail,
    metadata: { userId, orderId },
    shipping_address_collection: {
      allowed_countries: ['CL', 'AR', 'CO', 'MX', 'PE', 'ES', 'US'],
    },
  });

  return { url: session.url!, sessionId: session.id };
}

/**
 * Constructs and verifies a Stripe webhook event from raw body + signature.
 * Returns the Stripe event or throws on failure.
 */
export function constructStripeWebhookEvent(
  rawBody: Buffer | string,
  signature: string,
  secret?: string
): Stripe.Event {
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}

// ─── WebPay (Transbank) ──────────────────────────────────────────────────────

const isProduction =
  process.env.NODE_ENV === 'production' && !!process.env.TRANSBANK_COMMERCE_CODE;

function getTransbankOptions(): Options {
  if (isProduction) {
    return new Options(
      process.env.TRANSBANK_COMMERCE_CODE!,
      process.env.TRANSBANK_API_KEY!,
      Environment.Production
    );
  }
  return new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    Environment.Integration
  );
}

export interface TransbankCreateParams {
  totalAmount: number;
  orderId: string;
  userId: string;
  returnUrl: string;
}

export interface TransbankCreateResult {
  token: string;
  url: string;
}

export interface TransbankConfirmResult {
  success: boolean;
  response: Record<string, unknown>;
}

/**
 * Initiates a WebPay Plus transaction and returns the redirect token + URL.
 */
export async function createTransbankTransaction(
  params: TransbankCreateParams
): Promise<TransbankCreateResult> {
  const { totalAmount, orderId, userId, returnUrl } = params;

  const buyOrder = `ORDER-${orderId || Date.now()}`.slice(0, 26);
  const sessionId = `SES-${userId}-${Date.now()}`.slice(0, 61);
  const amount = Math.round(totalAmount); // WebPay requires integer (CLP)

  const tx = new WebpayPlus.Transaction(getTransbankOptions());
  const resp = await tx.create(buyOrder, sessionId, amount, returnUrl);

  return { token: resp.token, url: resp.url };
}

/**
 * Confirms a WebPay Plus transaction by committing the token.
 * Returns success flag and the raw Transbank response.
 */
export async function confirmTransbankTransaction(
  token_ws: string
): Promise<TransbankConfirmResult> {
  const tx = new WebpayPlus.Transaction(getTransbankOptions());
  // The SDK's TypeScript types don't expose .commit() — cast via unknown
  const response = await (tx as unknown as { commit: (token: string) => Promise<Record<string, unknown>> }).commit(token_ws);

  return {
    success: response.response_code === 0,
    response,
  };
}
