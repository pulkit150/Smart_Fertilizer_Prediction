const { createPaymentIntent } = require("../services/stripeService");
const Order = require("../models/Order");

// POST /api/payments/create-intent
// Creates a Stripe PaymentIntent and returns clientSecret to frontend
const createIntent = async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  // Make sure it belongs to the logged-in user
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }

  // Create Stripe PaymentIntent
  const paymentIntent = await createPaymentIntent(order.totalAmount, "inr");

  // Save Stripe ID to order for later webhook verification
  order.stripePaymentIntentId = paymentIntent.id;
  await order.save();

  res.json({
    success: true,
    clientSecret: paymentIntent.client_secret,
    amount: order.totalAmount,
  });
};

// POST /api/payments/confirm — called after successful payment on frontend
const confirmPayment = async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = "paid";
  await order.save();

  res.json({ success: true, message: "Payment confirmed", order });
};

module.exports = { createIntent, confirmPayment };
