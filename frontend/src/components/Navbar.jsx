// components/Navbar.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The Navbar reads from AuthContext to show different links based on
// whether the user is logged in.
//
// KEY REACT CONCEPTS HERE:
//
// 1. useAuth() — reads from AuthContext without any props.
//    If user is null → not logged in. If user is an object → logged in.
//
// 2. <Link> vs <a>
//    React Router's <Link to="/path"> updates the URL WITHOUT a full page reload.
//    A plain HTML <a href="/path"> causes a full page reload, losing React state.
//    Always use <Link> for internal navigation.
//
// 3. useNavigate() — programmatic navigation (used after logout).
//    When you call navigate("/"), React Router changes the URL and
//    renders the matching component, same as clicking a <Link>.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // tells us the current URL path
  const [menuOpen, setMenuOpen] = useState(false); // mobile menu toggle

  const handleLogout = () => {
    logout();           // clears localStorage + React state
    navigate("/");      // redirect to home
    setMenuOpen(false); // close mobile menu
  };

  // Helper: returns extra classes if this link is the active route
  const linkClass = (path) =>
    `hover:text-green-200 transition-colors ${
      location.pathname === path ? "text-white font-semibold underline underline-offset-4" : "text-green-100"
    }`;

  const navLinks = [
    { to: "/recommend", label: "🌾 Recommend" },
    { to: "/marketplace", label: "🛒 Marketplace" },
  ];

  return (
    <nav className="bg-green-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="text-xl font-bold tracking-tight hover:text-green-200 transition-colors">
          🌱 FertiSmart
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className={linkClass(l.to)}>
              {l.label}
            </Link>
          ))}

          {user ? (
            <>
              <Link to="/dashboard" className={linkClass("/dashboard")}>
                📊 Dashboard
              </Link>
              {/* User's name — subtle indicator of who is logged in */}
              <span className="text-green-300 text-xs border border-green-500 px-2 py-1 rounded-full">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-white text-green-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-white text-green-700 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
            >
              Login / Register
            </Link>
          )}
        </div>

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-green-600 transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-green-800 border-t border-green-600 px-4 py-3 space-y-3">
          {navLinks.map((l) => (
            <Link
              key={l.to} to={l.to}
              className="block text-green-100 hover:text-white py-1"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/dashboard" className="block text-green-100 hover:text-white py-1"
                onClick={() => setMenuOpen(false)}>
                📊 Dashboard
              </Link>
              <p className="text-green-400 text-xs pb-1">Logged in as {user.name}</p>
              <button onClick={handleLogout}
                className="block w-full text-left text-red-300 hover:text-red-200 py-1 text-sm">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="block text-green-100 hover:text-white py-1"
              onClick={() => setMenuOpen(false)}>
              Login / Register
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
