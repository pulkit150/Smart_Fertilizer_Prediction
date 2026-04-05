const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // What the user entered
    soilInput: {
      nitrogen: Number,
      phosphorus: Number,
      potassium: Number,
      pH: Number,
      moisture: Number,
      crop: String,
    },
    // Weather snapshot at time of recommendation
    weatherSnapshot: {
      temperature: Number,
      humidity: Number,
      rainfall: Number,
      location: String,
    },
    // Top 3 results from ML service
    topResults: [
      {
        fertilizerName: String,
        score: Number,         // 0–100 match score
        explanation: String,   // why this was recommended
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recommendation", recommendationSchema);
