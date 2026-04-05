// pages/Checkout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// The full checkout flow, step by step:
//
// STEP 1 — Review cart
//   Cart items were saved to localStorage by Marketplace.jsx when user
//   clicked "Checkout". We read them here on mount.
//
// STEP 2 — Create order
//   POST /api/orders with the cart items and a shipping address.
//   Backend fetches real prices from DB (prevents price manipulation).
//   Returns an Order document with an _id.
//
// STEP 3 — Create Stripe PaymentIntent
//   POST /api/payments/create-intent with the orderId.
//   Backend calls Stripe and returns a clientSecret.
//   The clientSecret is a one-time token that authorises payment collection.
//
// STEP 4 — Collect card (demo mode)
//   In production: Stripe Elements renders a secure card form using clientSecret.
//   In this starter: we skip card collection and simulate success.
//
// STEP 5 — Confirm payment
//   POST /api/payments/confirm — backend marks the order as "paid".
//
// The component uses a `step` state to show a different UI at each stage.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

// Steps: "cart" → "address" → "payment" → "success"
const STEPS = ["cart", "address", "payment", "success"];

export default function Checkout() {
  const navigate = useNavigate();
  const [step, setStep] = useState("cart");
  const [cart, setCart] = useState([]);
  const [orderId, setOrderId] = useState(null);
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Shipping address form state
  const [address, setAddress] = useState({
    street: "", city: "", state: "", pincode: "",
  });

  // Load cart from localStorage (set by Marketplace when user clicks Checkout)
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try { setCart(JSON.parse(saved)); }
      catch { setCart([]); }
    }
  }, []);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  // STEP 1→2: Proceed from cart review to address entry
  const handleCartNext = () => {
    if (cart.length === 0) { setError("Your cart is empty."); return; }
    setError("");
    setStep("address");
  };

  // STEP 2→3: Create the order in MongoDB, then create Stripe PaymentIntent
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!address.city || !address.pincode) {
      setError("Please fill in city and pincode."); return;
    }
    setLoading(true); setError("");

    try {
      // 2a. Create order — backend validates prices from DB
      const { data: orderData } = await api.post("/orders", {
        items: cart.map((i) => ({ productId: i._id, quantity: i.qty })),
        shippingAddress: address,
      });
      const newOrderId = orderData.order._id;
      setOrderId(newOrderId);

      // 2b. Create Stripe PaymentIntent for this order amount
      const { data: payData } = await api.post("/payments/create-intent", {
        orderId: newOrderId,
      });
      setClientSecret(payData.clientSecret);

      setStep("payment"); // show the payment UI
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 3→4: Simulate payment success (replace with real Stripe.js in production)
  const handlePayment = async () => {
    setLoading(true); setError("");
    try {
      // In production, you'd call:
      // const { error } = await stripe.confirmCardPayment(clientSecret, {
      //   payment_method: { card: cardElement }
      // });
      // For the starter, we skip card collection and confirm immediately:

      await api.post("/payments/confirm", { orderId });

      // Clear the cart from localStorage — order is done
      localStorage.removeItem("cart");
      setStep("success");
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER: Step indicator ──
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {["Cart", "Address", "Payment", "Done"].map((label, i) => {
        const s = STEPS[i];
        const current = STEPS.indexOf(step);
        const isDone = i < current;
        const isActive = i === current;
        return (
          <div key={s} className="flex items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              isDone ? "bg-green-600 text-white" :
              isActive ? "bg-green-100 text-green-700 border-2 border-green-600" :
              "bg-gray-100 text-gray-400"
            }`}>
              {isDone ? "✓" : i + 1}
            </div>
            <span className={`ml-1.5 text-xs font-medium hidden sm:block ${
              isActive ? "text-green-700" : isDone ? "text-gray-600" : "text-gray-400"
            }`}>{label}</span>
            {i < 3 && <div className={`w-8 h-0.5 mx-2 ${isDone ? "bg-green-400" : "bg-gray-200"}`} />}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-lg mx-auto mt-6">
      <StepIndicator />

      {/* ── STEP: Cart Review ── */}
      {step === "cart" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-5">🛒 Review Your Cart</h2>

          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-3">🛒</p>
              <p className="mb-4">Your cart is empty.</p>
              <Link to="/marketplace" className="text-green-600 font-semibold hover:underline">
                Go to Marketplace →
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-5">
                {cart.map((item) => (
                  <div key={item._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-700 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.brand} · Qty: {item.qty}</p>
                    </div>
                    <p className="font-bold text-green-700">
                      ₹{(item.price * item.qty).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-200 mb-5">
                <span className="font-bold text-gray-700">Total</span>
                <span className="text-2xl font-bold text-green-700">
                  ₹{cartTotal.toLocaleString("en-IN")}
                </span>
              </div>

              {error && <p className="text-red-500 text-sm mb-3">⚠ {error}</p>}

              <button
                onClick={handleCartNext}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                Continue to Address →
              </button>
            </>
          )}
        </div>
      )}

      {/* ── STEP: Shipping Address ── */}
      {step === "address" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-5">📍 Shipping Address</h2>
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Street Address</label>
              <input
                placeholder="House no., street, village"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">City *</label>
                <input
                  required placeholder="Bhopal"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">State</label>
                <input
                  placeholder="Madhya Pradesh"
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pincode *</label>
              <input
                required placeholder="462001"
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">Total: <strong className="text-green-700">₹{cartTotal.toLocaleString("en-IN")}</strong></span>
            </div>

            {error && <p className="text-red-500 text-sm">⚠ {error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("cart")}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm">
                ← Back
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-bold hover:bg-green-700 disabled:opacity-60 transition-colors">
                {loading ? "Placing order..." : "Place Order →"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── STEP: Payment ── */}
      {step === "payment" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-2">💳 Payment</h2>
          <p className="text-sm text-gray-400 mb-5">Stripe test mode — no real charge</p>

          {/* Stripe test card info */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
            <p className="text-xs font-bold text-amber-700 mb-2">🧪 USE THESE TEST CARD DETAILS</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
              <span className="text-amber-600">Card number</span>
              <span className="text-amber-800 font-bold">4242 4242 4242 4242</span>
              <span className="text-amber-600">Expiry</span>
              <span className="text-amber-800">Any future date</span>
              <span className="text-amber-600">CVC</span>
              <span className="text-amber-800">Any 3 digits</span>
            </div>
          </div>

          {/* In production, Stripe Elements <CardElement /> would render here
              using the clientSecret. For now we just show the amount and confirm. */}
          <div className="border border-gray-200 rounded-xl p-4 mb-5">
            <p className="text-xs text-gray-400 mb-1">Amount to charge</p>
            <p className="text-2xl font-bold text-green-700">₹{cartTotal.toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400 mt-1 font-mono truncate">
              Intent: {clientSecret ? clientSecret.slice(0, 20) + "..." : "—"}
            </p>
          </div>

          {error && <p className="text-red-500 text-sm mb-3">⚠ {error}</p>}

          <button onClick={handlePayment} disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:opacity-60 transition-colors text-base">
            {loading ? "Processing payment..." : "Pay ₹" + cartTotal.toLocaleString("en-IN")}
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            🔒 Secured by Stripe. Card data never touches our servers.
          </p>
        </div>
      )}

      {/* ── STEP: Success ── */}
      {step === "success" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Confirmed!</h2>
          <p className="text-gray-400 mb-6 text-sm">
            Your order has been placed and payment was successful.
            You'll receive your fertilizer soon.
          </p>
          <div className="space-y-3">
            <Link to="/dashboard"
              className="block w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors">
              View My Orders →
            </Link>
            <Link to="/recommend"
              className="block w-full border border-gray-300 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm">
              Get Another Recommendation
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
