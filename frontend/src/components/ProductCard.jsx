// components/ProductCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Displays a single fertilizer product in the marketplace grid.
//
// Props:
//   product     = the product object from MongoDB/API
//   onAddToCart = callback function called when "Add to Cart" is clicked
//   cartQty     = how many of this item are currently in the cart (0 if none)
//
// WHY PASS onAddToCart AS A PROP instead of handling it here?
// Because this component doesn't own the cart state — the Marketplace page does.
// The Marketplace page passes down its `addToCart` function as a prop.
// This pattern is called "lifting state up" — the state lives in the
// nearest common ancestor, and callbacks are passed down to children.
// ─────────────────────────────────────────────────────────────────────────────

// Map category to an appropriate emoji icon
const CATEGORY_ICONS = {
  organic: "🌿",
  chemical: "🧴",
  default: "🧪",
};

export default function ProductCard({ product, onAddToCart, cartQty = 0 }) {
  const icon = CATEGORY_ICONS[product.category] || CATEGORY_ICONS.default;
  const inCart = cartQty > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">

      {/* Product icon + category badge */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-4xl">{icon}</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          product.category === "organic"
            ? "bg-green-100 text-green-700"
            : "bg-blue-100 text-blue-700"
        }`}>
          {product.category}
        </span>
      </div>

      {/* Product name and brand */}
      <h3 className="font-bold text-gray-800 text-base mb-0.5 leading-snug">
        {product.name}
      </h3>
      <p className="text-xs text-gray-400 mb-2">{product.brand}</p>

      {/* Description — flex-1 pushes the footer to the bottom */}
      <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
        {product.description}
      </p>

      {/* NPK nutrient badges — quick visual summary of what's in the fertilizer */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <NutrientBadge label="N" value={product.nutrients?.nitrogen} color="blue" />
        <NutrientBadge label="P" value={product.nutrients?.phosphorus} color="orange" />
        <NutrientBadge label="K" value={product.nutrients?.potassium} color="purple" />
      </div>

      {/* Suitable crops (show max 3) */}
      {product.suitableCrops?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {product.suitableCrops.slice(0, 3).map((crop) => (
            <span key={crop} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {crop}
            </span>
          ))}
          {product.suitableCrops.length > 3 && (
            <span className="text-xs text-gray-400">+{product.suitableCrops.length - 3} more</span>
          )}
        </div>
      )}

      {/* Footer: price + add to cart */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <div>
          <span className="text-xl font-bold text-green-700">
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-gray-400 ml-1">/ bag</span>
        </div>

        <button
          onClick={() => onAddToCart(product)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            inCart
              ? "bg-green-100 text-green-700 border-2 border-green-400 hover:bg-green-200"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {inCart ? `In Cart (${cartQty})` : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

// Small helper component for N / P / K badges
// Defined in the same file since it's only used here
const COLOR_MAP = {
  blue:   { bg: "bg-blue-100",   text: "text-blue-700"   },
  orange: { bg: "bg-orange-100", text: "text-orange-700" },
  purple: { bg: "bg-purple-100", text: "text-purple-700" },
};

function NutrientBadge({ label, value, color }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.bg} ${c.text}`}>
      {label}: {value ?? 0}%
    </span>
  );
}
