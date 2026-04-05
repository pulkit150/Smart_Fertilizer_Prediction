// context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// React Context solves a common problem: "how do I share data between
// components that aren't parent/child?"
//
// Without Context, you'd have to pass user/token as props through every
// component in the tree (called "prop drilling"). Context creates a
// global store that any component can read from directly.
//
// HOW IT WORKS:
//   1. AuthProvider wraps the entire app in App.jsx
//   2. It stores `user` in React state and exposes login/logout/register
//   3. Any component calls useAuth() to get those values — no props needed
//
// PERSISTENCE:
//   We store the token + user in localStorage so the session survives
//   page refreshes. On first render, we read from localStorage to restore state.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

// Step 1: Create an empty context object
const AuthContext = createContext(null);

// Step 2: Provider component — wraps the app and owns the state
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking localStorage

  // On mount: restore session from localStorage (survives page refresh)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // Corrupted data in localStorage — clear it
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false); // done checking — let the app render
  }, []); // [] = run once on mount, never again

  // Called from Login page after successful POST /api/auth/login
  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user); // triggers re-render: Navbar shows "Dashboard" instead of "Login"
    return data;
  };

  // Called from Login page in "register" mode
  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  // Called from Navbar logout button
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null); // triggers re-render: Navbar switches back to "Login"
  };

  // Don't render the app until we know the auth state
  // Prevents a flash where the app shows "not logged in" before localStorage loads
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-green-600 text-lg">🌱 Loading...</div>
      </div>
    );
  }

  // Step 3: Provide the values to all child components
  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

// Step 4: Custom hook — components call useAuth() instead of useContext(AuthContext)
// This is just a convenience wrapper that also gives a helpful error if you
// accidentally use it outside of AuthProvider
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
