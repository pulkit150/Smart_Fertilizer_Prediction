// feedbackRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Both feedback routes are protected — feedback is personal and tied to a user.
//
// POST /api/feedback  → submit effectiveness data after using a fertilizer
// GET  /api/feedback  → view your own past feedback entries
//
// Future idea: add a GET /api/feedback/summary endpoint that aggregates all
// user feedback by fertilizer name — useful for improving ML recommendations.
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const { submitFeedback, getUserFeedback } = require("../controllers/feedbackController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", submitFeedback);
router.get("/", getUserFeedback);

module.exports = router;
