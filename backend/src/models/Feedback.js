const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recommendation: { type: mongoose.Schema.Types.ObjectId, ref: "Recommendation" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    fertilizerUsed: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    yieldChange: { type: String }, // e.g. "+20%", "same", "-5%"
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
