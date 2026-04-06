const { getPrediction } = require("../services/mlService");
const { getWeather } = require("../services/weatherService");
const Recommendation = require("../models/Recommendation");
const asyncHandler = require("../middleware/asyncHandler");

// POST /api/fertilizer/recommend
const getRecommendation = asyncHandler(async (req, res) => {
  const { nitrogen, phosphorus, potassium, pH, moisture, crop, city, soilType } = req.body;

  if (!crop) {
    return res.status(400).json({ message: "Crop type is required" });
  }

  // 1. Fetch current weather (auto or from user-provided city)
  const weather = await getWeather(city || "Delhi");

  // 2. Build ML payload — matches the exact feature schema the model was trained on:
  //    Temperature, Humidity, Moisture, Soil_Type, Crop_Type,
  //    Nitrogen, Potassium, Phosphorous
  const mlPayload = {
    N: Number(nitrogen) || 0,
    P: Number(phosphorus) || 0,
    K: Number(potassium) || 0,
    temperature: weather.temperature,
    humidity: weather.humidity,
    pH: Number(pH) || 7,
    rainfall: weather.rainfall,
    crop,
    soil_type: soilType || "Loamy",  // new: passed to ML for soil-type encoding
    moisture: Number(moisture) || 50, // new: passed as a real feature (21.7% importance)
  };

  // 3. Call ML microservice
  const mlResponse = await getPrediction(mlPayload);

  // 4. Save recommendation to DB (only if user is logged in)
  let savedRec = null;
  if (req.user) {
    savedRec = await Recommendation.create({
      user: req.user._id,
      soilInput: { nitrogen, phosphorus, potassium, pH, moisture, crop, soilType },
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
});

// GET /api/fertilizer/history — user's past recommendations
const getHistory = asyncHandler(async (req, res) => {
  const history = await Recommendation.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, history });
});

module.exports = { getRecommendation, getHistory };