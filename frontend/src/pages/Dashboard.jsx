// pages/Dashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The user's personal hub — everything tied to their account in one place.
// Three tabs: Recommendations history, Orders history, Effectiveness Tracker.
//
// PROTECTED ROUTE: App.jsx wraps this in <ProtectedRoute>, so by the time
// this component renders, we know req.user exists and is logged in.
//
// DATA LOADING STRATEGY:
// We use Promise.all() to fire all three API calls simultaneously.
// If we awaited them in sequence (A, then B, then C), it would take 3× longer.
// Promise.all([A, B, C]) fires them all at once and resolves when all finish.
//
// TAB PATTERN:
// A `tab` state variable holds the active tab name. Each tab's content is
// conditionally rendered using `{tab === "x" && <Content />}`.
// This is simpler than React Router nested routes for a simple tabbed UI.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("recommendations");
  const [history, setHistory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Feedback form state
  const [fbForm, setFbForm] = useState({
    fertilizerUsed: "", rating: 4, yieldChange: "", notes: "",
  });
  const [fbStatus, setFbStatus] = useState(""); // "" | "loading" | "success" | "error"

  useEffect(() => {
    loadAll();
  }, []);

  // Load all three data sources in parallel
  const loadAll = async () => {
    setLoading(true);
    try {
      const [recRes, ordRes, fbRes] = await Promise.all([
        api.get("/fertilizer/history"),
        api.get("/orders"),
        api.get("/feedback"),
      ]);
      setHistory(recRes.data.history || []);
      setOrders(ordRes.data.orders || []);
      setFeedbacks(fbRes.data.feedbacks || []);
    } catch (err) {
      console.error("Dashboard load error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    setFbStatus("loading");
    try {
      await api.post("/feedback", fbForm);
      setFbStatus("success");
      setFbForm({ fertilizerUsed: "", rating: 4, yieldChange: "", notes: "" });
      // Refresh the feedback list to show the new entry
      const { data } = await api.get("/feedback");
      setFeedbacks(data.feedbacks || []);
    } catch {
      setFbStatus("error");
    }
  };

  const TABS = [
    { id: "recommendations", label: "🌾 Recommendations", count: history.length },
    { id: "orders",          label: "📦 Orders",          count: orders.length },
    { id: "feedback",        label: "📊 Effectiveness",   count: feedbacks.length },
  ];

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="h-48 bg-gray-100 rounded-2xl" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">👨‍🌾 My Dashboard</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Welcome back, <span className="font-semibold text-gray-600">{user?.name}</span>
        </p>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Recommendations", value: history.length, color: "text-green-600" },
          { label: "Orders Placed",   value: orders.length,  color: "text-blue-600" },
          { label: "Feedback Given",  value: feedbacks.length, color: "text-purple-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-full overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.id
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              tab === t.id ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── TAB: Recommendations ── */}
      {tab === "recommendations" && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <EmptyState
              icon="🌾"
              message="No recommendations yet."
              action={<Link to="/recommend" className="text-green-600 font-semibold hover:underline">Get your first recommendation →</Link>}
            />
          ) : (
            history.map((r) => (
              <div key={r._id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full capitalize">
                      {r.soilInput?.crop || "unknown crop"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-700 text-sm">
                    Top pick: <span className="text-green-600">{r.topResults?.[0]?.fertilizerName || "—"}</span>
                    <span className="text-gray-400 font-normal ml-1">({r.topResults?.[0]?.score}% match)</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {r.topResults?.[0]?.explanation}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-400 flex-shrink-0">
                  <div className="font-mono bg-gray-50 rounded px-2 py-1">
                    N:{r.soilInput?.nitrogen} P:{r.soilInput?.phosphorus} K:{r.soilInput?.potassium}
                  </div>
                  <div className="mt-1">pH: {r.soilInput?.pH}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB: Orders ── */}
      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <EmptyState
              icon="📦"
              message="No orders placed yet."
              action={<Link to="/marketplace" className="text-green-600 font-semibold hover:underline">Browse the marketplace →</Link>}
            />
          ) : (
            orders.map((o) => (
              <div key={o._id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      Order <span className="font-mono text-xs text-gray-400">#{o._id.slice(-8).toUpperCase()}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {o.items?.length || 0} item(s) ·{" "}
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {/* List the product names */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {o.items?.map((item, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {item.product?.name || "Product"} ×{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-green-700 text-lg">
                      ₹{o.totalAmount?.toLocaleString("en-IN")}
                    </p>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB: Effectiveness Tracker / Feedback ── */}
      {tab === "feedback" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Submit new feedback */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="font-bold text-gray-700 mb-1">Record Results</h2>
            <p className="text-xs text-gray-400 mb-4">
              After using a fertilizer, log what happened. This helps improve future recommendations.
            </p>
            <form onSubmit={submitFeedback} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Fertilizer Used *
                </label>
                <input
                  required
                  placeholder="e.g. Urea (46-0-0)"
                  value={fbForm.fertilizerUsed}
                  onChange={(e) => setFbForm({ ...fbForm, fertilizerUsed: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                  Satisfaction: {fbForm.rating}/5 {"⭐".repeat(fbForm.rating)}
                </label>
                <input
                  type="range" min="1" max="5" step="1"
                  value={fbForm.rating}
                  onChange={(e) => setFbForm({ ...fbForm, rating: +e.target.value })}
                  className="w-full accent-green-600"
                />
                <div className="flex justify-between text-xs text-gray-300 mt-1">
                  <span>Poor</span><span>Excellent</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Yield Change
                </label>
                <input
                  placeholder="e.g. +20%, similar, slightly less"
                  value={fbForm.yieldChange}
                  onChange={(e) => setFbForm({ ...fbForm, yieldChange: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Notes / Observations
                </label>
                <textarea
                  rows="3"
                  placeholder="Leaves looked greener, soil felt looser, needed less water..."
                  value={fbForm.notes}
                  onChange={(e) => setFbForm({ ...fbForm, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={fbStatus === "loading"}
                className="w-full bg-green-600 text-white py-2.5 rounded-xl font-bold hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {fbStatus === "loading" ? "Submitting..." : "Submit Feedback"}
              </button>

              {fbStatus === "success" && (
                <p className="text-green-600 text-sm bg-green-50 rounded-lg p-2 text-center">
                  ✅ Feedback recorded! Thank you.
                </p>
              )}
              {fbStatus === "error" && (
                <p className="text-red-500 text-sm bg-red-50 rounded-lg p-2 text-center">
                  ⚠ Failed to submit. Please try again.
                </p>
              )}
            </form>
          </div>

          {/* Past feedback list */}
          <div>
            <h2 className="font-bold text-gray-700 mb-3">Your Past Feedback</h2>
            {feedbacks.length === 0 ? (
              <EmptyState icon="📝" message="No feedback submitted yet. Try the form on the left!" />
            ) : (
              <div className="space-y-3">
                {feedbacks.map((f) => (
                  <div key={f._id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-gray-700 text-sm">{f.fertilizerUsed}</p>
                      <span className="text-yellow-500 text-sm">{"⭐".repeat(f.rating)}</span>
                    </div>
                    {f.yieldChange && (
                      <p className="text-xs text-gray-500">
                        Yield: <span className="font-semibold">{f.yieldChange}</span>
                      </p>
                    )}
                    {f.notes && (
                      <p className="text-xs text-gray-400 italic mt-1 leading-relaxed">{f.notes}</p>
                    )}
                    <p className="text-xs text-gray-300 mt-2">
                      {new Date(f.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable empty state widget used in each tab
function EmptyState({ icon, message, action }) {
  return (
    <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-sm mb-2">{message}</p>
      {action && <div className="text-sm">{action}</div>}
    </div>
  );
}

// Order status badge with colour coding
function StatusBadge({ status }) {
  const MAP = {
    pending:   "bg-orange-100 text-orange-700",
    paid:      "bg-green-100 text-green-700",
    shipped:   "bg-blue-100 text-blue-700",
    delivered: "bg-teal-100 text-teal-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${MAP[status] || MAP.pending}`}>
      {status}
    </span>
  );
}
