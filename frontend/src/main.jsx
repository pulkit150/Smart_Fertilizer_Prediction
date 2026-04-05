// main.jsx
// ─────────────────────────────────────────────────────────────────────────────
// This is the very first JavaScript file that runs in the browser.
// It does two things:
//   1. Imports global CSS (Tailwind styles)
//   2. Mounts the React app into the <div id="root"> in index.html
//
// ReactDOM.createRoot() is the React 18+ way to start an app.
// The older ReactDOM.render() still works but is deprecated.
//
// <React.StrictMode> is a development-only wrapper that:
//   - Warns about deprecated patterns
//   - Intentionally double-invokes some functions to catch side effects
//   - Has ZERO effect in production builds
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // must import here so Tailwind styles load globally

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
