// productRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Routes for the fertilizer marketplace.
//
// PUBLIC ROUTES:
//   GET  /api/products          → list all products
//   GET  /api/products/:id      → single product detail
//
// ADMIN-ONLY ROUTES:
//   POST /api/products          → create new product
//   PUT  /api/products/:id      → update product
//   DELETE /api/products/:id    → delete product
//   POST /api/products/seed     → populate DB with starter data (development)
//
// Route ORDER matters in Express!
// /api/products/seed must be defined BEFORE /api/products/:id because ":id" is 
// a wildcard — Express would try to find a product with id="seed".
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const {
  getProducts,
  getProductById,
  seedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

const router = express.Router();

// Public routes
router.get("/", getProducts);

// Admin routes (must be before /:id to avoid wildcard matching)
router.post("/seed", protect, adminOnly, seedProducts);
router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

// Public route (after admin routes)
router.get("/:id", getProductById);

module.exports = router;

