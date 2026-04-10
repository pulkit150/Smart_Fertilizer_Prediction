// pages/Recommendation.jsx
// ─────────────────────────────────────────────────────────────────────────────
// This is the core feature page. Here's the full data flow:
//
//  User fills form
//       ↓
//  handleSubmit() called
//       ↓
//  POST /api/fertilizer/recommend  (our Express backend)
//       ↓                ↓
//  Backend calls     Backend calls
//  weatherService    mlService
//       ↓                ↓
//  Weather data      Top 3 predictions
//       ↓                ↓
//  Both merged into one response → setResults() → React re-renders UI
//
// STATE MANAGEMENT explained:
// - form: the controlled form values (each input updates this object)
// - results: the top 3 ML predictions (null until fetch succeeds)
// - weather: weather snapshot shown alongside results
// - loading: disables the submit button and shows a spinner message
// - error: shown in red if the API call fails
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

// ── Crop list ──────────────────────────────────────────────────────────────
// RULE: Any crop you add here MUST also exist in the ML training data.
// If the model hasn't seen a crop, it maps it to the closest known class.
// Currently trained on: Cotton, Maize, Paddy, Sugarcane, Tobacco, Wheat,
//                       Banana, Potato  (added when MOP was introduced)
const CROPS = [
  "wheat", "maize", "paddy", "sugarcane", "cotton", "tobacco",
  "banana", "potato",   // ← MOP targets these two — added along with MOP
];

// Medal emojis and card styles for 1st, 2nd, 3rd place
const RANK_STYLES = [
  { medal: "🥇", border: "border-green-400 bg-green-50", badge: "bg-green-600" },
  { medal: "🥈", border: "border-gray-300 bg-white",    badge: "bg-gray-500"  },
  { medal: "🥉", border: "border-orange-300 bg-orange-50", badge: "bg-orange-500" },
];

export default function Recommendation() {
  // ── State ──────────────────────────────────────────────────────────────────

  const [form, setForm] = useState({
    nitrogen: 40,
    phosphorus: 20,
    potassium: 30,
    pH: 6.5,
    moisture: 50,
    crop: "wheat",
    soilType: "Loamy",
    city: "Delhi",
  });

  const [results, setResults]   = useState(null);
  const [weather, setWeather]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // ── Handlers ───────────────────────────────────────────────────────────────

  // Generic change handler — e.target.name maps directly to form keys
  // So one function handles ALL inputs instead of one per field
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the HTML form from doing a full page reload

    setLoading(true);
    setError("");
    setResults(null);
    setWeather(null);

    try {
      // The backend receives soil data, auto-fetches weather,
      // calls the ML microservice, and returns everything in one response
      const { data } = await api.post("/fertilizer/recommend", form);
      setResults(data.recommendations);
      setWeather(data.weather);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not connect. Make sure the backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Sub-components (defined locally to keep file self-contained) ───────────

  // Reusable labelled number input — avoids repeating className on every field
  const Field = ({ label, name, min = 0, max = 200, step = "1", hint }) => (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      <input
        type="number"
        name={name}
        value={form[name]}
        min={min}
        max={max}
        step={step}
        onChange={handleChange}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white transition"
      />
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-700">🌾 Fertilizer Recommendation</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Enter your soil data below. Weather is fetched automatically from your city.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

        {/* ── LEFT COLUMN: Input Form ── */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">

          {/* Section 1: Soil nutrients */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Soil Nutrients (kg / hectare)
            </h2>
            <div className="space-y-3">
              <Field label="Nitrogen (N)"   name="nitrogen"   max={140} hint="0–140" />
              <Field label="Phosphorus (P)" name="phosphorus" max={140} hint="0–140" />
              <Field label="Potassium (K)"  name="potassium"  max={200} hint="0–200" />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 2: Soil conditions */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Soil Conditions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="pH Level"    name="pH"       min={0} max={14} step="0.1" hint="0–14" />
              <Field label="Moisture %" name="moisture"  min={0} max={100} hint="0–100" />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Section 3: Crop and location */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Crop & Location
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Soil Type
                </label>
                <select
                  name="soilType"
                  value={form.soilType}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                >
                  {["Sandy", "Loamy", "Black", "Red", "Clayey"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Crop Type
                </label>
                <select
                  name="crop"
                  value={form.crop}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                >
                  {CROPS.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  City (for live weather)
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai, Pune, Bhopal"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-base hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          >
            {loading ? "🔄 Analysing..." : "Get My Recommendations →"}
          </button>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex gap-2">
              <span>⚠</span> <span>{error}</span>
            </div>
          )}
        </form>

        {/* ── RIGHT COLUMN: Results ── */}
        <div className="space-y-4">

          {/* Weather snapshot card */}
          {weather && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-bold text-blue-700 mb-3">
                🌦 Current Weather — {weather.city}
              </p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Temperature", value: `${weather.temperature}°C`, icon: "🌡" },
                  { label: "Humidity",    value: `${weather.humidity}%`,    icon: "💧" },
                  { label: "Rainfall",    value: `${weather.rainfall}mm`,   icon: "🌧" },
                ].map((w) => (
                  <div key={w.label} className="bg-white rounded-xl p-3 border border-blue-100">
                    <p className="text-lg mb-0.5">{w.icon}</p>
                    <p className="font-bold text-gray-700 text-sm">{w.value}</p>
                    <p className="text-xs text-gray-400">{w.label}</p>
                  </div>
                ))}
              </div>
              {/* Warn user they're seeing mock data */}
              {weather.isMock && (
                <p className="text-xs text-orange-500 mt-2 bg-orange-50 rounded-lg p-2">
                  ⚡ Using mock weather data. Set <code className="font-mono">WEATHER_API_KEY</code> in backend .env for real conditions.
                </p>
              )}
            </div>
          )}

          {/* Recommendation cards — one per top-3 result */}
          {results &&
            results.map((r, i) => {
              const style = RANK_STYLES[i];
              return (
                <div
                  key={i}
                  className={`border-2 rounded-2xl p-5 shadow-sm transition-all ${style.border}`}
                >
                  {/* Header row: name + score badge */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xl mr-1">{style.medal}</span>
                      <span className="font-bold text-gray-800">{r.fertilizer}</span>
                    </div>
                    <span className={`text-white text-sm font-bold px-3 py-1 rounded-full ${style.badge}`}>
                      {r.score}%
                    </span>
                  </div>

                  {/* Visual score bar */}
                  {/* The width is set inline as a percentage based on the score.
                      transition-all causes it to animate from 0% to the score on render */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all duration-700"
                      style={{ width: `${r.score}%` }}
                    />
                  </div>

                  {/* Explanation text — the "explainability" feature */}
                  {/* This plain-English reason comes directly from the ML service */}
                  <p className="text-xs text-gray-500 italic leading-relaxed">
                    💡 {r.explanation}
                  </p>

                  {/* Link to marketplace filtered to this fertilizer */}
                  {i === 0 && (
                    <Link
                      to="/marketplace"
                      className="mt-3 inline-block text-xs text-green-600 font-semibold hover:underline"
                    >
                      Buy this fertilizer in Marketplace →
                    </Link>
                  )}
                </div>
              );
            })}

          {/* Skeleton / empty state before first submission */}
          {!results && !loading && (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-300">
              <p className="text-5xl mb-3">🌱</p>
              <p className="text-sm font-medium text-gray-400">
                Your top 3 recommendations<br />will appear here
              </p>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white border rounded-2xl p-5 animate-pulse">
                  <div className="flex justify-between mb-3">
                    <div className="h-4 bg-gray-200 rounded w-40" />
                    <div className="h-6 bg-gray-200 rounded-full w-12" />
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full mb-3" />
                  <div className="h-3 bg-gray-100 rounded w-4/5" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}