const { getPrediction } = require("../services/mlService");
const { getWeather } = require("../services/weatherService");
const Recommendation = require("../models/Recommendation");

// POST /api/fertilizer/recommend
const getRecommendation = async (req, res) => {
  const { nitrogen, phosphorus, potassium, pH, moisture, crop, city } = req.body;

  if (!crop) {
    return res.status(400).json({ message: "Crop type is required" });
  }

  // 1. Fetch current weather (auto or from user-provided city)
  const weather = await getWeather(city || "Delhi");

  // 2. Build ML payload
  const mlPayload = {
    N: nitrogen || 0,
    P: phosphorus || 0,
    K: potassium || 0,
    temperature: weather.temperature,
    humidity: weather.humidity,
    pH: pH || 7,
    rainfall: weather.rainfall,
    crop,
  };

  // 3. Call ML microservice
  const mlResponse = await getPrediction(mlPayload);

  // 4. Save recommendation to DB (only if user is logged in)
  let savedRec = null;
  if (req.user) {
    savedRec = await Recommendation.create({
      user: req.user._id,
      soilInput: { nitrogen, phosphorus, potassium, pH, moisture, crop },
      weatherSnapshot: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        rainfall: weather.rainfall,
        location: weather.city,
      },
      topResults: mlResponse.recommendations.map((r) => ({
        fertilizerName: r.fertilizer,
        score: r.score,
        explanation: r.explanation,
      })),
    });
  }

  res.json({
    success: true,
    weather,
    recommendations: mlResponse.recommendations,
    recommendationId: savedRec?._id || null,
  });
};

// GET /api/fertilizer/history — user's past recommendations
const getHistory = async (req, res) => {
  const history = await Recommendation.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, history });
};

module.exports = { getRecommendation, getHistory };
