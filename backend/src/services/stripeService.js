const Stripe = require("stripe");

// Initialize Stripe with secret key
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

/**
 * Create a Stripe PaymentIntent for a given amount.
 * @param {number} amount - Amount in smallest currency unit (paise/cents)
 * @param {string} currency - e.g. "inr" or "usd"
 */
const createPaymentIntent = async (amount, currency = "inr") => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // convert to paise/cents
    currency,
    automatic_payment_methods: { enabled: true },
  });

  return paymentIntent;
};

/**
 * Verify a Stripe webhook event signature.
 */
const verifyWebhook = (payload, signature) => {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

module.exports = { createPaymentIntent, verifyWebhook };
