// pages/Login.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Handles both login and registration in one component.
// A `mode` state variable toggles between the two forms.
//
// WHY ONE COMPONENT FOR BOTH?
// The forms are nearly identical — email + password, plus a Name field for
// registration. Keeping them together avoids duplicating the submit logic,
// error handling, and layout. A simple boolean toggle is cleaner than two
// separate routes.
//
// FLOW:
//   1. User fills form and clicks submit
//   2. handleSubmit calls login() or register() from AuthContext
//   3. Those functions POST to the backend and store the JWT in localStorage
//   4. On success → navigate to /dashboard
//   5. On error  → show the error message from the server
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If somehow a logged-in user lands here, redirect them to dashboard
  if (user) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  // Where to go after successful login (defaults to dashboard)
  const from = location.state?.from?.pathname || "/dashboard";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // clear error on any input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Simple client-side check before hitting the network
    if (mode === "register" && form.name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate(from, { replace: true }); // go to originally requested page
    } catch (err) {
      // The error message comes from the Express backend's JSON response
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setForm({ name: "", email: "", password: "" });
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

        {/* Header */}
        <div className="text-center mb-7">
          <div className="text-5xl mb-3">🌱</div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {mode === "login"
              ? "Sign in to see your recommendations and orders"
              : "Free to join — get personalised recommendations"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field — only shown in register mode */}
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text" name="name" value={form.name}
                onChange={handleChange} placeholder="Ramesh Kumar"
                autoComplete="name"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com"
              autoComplete="email"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="Minimum 6 characters"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              required
            />
          </div>

          {/* Error message from server */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        {/* Mode toggle */}
        <p className="text-center text-sm text-gray-500 mt-5">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={toggleMode}
            className="text-green-600 font-semibold hover:underline"
          >
            {mode === "login" ? "Register for free" : "Sign in here"}
          </button>
        </p>

        {/* Skip login hint */}
        <p className="text-center text-xs text-gray-400 mt-3">
          Just want to try the tool?{" "}
          <Link to="/recommend" className="text-green-500 hover:underline">
            Use it without an account →
          </Link>
        </p>
      </div>
    </div>
  );
}
