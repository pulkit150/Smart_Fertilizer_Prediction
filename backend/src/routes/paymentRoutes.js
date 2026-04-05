// paymentRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Stripe payment flow (simplified):
//
// Step 1 → Frontend sends orderId to POST /api/payments/create-intent
//           Backend creates a Stripe PaymentIntent and returns a `clientSecret`
//
// Step 2 → Frontend uses the clientSecret with Stripe.js to collect card details
//           and confirm the payment (all happens in the browser — card data never
//           touches our server, which is the whole point of Stripe)
//
// Step 3 → After success, frontend calls POST /api/payments/confirm
//           Backend updates the order status to "paid" in MongoDB
//
// In production you would also set up a Stripe Webhook (POST /api/payments/webhook)
// to handle payment confirmation server-side — more reliable than Step 3 above.
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const { createIntent, confirmPayment } = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // both payment routes require login

router.post("/create-intent", createIntent);
router.post("/confirm", confirmPayment);

module.exports = router;
