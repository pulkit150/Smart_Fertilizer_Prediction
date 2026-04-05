// weatherRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// Single public endpoint: GET /api/weather?city=Mumbai
//
// This is public (no auth) so the frontend WeatherWidget can fetch weather
// before the user even logs in. The recommendation form uses this to
// auto-display conditions alongside the soil input form.
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const { fetchWeather } = require("../controllers/weatherController");

const router = express.Router();

router.get("/", fetchWeather);

module.exports = router;
