// fertilizerRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Routes for the core ML recommendation feature.
//
// POST /api/fertilizer/recommend
//   → PROTECTED. User must be logged in. The recommendation is saved to 
//     the user's history in MongoDB with their user ID.
//
// GET /api/fertilizer/history
//   → PROTECTED. Returns the logged-in user's past recommendations.
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const { getRecommendation, getHistory } = require("../controllers/fertilizerController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Protect the recommend endpoint so req.user is set and recommendations are saved
router.post("/recommend", protect, getRecommendation);

// protect is required here — must be logged in to view history
router.get("/history", protect, getHistory);

module.exports = router;
