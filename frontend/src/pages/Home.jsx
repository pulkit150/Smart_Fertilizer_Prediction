// pages/Home.jsx
// ─────────────────────────────────────────────────────────────────────────────
// This is a purely presentational page — it makes NO API calls.
// It just shows marketing content and links to the real feature pages.
//
// Notice we use <Link> from react-router-dom instead of <a href>.
// Link intercepts the click, updates the URL, and swaps the page component
// WITHOUT a full browser reload. This is what makes React a "Single Page App".
// ─────────────────────────────────────────────────────────────────────────────
import { Link } from "react-router-dom";

export default function Home() {
  // Feature cards data — keeping data separate from JSX makes it easy to add more
  const features = [
    {
      icon: "🧪",
      title: "Soil Analysis",
      desc: "Input your Nitrogen, Phosphorus, Potassium, pH and moisture levels to get a field-specific recommendation.",
    },
    {
      icon: "🌦️",
      title: "Weather-Aware",
      desc: "Real-time local temperature, humidity and rainfall are automatically factored into every prediction.",
    },
    {
      icon: "🤖",
      title: "ML-Powered Scoring",
      desc: "Our model scores every fertilizer against your exact soil profile and returns the top 3 matches.",
    },
    {
      icon: "🛒",
      title: "Buy Instantly",
      desc: "Order the top recommended fertilizer directly from our marketplace with one click.",
    },
    {
      icon: "📊",
      title: "Track Effectiveness",
      desc: "After the season, record your actual yield change. Your feedback helps improve future recommendations.",
    },
    {
      icon: "🔍",
      title: "Transparent Reasoning",
      desc: "Every recommendation comes with a plain-English explanation of exactly why it was chosen.",
    },
  ];

  const steps = [
    { num: "1", title: "Enter Soil Data", desc: "Fill in your NPK levels, pH, moisture and crop type." },
    { num: "2", title: "AI Analyses", desc: "Our ML model combines your data with live weather conditions." },
    { num: "3", title: "Get Top 3 Picks", desc: "Receive ranked fertilizer recommendations with scores and reasons." },
    { num: "4", title: "Order & Track", desc: "Buy directly and track fertilizer effectiveness over time." },
  ];

  return (
    <div className="space-y-16">
      {/* ── Hero Section ── */}
      <section className="text-center py-12">
        <div className="inline-block bg-green-100 text-green-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
          🌱 AI-Powered Crop Nutrition
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight max-w-2xl mx-auto">
          Smarter Fertilizer.<br />
          <span className="text-green-600">Better Harvests.</span>
        </h1>
        <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
          Tell us about your soil and crop. We analyse your data with real weather
          conditions and recommend the best fertilizer — instantly and free.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            to="/recommend"
            className="bg-green-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
          >
            Get Recommendation →
          </Link>
          <Link
            to="/marketplace"
            className="border-2 border-green-600 text-green-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-green-50 transition-all"
          >
            Browse Fertilizers
          </Link>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">How It Works</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <div key={step.num} className="text-center relative">
              {/* Connector line between steps (not on last step) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-5 left-1/2 w-full h-0.5 bg-green-200 z-0" />
              )}
              <div className="relative z-10 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-3">
                {step.num}
              </div>
              <h3 className="font-semibold text-gray-800 mb-1 text-sm">{step.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Everything You Need</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-green-600 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Ready to grow smarter?</h2>
        <p className="text-green-100 mb-5">Join farmers using data to make better decisions.</p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/recommend"
            className="bg-white text-green-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-green-50 transition"
          >
            Try It Free
          </Link>
          <Link
            to="/login"
            className="border border-white text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition"
          >
            Create Account
          </Link>
        </div>
      </section>
    </div>
  );
}
