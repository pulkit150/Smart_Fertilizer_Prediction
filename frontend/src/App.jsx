// App.jsx
// ─────────────────────────────────────────────────────────────────────────────
// This is the root component — everything in the app lives inside this.
//
// THREE layers of wrapping:
//
//   <AuthProvider>   → makes user/login/logout available to all components
//   <BrowserRouter>  → enables URL-based navigation without page reloads
//   <Routes>         → renders the component that matches the current URL
//
// ProtectedRoute is a small wrapper component defined here.
// It checks if the user is logged in:
//   - If YES → render the page they requested
//   - If NO  → redirect to /login (React Router's <Navigate> does this)
//
// This is simpler than using a library — it's just a component that
// conditionally renders either its children or a redirect.
// ─────────────────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Layout
import Navbar from "./components/Navbar";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Recommendation from "./pages/Recommendation";
import Marketplace from "./pages/Marketplace";
import Dashboard from "./pages/Dashboard";
import Checkout from "./pages/Checkout";

// ProtectedRoute: gates a page behind authentication
// Usage: <ProtectedRoute><Dashboard /></ProtectedRoute>
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  // If not logged in, redirect to /login and remember where they were trying to go
  return user ? children : <Navigate to="/login" replace />;
};

// AppRoutes is separate from App so it can use useAuth() which needs AuthProvider above it
const AppRoutes = () => (
  <>
    <Navbar />
    {/* pt-0 on main because Navbar already has padding */}
    <main className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
      <Routes>
        {/* Public routes — anyone can visit */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recommend" element={<Recommendation />} />
        <Route path="/marketplace" element={<Marketplace />} />

        {/* Protected routes — must be logged in */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: redirect unknown URLs to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
