// productRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Routes for the fertilizer marketplace.
//
// GET  /api/products          → list all products (public)
// GET  /api/products/:id      → single product detail (public)
// POST /api/products/seed     → populate DB with starter data (dev only)
//
// Why is /seed a POST and not protected?
// For simplicity in development. In production you would:
//   1. Remove the seed route entirely, OR
//   2. Add `protect` + an admin role check middleware
//
// Route ORDER matters in Express!
// /api/products/seed must be defined BEFORE /api/products/:id
// because ":id" is a wildcard — if seed came after, Express would
// try to find a product with id="seed" and return 404.
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const { getProducts, getProductById, seedProducts } = require("../controllers/productController");

const router = express.Router();

router.post("/seed", seedProducts);  // ← must be before /:id
router.get("/", getProducts);
router.get("/:id", getProductById);

module.exports = router;
