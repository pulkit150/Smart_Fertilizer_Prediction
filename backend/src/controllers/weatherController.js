// weatherController.js
// ─────────────────────────────────────────────────────────────────────────────
// This controller's only job: receive an HTTP request, call the weatherService,
// and send the result back as JSON.
//
// Why a separate service layer instead of putting the fetch logic here?
// → So the same weather-fetching code can be called by TWO places:
//   1. This route (/api/weather) — when the frontend wants weather data directly
//   2. fertilizerController — which auto-fetches weather before calling the ML API
// Keeping logic in a service avoids copy-pasting code.
// ─────────────────────────────────────────────────────────────────────────────

const { getWeather } = require("../services/weatherService");

// GET /api/weather?city=Delhi
const fetchWeather = async (req, res) => {
  // req.query.city comes from the URL: /api/weather?city=Mumbai
  // If city is not provided, we default to "Delhi"
  const city = req.query.city || "Delhi";

  const weather = await getWeather(city);

  res.json({
    success: true,
    weather,
  });
};

module.exports = { fetchWeather };
