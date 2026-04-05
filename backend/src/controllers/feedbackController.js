// feedbackController.js
// ─────────────────────────────────────────────────────────────────────────────
// Handles the "Effectiveness Tracker" feature — farmers record what happened
// after they used a recommended fertilizer. This data could later be used to
// improve the ML model with real-world outcomes.
//
// Two endpoints:
//   POST /api/feedback   → submit new feedback
//   GET  /api/feedback   → view your own past feedback
// ─────────────────────────────────────────────────────────────────────────────

const Feedback = require("../models/Feedback");

// POST /api/feedback
// The farmer fills in a form: which fertilizer they used, a rating, yield change, notes
const submitFeedback = async (req, res) => {
  const { fertilizerUsed, rating, yieldChange, notes, recommendationId, productId } = req.body;

  // Basic validation — these two fields are the minimum we need
  if (!fertilizerUsed || !rating) {
    return res.status(400).json({ message: "fertilizerUsed and rating are required" });
  }

  // Create the document in MongoDB.
  // req.user._id is attached by the authMiddleware — we know who is submitting.
  const feedback = await Feedback.create({
    user: req.user._id,
    fertilizerUsed,
    rating: Number(rating),
    yieldChange,
    notes,
    // These are optional — link to the specific recommendation or product if provided
    recommendation: recommendationId || null,
    product: productId || null,
  });

  res.status(201).json({ success: true, feedback });
};

// GET /api/feedback
// Returns the logged-in user's own feedback entries, newest first
const getUserFeedback = async (req, res) => {
  const feedbacks = await Feedback.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    // populate() replaces the ObjectId with actual product data from the Product collection
    .populate("product", "name brand")
    .limit(20);

  res.json({ success: true, feedbacks });
};

module.exports = { submitFeedback, getUserFeedback };
