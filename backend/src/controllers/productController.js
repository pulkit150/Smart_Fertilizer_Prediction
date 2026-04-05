const Product = require("../models/Product");

// Seed data — call once to populate DB
const SEED_PRODUCTS = [
  {
    name: "Urea (46-0-0)",
    brand: "AgriCo",
    description: "High-nitrogen fertilizer. Best for leafy crops, paddy, and wheat.",
    nutrients: { nitrogen: 46, phosphorus: 0, potassium: 0 },
    price: 299,
    category: "chemical",
    suitableCrops: ["wheat", "rice", "maize", "sugarcane"],
  },
  {
    name: "DAP (18-46-0)",
    brand: "Tata Rallis",
    description: "Di-Ammonium Phosphate. Promotes root growth and early development.",
    nutrients: { nitrogen: 18, phosphorus: 46, potassium: 0 },
    price: 1350,
    category: "chemical",
    suitableCrops: ["wheat", "cotton", "soybean", "potato"],
  },
  {
    name: "MOP (0-0-60)",
    brand: "Coromandel",
    description: "Muriate of Potash. Improves drought resistance and fruit quality.",
    nutrients: { nitrogen: 0, phosphorus: 0, potassium: 60 },
    price: 850,
    category: "chemical",
    suitableCrops: ["banana", "potato", "tomato", "sugarcane"],
  },
  {
    name: "NPK 20-20-20",
    brand: "Yara",
    description: "Balanced NPK for general use. Works for most crops.",
    nutrients: { nitrogen: 20, phosphorus: 20, potassium: 20 },
    price: 620,
    category: "chemical",
    suitableCrops: ["vegetables", "fruits", "flowers"],
  },
  {
    name: "Vermicompost",
    brand: "GreenEarth Organics",
    description: "100% organic. Improves soil structure, microbial activity.",
    nutrients: { nitrogen: 2, phosphorus: 1, potassium: 1 },
    price: 180,
    category: "organic",
    suitableCrops: ["all crops"],
  },
  {
    name: "Neem Cake Fertilizer",
    brand: "Organic India",
    description: "Slow-release nitrogen. Also acts as natural pest repellent.",
    nutrients: { nitrogen: 5, phosphorus: 1, potassium: 1 },
    price: 240,
    category: "organic",
    suitableCrops: ["vegetables", "cotton", "rice"],
  },
];

// GET /api/products
const getProducts = async (req, res) => {
  const { category } = req.query;
  const filter = category ? { category } : {};
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, products });
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ success: true, product });
};

// POST /api/products/seed — seed the DB with starter products
const seedProducts = async (req, res) => {
  await Product.deleteMany({}); // clear existing
  const products = await Product.insertMany(SEED_PRODUCTS);
  res.json({ success: true, message: `${products.length} products seeded`, products });
};

module.exports = { getProducts, getProductById, seedProducts };
