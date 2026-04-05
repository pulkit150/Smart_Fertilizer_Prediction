# 🌱 Smart Fertilizer Recommendation System

A full-stack AI-powered web app that recommends fertilizers based on soil data,
crop type, and real-time weather conditions.

---

## 🏗 Architecture Overview

```
Browser (React)
    │
    │  HTTP (via Vite proxy in dev)
    ▼
Backend (Node.js + Express)  ──────────────────┐
    │                                           │
    │  POST /predict                   Stripe API (payments)
    ▼                                           │
ML Service (Python FastAPI)    OpenWeatherMap API (weather)
    │
    ▼
MongoDB (data storage)
```

**Why 3 separate services?**
- **Node.js backend**: handles auth, business logic, database, routing
- **Python ML service**: handles predictions — Python has the best ML ecosystem
- **React frontend**: handles all user interface and interactions

---

## 📁 Project Structure

```
smart-fertilizer/
├── backend/             Node.js + Express API
│   ├── server.js        Entry point
│   └── src/
│       ├── config/      Database connection
│       ├── models/      Mongoose schemas (User, Product, Order, etc.)
│       ├── controllers/ Business logic (one file per feature)
│       ├── routes/      URL routing (maps URLs to controllers)
│       ├── middleware/  JWT auth + error handling
│       └── services/    External API clients (ML, Stripe, Weather)
│
├── frontend/            React + Vite + Tailwind
│   └── src/
│       ├── pages/       Full-page components (Home, Recommend, etc.)
│       ├── components/  Reusable UI pieces (Navbar)
│       ├── context/     Global state (AuthContext)
│       └── services/    Axios API client
│
├── ml-service/          Python FastAPI
│   ├── main.py          App + predict endpoint
│   └── requirements.txt
│
└── docker-compose.yml   Run everything with one command
```

---

## 🚀 Setup & Running (Manual — Recommended for Development)

### Prerequisites
- Node.js 18+ (`node --version`)
- Python 3.9+ (`python --version`)
- MongoDB running locally OR a MongoDB Atlas URI
- Git

---

### Step 1 — Clone and set up the backend

```bash
cd smart-fertilizer/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Open .env and fill in:
#   MONGO_URI=mongodb://localhost:27017/smart-fertilizer
#   JWT_SECRET=any_random_string_at_least_32_chars
#   STRIPE_SECRET_KEY=sk_test_...  (from dashboard.stripe.com)
#   WEATHER_API_KEY=...  (from openweathermap.org — free tier works)
#   ML_SERVICE_URL=http://localhost:8000

# Start the backend (runs on http://localhost:5000)
npm run dev
```

**Expected output:**
```
Server running on port 5000
MongoDB connected: localhost
```

---

### Step 2 — Seed the database with starter products

Once the backend is running, open a new terminal and run:

```bash
curl -X POST http://localhost:5000/api/products/seed
```

Or open your browser to: `http://localhost:5000/api/products/seed` (won't work — it's POST).
Use Postman, Insomnia, or the Marketplace page's "Seed" button.

**This adds 6 fertilizer products to MongoDB.**

---

### Step 3 — Set up and run the ML service

```bash
cd smart-fertilizer/ml-service

# Create a virtual environment (keeps dependencies isolated)
python -m venv venv

# Activate it:
source venv/bin/activate        # Mac/Linux
# OR
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Start the ML service (runs on http://localhost:8000)
python main.py
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

**Test it manually:**
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "N": 40, "P": 15, "K": 20,
    "temperature": 28, "humidity": 65,
    "pH": 6.5, "rainfall": 5,
    "crop": "wheat"
  }'
```

---

### Step 4 — Set up and run the frontend

```bash
cd smart-fertilizer/frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Open .env and set:
#   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Start the dev server (runs on http://localhost:5173)
npm run dev
```

Open your browser at: **http://localhost:5173**

---

## 🐳 Running with Docker (Alternative)

If you have Docker and Docker Compose installed:

```bash
cd smart-fertilizer

# Copy and fill in your env vars
cp backend/.env.example backend/.env
# Edit backend/.env with your actual values

# Build and start all services
docker-compose up

# First time only — seed the database:
curl -X POST http://localhost:5000/api/products/seed
```

**URLs when running with Docker:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- ML Service: http://localhost:8000
- ML Docs (auto-generated): http://localhost:8000/docs

---

## 🔑 API Reference

### Auth
| Method | URL | Body | Description |
|--------|-----|------|-------------|
| POST | `/api/auth/register` | `{name, email, password}` | Create account |
| POST | `/api/auth/login` | `{email, password}` | Get JWT token |
| GET | `/api/auth/me` | — (token required) | Get current user |

### Fertilizer Recommendations
| Method | URL | Body | Description |
|--------|-----|------|-------------|
| POST | `/api/fertilizer/recommend` | `{nitrogen, phosphorus, potassium, pH, moisture, crop, city}` | Get top 3 recommendations |
| GET | `/api/fertilizer/history` | — (token required) | Get user's past recommendations |

### Products
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products?category=organic` | Filter by category |
| GET | `/api/products/:id` | Single product |
| POST | `/api/products/seed` | Populate starter data |

### Orders
| Method | URL | Body | Description |
|--------|-----|------|-------------|
| POST | `/api/orders` | `{items: [{productId, quantity}], shippingAddress}` | Create order |
| GET | `/api/orders` | — (token required) | Get user's orders |
| GET | `/api/orders/:id` | — (token required) | Single order |

### Payments (Stripe)
| Method | URL | Body | Description |
|--------|-----|------|-------------|
| POST | `/api/payments/create-intent` | `{orderId}` | Create Stripe PaymentIntent |
| POST | `/api/payments/confirm` | `{orderId}` | Mark order as paid |

### Weather
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/weather?city=Mumbai` | Get current weather |

### Feedback
| Method | URL | Body | Description |
|--------|-----|------|-------------|
| POST | `/api/feedback` | `{fertilizerUsed, rating, yieldChange, notes}` | Submit feedback |
| GET | `/api/feedback` | — (token required) | Get user's feedback |

### ML Service
| Method | URL | Body | Description |
|--------|-----|------|-------------|
| POST | `/predict` | `{N, P, K, temperature, humidity, pH, rainfall, crop}` | Get predictions |
| GET | `/health` | — | Health check |
| GET | `/docs` | — | Auto-generated API documentation |

---

## 💳 Stripe Test Mode

Use these test card numbers (no real money is charged):

| Card | Use case |
|------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Declined payment |
| `4000 0025 0000 3155` | 3D Secure authentication required |

Expiry: any future date. CVC: any 3 digits.

---

## 🔧 Common Issues & Fixes

**"MongoDB connection error"**
→ Make sure MongoDB is running: `mongod` or start the MongoDB service.
→ Or use a free MongoDB Atlas URI instead of localhost.

**"ML service error" in recommendation**
→ The backend has a fallback — it will return mock recommendations if ML is down.
→ Start the Python service: `cd ml-service && python main.py`

**"Weather is showing mock data"**
→ Add your OpenWeatherMap API key to `backend/.env`
→ Get a free key at: https://openweathermap.org/api

**"Cannot find module" errors**
→ Run `npm install` inside the correct folder (backend/ or frontend/)

**Frontend shows "Network Error"**
→ Make sure backend is running on port 5000.
→ Vite's proxy (`/api → localhost:5000`) only works when `npm run dev` is running.

**Port already in use**
→ Kill the process using the port: `lsof -ti:5000 | xargs kill` (Mac/Linux)
→ Or change the port in `.env` and `vite.config.js`

---

## 🗺 Feature Roadmap (extend this project)

- [ ] Replace rule-based ML with a trained scikit-learn model
- [ ] Add SHAP values for more detailed explainability
- [ ] Add an admin panel to manage products and orders
- [ ] Email notifications on order placement (Nodemailer)
- [ ] Full Stripe Elements card UI in Checkout
- [ ] Stripe webhook for reliable payment confirmation
- [ ] Crop calendar feature (when to apply which fertilizer)
- [ ] PDF report generation for recommendations
- [ ] Mobile app with React Native (same backend)

---

## 📚 Key Technologies Explained

| Technology | Role | Learn more |
|-----------|------|------------|
| **React + Vite** | UI framework + build tool | vitejs.dev |
| **Tailwind CSS** | Utility-first CSS | tailwindcss.com |
| **React Router** | Client-side routing | reactrouter.com |
| **Axios** | HTTP client for API calls | axios-http.com |
| **Express.js** | Node.js web framework | expressjs.com |
| **Mongoose** | MongoDB object modeling | mongoosejs.com |
| **JWT** | Auth token standard | jwt.io |
| **FastAPI** | Python web framework | fastapi.tiangolo.com |
| **Pydantic** | Python data validation | docs.pydantic.dev |
| **Stripe** | Payment processing | stripe.com/docs |
