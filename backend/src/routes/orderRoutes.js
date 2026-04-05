// orderRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// All order routes require authentication — you must be logged in to:
//   - Create an order (POST /api/orders)
//   - View your orders (GET /api/orders)
//   - View a specific order (GET /api/orders/:id)
//
// The `protect` middleware checks the JWT and sets req.user.
// The controller then uses req.user._id to associate the order with the user,
// and to enforce that users can only see their OWN orders (not others').
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const { createOrder, getUserOrders, getOrderById } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes here need a valid token
router.use(protect); // apply protect to ALL routes in this file at once

router.post("/", createOrder);
router.get("/", getUserOrders);
router.get("/:id", getOrderById);

module.exports = router;
