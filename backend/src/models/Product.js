const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    description: { type: String },
    // Nutrient content percentages
    nutrients: {
      nitrogen: { type: Number, default: 0 },
      phosphorus: { type: Number, default: 0 },
      potassium: { type: Number, default: 0 },
    },
    price: { type: Number, required: true },
    stock: { type: Number, default: 100 },
    imageUrl: { type: String, default: "" },
    category: { type: String, default: "general" }, // e.g. "organic", "chemical"
    suitableCrops: [{ type: String }],
    stripeProductId: { type: String, default: "" }, // populated if using Stripe catalog
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
