// Admin Role Check Middleware
// ─────────────────────────────────────────────────────────────────────────────
// This middleware ensures the request comes from an authenticated admin user.
// It should be used AFTER the `protect` middleware (which sets req.user).
//
// Usage:
//   router.post("/products", protect, adminOnly, createProduct)
//
// If the user exists but is NOT an admin, returns 403 Forbidden.
// If the user doesn't exist, this middleware won't be reached (protect handles it).
// ─────────────────────────────────────────────────────────────────────────────

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized, no user" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized, admin only" });
  }

  next();
};

module.exports = { adminOnly };
