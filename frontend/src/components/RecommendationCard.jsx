// components/RecommendationCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// A reusable card that displays ONE fertilizer recommendation result.
// It receives data via props from the Recommendation page.
//
// WHAT ARE PROPS?
// Props are how parent components pass data to child components.
// The Recommendation page maps over the results array and renders one
// RecommendationCard per result, passing different data each time:
//
//   results.map((r, i) => <RecommendationCard key={i} result={r} rank={i} />)
//
// This component is "dumb" — it only displays what it receives.
// It has no state, no API calls. That's what makes it reusable.
//
// PROP BREAKDOWN:
//   result = { fertilizer: "Urea", score: 92, explanation: "..." }
//   rank   = 0, 1, or 2 (determines medal and styling)
//   onBuy  = optional callback when "Buy Now" is clicked
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from "react-router-dom";

// Medal emojis and color schemes for rank 0, 1, 2
const RANK_CONFIG = [
  {
    medal: "🥇",
    border: "border-green-400",
    bg: "bg-green-50",
    badge: "bg-green-600",
    label: "Best Match",
  },
  {
    medal: "🥈",
    border: "border-gray-300",
    bg: "bg-white",
    badge: "bg-gray-500",
    label: "Runner Up",
  },
  {
    medal: "🥉",
    border: "border-orange-300",
    bg: "bg-orange-50",
    badge: "bg-orange-500",
    label: "Alternative",
  },
];

// The score bar color changes based on how high the score is
const getBarColor = (score) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-orange-400";
};

export default function RecommendationCard({ result, rank = 0 }) {
  const navigate = useNavigate();
  const config = RANK_CONFIG[rank] || RANK_CONFIG[2];

  // Navigate to marketplace when "Buy Now" is clicked
  const handleBuy = () => {
    navigate("/marketplace");
  };

  return (
    <div
      className={`border-2 rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-md ${config.border} ${config.bg}`}
    >
      {/* Header row: medal + name + rank badge */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{config.medal}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-800 text-base leading-tight truncate">
              {result.fertilizer}
            </h3>
            <span className="text-xs text-gray-400">{config.label}</span>
          </div>
        </div>

        {/* Score badge — the numeric match percentage */}
        <span
          className={`text-sm font-bold text-white px-3 py-1 rounded-full flex-shrink-0 ${config.badge}`}
        >
          {result.score}%
        </span>
      </div>

      {/* Score progress bar
          The width is set via inline style because Tailwind can't generate
          dynamic class names like `w-[92%]` at build time */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all duration-700 ease-out ${getBarColor(result.score)}`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {/* Explanation text — the "explainability" feature
          This comes from the ML service and explains WHY this fertilizer
          was recommended in plain English */}
      <div className="bg-white bg-opacity-70 rounded-xl p-3 mb-4 border border-gray-100">
        <p className="text-xs text-gray-500 leading-relaxed">
          <span className="font-semibold text-gray-600">💡 Why? </span>
          {result.explanation}
        </p>
      </div>

      {/* Buy Now button — navigates to marketplace */}
      <button
        onClick={handleBuy}
        className="w-full border-2 border-green-600 text-green-700 py-2 rounded-xl text-sm font-semibold hover:bg-green-600 hover:text-white transition-all duration-200"
      >
        Buy {result.fertilizer.split(" ")[0]} →
      </button>
    </div>
  );
}
