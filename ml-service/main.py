# ml-service/main.py
# ─────────────────────────────────────────────────────────────────────────────
# FastAPI microservice that receives soil + weather data and returns
# the top 3 fertilizer recommendations with scores and plain-English explanations.
#
# WHY A SEPARATE PYTHON SERVICE?
# The Node.js backend is great for HTTP routing, auth, and database access,
# but Python has the best ML ecosystem (scikit-learn, pandas, numpy, etc.).
# By splitting ML into its own service:
#   - You can swap/retrain the model without touching the backend
#   - It can scale independently (ML inference can be CPU-heavy)
#   - Teams can work on it independently
#
# HOW IT WORKS (rule-based for now):
# 1. Receive soil NPK values, crop type, weather data
# 2. For each fertilizer in our catalog, compute a "deficiency match score"
#    (how well does this fertilizer fill what the soil is missing?)
# 3. Add crop bonus points if the fertilizer is known to suit this crop
# 4. Sort by score descending → return top 3
# 5. Generate a plain-English explanation for each
#
# TO UPGRADE TO A REAL ML MODEL:
# Replace the score_fertilizer() function with:
#   import joblib
#   model = joblib.load("models/fertilizer_model.pkl")
#   prediction = model.predict([[N, P, K, temp, humidity, pH, rainfall]])
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn

# ── App setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="FertiSmart ML Service",
    description="Fertilizer recommendation microservice",
    version="1.0.0",
)

# Allow requests from the Node.js backend (and frontend in dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your backend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Data schemas (Pydantic validates input automatically) ─────────────────────
# If a required field is missing or the wrong type, FastAPI returns a 422 error
# with a clear message — no manual validation code needed.

class SoilInput(BaseModel):
    N: float = Field(..., ge=0, le=200, description="Nitrogen content kg/ha")
    P: float = Field(..., ge=0, le=200, description="Phosphorus content kg/ha")
    K: float = Field(..., ge=0, le=200, description="Potassium content kg/ha")
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float    = Field(..., ge=0, le=100, description="Humidity percentage")
    pH: float          = Field(..., ge=0, le=14, description="Soil pH level")
    rainfall: float    = Field(default=0, ge=0, description="Rainfall in mm")
    crop: str          = Field(..., description="Crop type e.g. wheat, rice")

class FertilizerResult(BaseModel):
    fertilizer: str    # Product name
    score: float       # Match percentage 0–100
    explanation: str   # Plain-English reason

class PredictionResponse(BaseModel):
    recommendations: List[FertilizerResult]
    input_summary: dict  # Echo back what was received (useful for debugging)

# ── Fertilizer catalog ────────────────────────────────────────────────────────
# Each entry has: N/P/K it supplies, suitable crops, and a description template.
# Format: { "name": { "N": %, "P": %, "K": %, "crops": [...], "desc": "..." } }

FERTILIZER_CATALOG = {
    "Urea (46-0-0)": {
        "N": 46, "P": 0, "K": 0,
        "crops": ["wheat", "rice", "maize", "sugarcane", "cotton", "mustard"],
        "desc": "High-nitrogen fertilizer. Best for leafy growth and green biomass.",
        "type": "chemical",
    },
    "DAP (18-46-0)": {
        "N": 18, "P": 46, "K": 0,
        "crops": ["wheat", "cotton", "soybean", "potato", "chickpea", "groundnut"],
        "desc": "Di-Ammonium Phosphate. Promotes root development and early plant establishment.",
        "type": "chemical",
    },
    "MOP (0-0-60)": {
        "N": 0, "P": 0, "K": 60,
        "crops": ["banana", "potato", "tomato", "sugarcane", "onion", "garlic"],
        "desc": "Muriate of Potash. Improves drought resistance, fruit quality, and disease resistance.",
        "type": "chemical",
    },
    "NPK 20-20-20": {
        "N": 20, "P": 20, "K": 20,
        "crops": ["vegetables", "fruits", "flowers", "tomato", "onion"],
        "desc": "Balanced fertilizer. Good for crops needing all three primary nutrients equally.",
        "type": "chemical",
    },
    "SSP (0-16-0)": {
        "N": 0, "P": 16, "K": 0,
        "crops": ["groundnut", "soybean", "cotton", "sunflower", "potato"],
        "desc": "Single Super Phosphate. Also provides calcium and sulphur alongside phosphorus.",
        "type": "chemical",
    },
    "NPK 10-26-26": {
        "N": 10, "P": 26, "K": 26,
        "crops": ["wheat", "maize", "soybean", "potato", "sugarcane"],
        "desc": "High P and K formula. Excellent for root crops and grain filling stage.",
        "type": "chemical",
    },
    "Vermicompost": {
        "N": 2, "P": 1, "K": 1,
        "crops": ["all"],  # special keyword — suits all crops
        "desc": "100% organic. Improves soil structure, microbial life, and water retention.",
        "type": "organic",
    },
    "Neem Cake (5-1-1)": {
        "N": 5, "P": 1, "K": 1,
        "crops": ["vegetables", "cotton", "rice", "groundnut"],
        "desc": "Organic slow-release nitrogen. Also acts as natural nematicide and pest repellent.",
        "type": "organic",
    },
}

# Ideal NPK levels for healthy soil (used to calculate deficiency)
IDEAL_N = 80
IDEAL_P = 40
IDEAL_K = 40

# ── Scoring logic ─────────────────────────────────────────────────────────────

def compute_deficiency(soil: SoilInput) -> dict:
    """
    Calculate how much of each nutrient the soil is MISSING relative to ideal.
    Deficiency = max(0, ideal - actual)
    If soil has MORE than ideal, deficiency is 0 (no need for that nutrient).
    """
    return {
        "N": max(0.0, IDEAL_N - soil.N),
        "P": max(0.0, IDEAL_P - soil.P),
        "K": max(0.0, IDEAL_K - soil.K),
    }


def score_fertilizer(name: str, fert: dict, soil: SoilInput, deficiency: dict) -> float:
    """
    Score a fertilizer (0–100) based on how well it addresses soil deficiencies.

    ALGORITHM:
    1. Total deficiency = sum of N, P, K shortfalls
    2. For each nutrient: contribution = min(fertilizer_nutrient, deficiency)
       (we only get credit up to what's actually deficient — excess helps less)
    3. Score = (N_contribution + P_contribution + K_contribution) / total_deficiency × 100
    4. Bonus points if the fertilizer is known to suit this crop (+15)
    5. Penalty for very high/low pH that might reduce nutrient uptake (-10)
    """
    total_deficiency = deficiency["N"] + deficiency["P"] + deficiency["K"]

    # If soil has no deficiencies, a balanced fertilizer like NPK 20-20-20 scores best
    if total_deficiency == 0:
        # Score based on balance — how equal are the nutrient levels?
        nutrients = [fert["N"], fert["P"], fert["K"]]
        balance = 100 - (max(nutrients) - min(nutrients))
        return round(min(100, max(0, balance)), 1)

    # Calculate how much of each deficiency this fertilizer addresses
    n_contribution = min(fert["N"] * 0.5, deficiency["N"])  # scale factor: more N than deficiency = diminishing returns
    p_contribution = min(fert["P"] * 0.5, deficiency["P"])
    k_contribution = min(fert["K"] * 0.5, deficiency["K"])

    raw_score = (n_contribution + p_contribution + k_contribution) / total_deficiency * 100

    # Crop compatibility bonus
    crop_lower = soil.crop.lower()
    suitable_crops = [c.lower() for c in fert["crops"]]
    if "all" in suitable_crops or crop_lower in suitable_crops:
        raw_score += 15

    # pH penalty — most nutrients are unavailable below 5.5 or above 8.5
    if soil.pH < 5.5 or soil.pH > 8.5:
        raw_score -= 10

    # Clamp to 0–100
    return round(min(100.0, max(0.0, raw_score)), 1)


def generate_explanation(name: str, score: float, soil: SoilInput, fert: dict, deficiency: dict) -> str:
    """
    Build a plain-English reason why this fertilizer was recommended.
    This is the 'explainability' feature — users shouldn't see a black box.
    """
    reasons = []

    # Identify the biggest deficiency
    if deficiency["N"] > 30:
        reasons.append(f"your soil is significantly low in Nitrogen (N={soil.N} vs ideal ~{IDEAL_N})")
    elif deficiency["N"] > 10:
        reasons.append(f"soil Nitrogen is moderately low (N={soil.N})")

    if deficiency["P"] > 20:
        reasons.append(f"Phosphorus is deficient (P={soil.P} vs ideal ~{IDEAL_P})")
    elif deficiency["P"] > 5:
        reasons.append(f"Phosphorus could be higher (P={soil.P})")

    if deficiency["K"] > 20:
        reasons.append(f"Potassium is low (K={soil.K} vs ideal ~{IDEAL_K})")

    # Mention crop suitability
    suitable_crops = [c.lower() for c in fert["crops"]]
    crop_mention = ""
    if "all" in suitable_crops:
        crop_mention = f"It works well for all crops including {soil.crop}."
    elif soil.crop.lower() in suitable_crops:
        crop_mention = f"It is specifically suited for {soil.crop}."

    # pH note
    ph_note = ""
    if soil.pH < 6.0:
        ph_note = " Note: acidic soil (pH {:.1f}) — consider liming to improve nutrient uptake.".format(soil.pH)
    elif soil.pH > 7.5:
        ph_note = " Note: alkaline soil (pH {:.1f}) — some micronutrients may be less available.".format(soil.pH)

    # Build the final sentence
    if reasons:
        reason_text = "Recommended because " + " and ".join(reasons) + "."
    else:
        reason_text = "A good general-purpose choice for your soil profile."

    return f"{reason_text} {fert['desc']} {crop_mention}{ph_note} Match score: {score}%.".strip()


# ── API Endpoints ─────────────────────────────────────────────────────────────

@app.get("/")
def root():
    """Health check for the ML service."""
    return {
        "service": "FertiSmart ML Service",
        "status": "running",
        "endpoints": ["/predict", "/health"],
    }


@app.get("/health")
def health():
    """Simple health check — backend uses this to verify the ML service is up."""
    return {"status": "ok", "fertilizers_in_catalog": len(FERTILIZER_CATALOG)}


@app.post("/predict", response_model=PredictionResponse)
def predict(soil: SoilInput):
    """
    Main prediction endpoint.

    Receives soil + weather data, returns top 3 fertilizer recommendations
    with scores (0–100) and plain-English explanations.

    Example request body:
    {
        "N": 40, "P": 15, "K": 20,
        "temperature": 28, "humidity": 65,
        "pH": 6.5, "rainfall": 5,
        "crop": "wheat"
    }
    """
    try:
        # Calculate what the soil is missing
        deficiency = compute_deficiency(soil)

        # Score every fertilizer in the catalog
        scored = []
        for name, fert_data in FERTILIZER_CATALOG.items():
            score = score_fertilizer(name, fert_data, soil, deficiency)
            explanation = generate_explanation(name, score, soil, fert_data, deficiency)
            scored.append(
                FertilizerResult(
                    fertilizer=name,
                    score=score,
                    explanation=explanation,
                )
            )

        # Sort by score descending and return top 3
        top3 = sorted(scored, key=lambda x: x.score, reverse=True)[:3]

        return PredictionResponse(
            recommendations=top3,
            input_summary={
                "crop": soil.crop,
                "N": soil.N, "P": soil.P, "K": soil.K,
                "pH": soil.pH,
                "deficiency": deficiency,
                "weather": {
                    "temperature": soil.temperature,
                    "humidity": soil.humidity,
                    "rainfall": soil.rainfall,
                },
            },
        )

    except Exception as e:
        # Return a proper HTTP error — FastAPI will format it as JSON
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ── Run directly (python main.py) ────────────────────────────────────────────
# In production use: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
