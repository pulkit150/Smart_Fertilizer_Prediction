// fertilizerRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Routes for the core ML recommendation feature.
//
// POST /api/fertilizer/recommend
//   → OPEN (no token required). Works for guests too, but if a token IS sent,
//     the recommendation gets saved to the user's history in MongoDB.
//     This is intentional: we don't want to block farmers who haven't signed up
//     from trying the tool. Auth is optional here.
//
// GET /api/fertilizer/history
//   → PROTECTED. Returns the logged-in user's past recommendations.
//     Guests have no history to show, so protecting this makes sense.
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const { getRecommendation, getHistory } = require("../controllers/fertilizerController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// No `protect` here — the controller checks req.user internally (optional auth)
router.post("/recommend", getRecommendation);

// protect is required here — must be logged in to view history
router.get("/history", protect, getHistory);

module.exports = router;
