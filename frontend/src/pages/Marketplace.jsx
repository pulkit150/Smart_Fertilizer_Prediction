// pages/Marketplace.jsx
// ─────────────────────────────────────────────────────────────────────────────
// This page fetches products from MongoDB via the backend and lets users add
// them to a cart. Cart state is local to this component for simplicity.
//
// KEY REACT CONCEPTS shown here:
//
// 1. useEffect with [] dependency — runs ONCE when component mounts (like
//    componentDidMount in class components). Used for initial data fetch.
//
// 2. Functional state updates — addToCart uses setCart(prev => ...) instead of
//    setCart(cart => ...). This is safer when the update depends on previous
//    state because React may batch state updates asynchronously.
//
// 3. Derived values — `filtered`, `cartTotal`, `cartCount` are computed from
//    state on every render. They're NOT stored in state themselves — storing
//    derived data in state causes sync bugs.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Marketplace() {
  const [products, setProducts] = useState([]);
  const [cart, setCart]         = useState([]); // [{ ...product, qty: number }]
  const [filter, setFilter]     = useState("all");
  const [loading, setLoading]   = useState(true);
  const [seeding, setSeeding]   = useState(false);
  const navigate = useNavigate();

  // Fetch all products on first render
  useEffect(() => {
    api.get("/products")
      .then(({ data }) => setProducts(data.products))
      .catch((err) => console.error("Failed to load products:", err))
      .finally(() => setLoading(false));
  }, []); // ← empty array = run once on mount only

  // ── Cart logic ────────────────────────────────────────────────────────────

  const addToCart = (product) => {
    // Use functional update to safely read previous state
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        // Product already in cart — just increase its quantity
        return prev.map((item) =>
          item._id === product._id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      // New product — add with qty 1
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item._id !== productId));
  };

  // ── Derived values (computed from state, not stored in state) ─────────────
  const filtered   = filter === "all" ? products : products.filter((p) => p.category === filter);
  const cartCount  = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal  = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // ── Seed the database with starter products ────────────────────────────────
  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { data } = await api.post("/products/seed");
      setProducts(data.products); // update UI immediately without re-fetching
    } catch (err) {
      alert("Seed failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSeeding(false);
    }
  };

  // Store cart in sessionStorage so it survives a page navigate-and-back
  // (A full app would use Context or Redux for this)
  const goToCheckout = () => {
    sessionStorage.setItem("cart", JSON.stringify(cart));
    navigate("/checkout");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Header row ── */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-green-700">🛒 Marketplace</h1>
          <p className="text-gray-400 text-sm mt-1">
            {loading ? "Loading..." : `${products.length} fertilizers available`}
          </p>
        </div>

        {/* Cart summary — only visible when cart has items */}
        {cartCount > 0 && (
          <div className="flex items-center gap-3 bg-white border border-green-300 rounded-2xl p-3 shadow-sm">
            <div className="text-sm">
              <p className="font-bold text-gray-800">{cartCount} item{cartCount > 1 ? "s" : ""}</p>
              <p className="text-green-600 font-semibold">₹{cartTotal.toLocaleString("en-IN")}</p>
            </div>
            <button
              onClick={goToCheckout}
              className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition"
            >
              Checkout →
            </button>
          </div>
        )}
      </div>

      {/* ── Filter Pills ── */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "chemical", "organic"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
              filter === f
                ? "bg-green-600 text-white border-green-600 shadow-sm"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f === "all" ? "All Products" : f.charAt(0).toUpperCase() + f.slice(1)}
            {/* Show count per category */}
            <span className="ml-1.5 text-xs opacity-70">
              ({f === "all" ? products.length : products.filter((p) => p.category === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* ── Loading State ── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border rounded-2xl p-5 animate-pulse">
              <div className="h-8 w-8 bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="h-10 bg-gray-100 rounded mb-4" />
              <div className="flex justify-between">
                <div className="h-6 bg-gray-200 rounded w-16" />
                <div className="h-8 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty State — shown when DB has no products yet ── */}
      {!loading && products.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-5xl mb-4">📦</p>
          <h2 className="text-lg font-semibold text-gray-600 mb-2">No products in the database</h2>
          <p className="text-gray-400 text-sm mb-5">
            Click below to populate the DB with 6 starter fertilizers.
          </p>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60 transition"
          >
            {seeding ? "⏳ Seeding database..." : "🌱 Seed Starter Products"}
          </button>
          <p className="text-xs text-gray-400 mt-3">
            This calls <code className="font-mono bg-gray-100 px-1 rounded">POST /api/products/seed</code> on the backend
          </p>
        </div>
      )}

      {/* ── Product Grid ── */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((product) => {
            const inCart = cart.find((i) => i._id === product._id);
            return (
              <div
                key={product._id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col"
              >
                {/* Icon + category badge */}
                <div className="flex justify-between items-start mb-3">
                  <span className="text-4xl">
                    {product.category === "organic" ? "🌿" : "🧴"}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    product.category === "organic"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {product.category}
                  </span>
                </div>

                {/* Product info */}
                <h3 className="font-bold text-gray-800 mb-0.5">{product.name}</h3>
                <p className="text-xs text-gray-400 mb-3">{product.brand}</p>
                <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-4">
                  {product.description}
                </p>

                {/* NPK nutrient badges */}
                {/* These show the percentage composition of each nutrient */}
                <div className="flex gap-1.5 mb-4 flex-wrap">
                  <NutrientBadge label="N" value={product.nutrients?.nitrogen}  color="blue"   />
                  <NutrientBadge label="P" value={product.nutrients?.phosphorus} color="orange" />
                  <NutrientBadge label="K" value={product.nutrients?.potassium}  color="purple" />
                </div>

                {/* Suitable crops */}
                {product.suitableCrops?.length > 0 && (
                  <p className="text-xs text-gray-400 mb-4">
                    🌾 Suits: {product.suitableCrops.slice(0, 3).join(", ")}
                    {product.suitableCrops.length > 3 ? " +" + (product.suitableCrops.length - 3) + " more" : ""}
                  </p>
                )}

                {/* Price + Add to cart */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xl font-bold text-green-700">₹{product.price}</p>
                    {inCart && (
                      <p className="text-xs text-green-600">{inCart.qty} in cart</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {inCart && (
                      <button
                        onClick={() => removeFromCart(product._id)}
                        className="border border-red-300 text-red-500 px-2.5 py-1.5 rounded-lg text-xs hover:bg-red-50 transition"
                      >
                        Remove
                      </button>
                    )}
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                    >
                      {inCart ? `Add More` : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cart Summary Bar — shown at bottom when cart has items */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-700 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-4 z-50">
          <span className="font-semibold">
            🛒 {cartCount} item{cartCount > 1 ? "s" : ""} · ₹{cartTotal.toLocaleString("en-IN")}
          </span>
          <button
            onClick={goToCheckout}
            className="bg-white text-green-700 px-4 py-1.5 rounded-xl font-bold text-sm hover:bg-green-50 transition"
          >
            Checkout →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Small reusable sub-component for NPK badges ────────────────────────────
// Defined in the same file since it's only used here
function NutrientBadge({ label, value, color }) {
  const colors = {
    blue:   "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors[color]}`}>
      {label}: {value ?? 0}%
    </span>
  );
}
