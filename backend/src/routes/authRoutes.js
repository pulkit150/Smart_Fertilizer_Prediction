// authRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Express Router groups all auth-related URLs under /api/auth (set in server.js).
//
// Public routes (no token needed):
//   POST /api/auth/register  → create account
//   POST /api/auth/login     → get JWT token
//
// Protected route (token required):
//   GET  /api/auth/me        → return the logged-in user's profile
//
// The `protect` middleware runs BEFORE getMe — it checks the token and attaches
// req.user. Only if the token is valid does Express continue to getMe.
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe); // protect runs first, then getMe

module.exports = router;
