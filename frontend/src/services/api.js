// services/api.js
// ─────────────────────────────────────────────────────────────────────────────
// This file creates a single, pre-configured Axios instance that every page
// and component imports. Instead of writing this in every file:
//
//   axios.get("http://localhost:5000/api/products", {
//     headers: { Authorization: `Bearer ${token}` }
//   })
//
// Every file just does:
//   api.get("/products")
//
// HOW IT WORKS:
//
// 1. axios.create({ baseURL }) — sets the base URL so you only write "/products"
//    instead of the full URL. Vite's proxy then forwards it to the backend.
//
// 2. Interceptors — these are middleware for HTTP requests/responses.
//    The request interceptor runs BEFORE every request is sent.
//    We use it to automatically attach the JWT token from localStorage.
//    This way, every API call is automatically authenticated — you never
//    manually add headers in your components.
//
// 3. Response interceptor — runs when a response comes back.
//    We use it to globally catch 401 errors (token expired/invalid)
//    and redirect the user to the login page automatically.
// ─────────────────────────────────────────────────────────────────────────────

import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  // import.meta.env.VITE_API_URL reads from the .env file
  // Falls back to "/api" which Vite's proxy forwards to localhost:5000
});

// ── Request Interceptor ──────────────────────────────────────────────────────
// This function runs before EVERY request this axios instance makes.
api.interceptors.request.use(
  (config) => {
    // Get the JWT token stored after login
    const token = localStorage.getItem("token");

    if (token) {
      // Attach it as a Bearer token in the Authorization header
      // Express's authMiddleware checks for exactly this format
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config; // must return config or the request won't be sent
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────────────────────────
// This function runs after EVERY response (or error) comes back.
api.interceptors.response.use(
  (response) => response, // pass through successful responses unchanged

  (error) => {
    // If the server returns 401 (Unauthorized), the token is expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to login — but only if not already there
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error); // still reject so individual catch blocks work
  }
);

export default api;
