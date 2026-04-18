require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const errorHandler = require("./src/middleware/errorHandler");

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const productRoutes = require("./src/routes/productRoutes");
const fertilizerRoutes = require("./src/routes/fertilizerRoutes");
const orderRoutes = require("./src/routes/orderRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const weatherRoutes = require("./src/routes/weatherRoutes");
const feedbackRoutes = require("./src/routes/feedbackRoutes");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,           // e.g. https://fertismart.onrender.com
  "http://localhost:5173",            // Vite dev server
  "http://localhost:4173",            // Vite preview
].filter(Boolean); // removes undefined if FRONTEND_URL not set

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/fertilizer", fertilizerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/feedback", feedbackRoutes);

// Health check
app.get("/", (req, res) => res.json({
  message: "FertiSmart API running",
  version: "1.0.0",
  env: process.env.NODE_ENV,
}));

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
