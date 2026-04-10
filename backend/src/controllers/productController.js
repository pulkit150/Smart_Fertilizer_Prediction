const Product = require("../models/Product");
const asyncHandler = require("../middleware/asyncHandler");

// Seed data — call once to populate DB
// IMPORTANT: The `name` field here is for display only (price, brand, etc.)
// The ML model uses its own internal name ("MOP") from training_data.csv.
// These two are linked by FERT_DISPLAY in main.py — that dict maps
// ML class name → display name shown in the UI.
const SEED_PRODUCTS = [
  {
    name: "Urea (46-0-0)",
    brand: "AgriCo",
    description: "High-nitrogen fertilizer (46% N). Best for leafy crops, paddy, and wheat. Rapidly boosts vegetative growth and grain protein.",
    nutrients: { nitrogen: 46, phosphorus: 0, potassium: 0 },
    price: 299,
    category: "chemical",
    suitableCrops: ["wheat", "maize", "paddy", "sugarcane", "tobacco"],
  },
  {
    name: "DAP — Di-Ammonium Phosphate (18-46-0)",
    brand: "Tata Rallis",
    description: "Di-Ammonium Phosphate (18% N, 46% P). Promotes strong root development and early plant establishment. Best as basal dose at sowing.",
    nutrients: { nitrogen: 18, phosphorus: 46, potassium: 0 },
    price: 1350,
    category: "chemical",
    suitableCrops: ["wheat", "cotton", "sugarcane", "paddy"],
  },
  {
    name: "MOP — Muriate of Potash (0-0-60)",
    brand: "Coromandel",
    description: "Muriate of Potash (60% K). Strengthens cell walls, improves drought resistance, disease resistance, and fruit quality. Essential for banana and potato.",
    nutrients: { nitrogen: 0, phosphorus: 0, potassium: 60 },
    price: 850,
    category: "chemical",
    // These crops match exactly what was added to training_data.csv for MOP
    suitableCrops: ["banana", "potato"],
  },
  {
    name: "Complex NPK 10-26-26",
    brand: "Yara",
    description: "High phosphorus and potassium (10-26-26). Enhances drought tolerance and crop quality at grain-filling stage. Widely used for paddy at tillering.",
    nutrients: { nitrogen: 10, phosphorus: 26, potassium: 26 },
    price: 780,
    category: "chemical",
    suitableCrops: ["paddy", "wheat", "maize"],
  },
  {
    name: "Complex NPK 14-35-14",
    brand: "Coromandel",
    description: "High phosphorus emphasis (14-35-14). Effective for cotton and tobacco in black and red soils where phosphorus is the limiting factor.",
    nutrients: { nitrogen: 14, phosphorus: 35, potassium: 14 },
    price: 920,
    category: "chemical",
    suitableCrops: ["cotton", "tobacco"],
  },
  {
    name: "Complex NPK 28-28-0",
    brand: "IFFCO",
    description: "Equal N-P formula (28-28-0) without potassium. Ideal where soil K is adequate but both nitrogen and phosphorus need supplementing.",
    nutrients: { nitrogen: 28, phosphorus: 28, potassium: 0 },
    price: 680,
    category: "chemical",
    suitableCrops: ["cotton", "tobacco", "wheat"],
  },
  {
    name: "Vermicompost",
    brand: "GreenEarth Organics",
    description: "100% organic. Improves soil structure, water retention, and microbial activity. Suitable as a base application for all crops.",
    nutrients: { nitrogen: 2, phosphorus: 1, potassium: 1 },
    price: 180,
    category: "organic",
    suitableCrops: ["all crops"],
  },
  {
    name: "Neem Cake Fertilizer",
    brand: "Organic India",
    description: "Slow-release organic nitrogen. Also acts as a natural nematicide and pest repellent. Improves root zone health.",
    nutrients: { nitrogen: 5, phosphorus: 1, potassium: 1 },
    price: 240,
    category: "organic",
    suitableCrops: ["cotton", "paddy", "vegetables"],
  },
];

// GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = category ? { category } : {};
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, products });
});

// GET /api/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ success: true, product });
});

// POST /api/products/seed — seed the DB with starter products
const seedProducts = asyncHandler(async (req, res) => {
  await Product.deleteMany({});
  const products = await Product.insertMany(SEED_PRODUCTS);
  res.json({ success: true, message: `${products.length} products seeded`, products });
});

// POST /api/products — create a new product (admin only)
const createProduct = asyncHandler(async (req, res) => {
  const { name, brand, description, nutrients, price, category, suitableCrops } = req.body;
  const product = await Product.create({
    name,
    brand,
    description,
    nutrients,
    price,
    category,
    suitableCrops,
  });
  res.status(201).json({ success: true, product });
});

// PUT /api/products/:id — update product (admin only)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ success: true, product });
});

// DELETE /api/products/:id — delete product (admin only)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ success: true, message: "Product deleted" });
});

module.exports = { getProducts, getProductById, seedProducts, createProduct, updateProduct, deleteProduct };