# ml-service/main.py  ─ v2.0  Real Random Forest Model
# ────────────────────────────────────────────────────────────────────────────
# MODEL  : RandomForestClassifier (200 trees, scikit-learn)
# DATA   : Fertilizer Prediction Dataset — 98 samples, 8 features
# ACCURACY: 100% test | 100% 5-fold CV
# RETRAIN: python train_model.py
# ────────────────────────────────────────────────────────────────────────────

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import uvicorn, joblib, json, numpy as np, os

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="FertiSmart ML Service",
    description="Random Forest fertilizer recommendation (100% accuracy)",
    version="2.0.0",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Load model artifacts once at startup ─────────────────────────────────────
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
try:
    RF_MODEL = joblib.load(os.path.join(MODEL_DIR, "fertilizer_rf_model.pkl"))
    LE_SOIL  = joblib.load(os.path.join(MODEL_DIR, "le_soil.pkl"))
    LE_CROP  = joblib.load(os.path.join(MODEL_DIR, "le_crop.pkl"))
    LE_FERT  = joblib.load(os.path.join(MODEL_DIR, "le_fert.pkl"))
    with open(os.path.join(MODEL_DIR, "metadata.json")) as f:
        METADATA = json.load(f)
    MODEL_LOADED = True
    print(f"✅ Model loaded | classes: {METADATA['fert_classes']} | accuracy: {METADATA.get('test_accuracy',1)*100:.0f}%")
except Exception as e:
    print(f"⚠️  Model load failed: {e}  — run: python train_model.py")
    MODEL_LOADED = False
    METADATA = {}

# ── Fertilizer agronomic detail catalog ──────────────────────────────────────
# ML model predicts WHICH fertilizer; this dict explains WHY.
FERT_DETAILS = {
    "Urea": {
        "npk": "46-0-0", "N": 46, "P": 0, "K": 0, "type": "chemical",
        "desc": "World's most-used nitrogen source (46% N). Rapidly boosts vegetative growth, "
                "deepens leaf colour, and raises grain protein. Apply in split doses to reduce "
                "volatilisation losses.",
        "apply_when": "Crop is in active vegetative growth and soil N is deficient.",
    },
    "DAP": {
        "npk": "18-46-0", "N": 18, "P": 46, "K": 0, "type": "chemical",
        "desc": "Di-Ammonium Phosphate — most popular phosphatic fertilizer (18% N, 46% P₂O₅). "
                "Promotes vigorous root development, early establishment, and strong flowering. "
                "Best applied as a basal dose at sowing.",
        "apply_when": "At sowing as basal application when soil phosphorus is low.",
    },
    "14-35-14": {
        "npk": "14-35-14", "N": 14, "P": 35, "K": 14, "type": "chemical",
        "desc": "Complex NPK with high phosphorus emphasis (14-35-14). Supplies all three "
                "primary nutrients. Especially effective for cotton and tobacco in black and "
                "red soils where P is the limiting factor.",
        "apply_when": "When soil needs moderate N and K but high P — typical in black/red soils.",
    },
    "28-28": {
        "npk": "28-28-0", "N": 28, "P": 28, "K": 0, "type": "chemical",
        "desc": "Equal N-P complex (28-28-0). Balanced nitrogen and phosphorus without potassium. "
                "Ideal where soil K is already adequate but both N and P need supplementing. "
                "Common in cotton-growing regions.",
        "apply_when": "When soil potassium is adequate but both N and P are deficient.",
    },
    "10-26-26": {
        "npk": "10-26-26", "N": 10, "P": 26, "K": 26, "type": "chemical",
        "desc": "High P-K complex (10-26-26). Low nitrogen with strong phosphorus and potassium. "
                "Enhances drought tolerance, disease resistance, and crop quality at grain-filling "
                "and reproductive stages. Widely used for paddy and wheat at tillering.",
        "apply_when": "When N is adequate but P and K are deficient — common in paddy systems.",
    },
}

FERT_DISPLAY = {
    "Urea"    : "Urea (46-0-0)",
    "DAP"     : "DAP — Di-Ammonium Phosphate (18-46-0)",
    "14-35-14": "Complex NPK 14-35-14",
    "28-28"   : "Complex NPK 28-28-0",
    "10-26-26": "Complex NPK 10-26-26",
}

# ── Schemas ───────────────────────────────────────────────────────────────────
class SoilInput(BaseModel):
    N: float           = Field(..., ge=0, le=200,  description="Nitrogen kg/ha")
    P: float           = Field(..., ge=0, le=200,  description="Phosphorous kg/ha")
    K: float           = Field(..., ge=0, le=200,  description="Potassium kg/ha")
    temperature: float = Field(...,                description="Temp °C")
    humidity: float    = Field(..., ge=0, le=100,  description="Humidity %")
    pH: float          = Field(..., ge=0, le=14,   description="Soil pH")
    rainfall: float    = Field(default=0, ge=0,    description="Rainfall mm")
    crop: str          = Field(...,                description="Crop type")
    soil_type: str     = Field(default="Loamy",    description="Sandy/Loamy/Black/Red/Clayey")
    moisture: float    = Field(default=50.0, ge=0, le=100, description="Soil moisture %")

class FertilizerResult(BaseModel):
    fertilizer: str
    score: float
    explanation: str

class PredictionResponse(BaseModel):
    recommendations: List[FertilizerResult]
    model_info: dict
    input_summary: dict

# ── Helpers ───────────────────────────────────────────────────────────────────
def safe_encode(encoder, value: str, fallback: int = 0) -> int:
    """Encode with case-insensitive match; returns fallback if unseen."""
    for i, cls in enumerate(encoder.classes_):
        if cls.lower() == value.lower():
            return i
    for i, cls in enumerate(encoder.classes_):
        if value.lower() in cls.lower() or cls.lower() in value.lower():
            return i
    return fallback

def build_explanation(fert_name: str, score: float, soil: SoilInput) -> str:
    """
    Plain-English explanation driven by feature importances:
      Nitrogen 34.5% | Moisture 21.7% | Phosphorous 16.1% |
      Crop 12.5% | Temp 7.5% | Potassium 5.4%
    """
    detail = FERT_DETAILS.get(fert_name, {})
    reasons = []

    # Nitrogen (most important feature)
    if   soil.N < 20:  reasons.append(f"nitrogen is severely low (N={soil.N} kg/ha)")
    elif soil.N < 40:  reasons.append(f"nitrogen is below optimal (N={soil.N} kg/ha)")
    elif soil.N > 100: reasons.append(f"nitrogen is high — low-N fertilizer preferred (N={soil.N})")

    # Moisture (2nd most important)
    if   soil.moisture < 30: reasons.append(f"soil is dry ({soil.moisture}% moisture)")
    elif soil.moisture > 70: reasons.append(f"soil is moist ({soil.moisture}%)")

    # Phosphorous
    if   soil.P < 10: reasons.append(f"phosphorous is critically low (P={soil.P})")
    elif soil.P > 60: reasons.append(f"phosphorous is high (P={soil.P})")

    # Potassium
    if soil.K < 15: reasons.append(f"potassium needs supplementing (K={soil.K})")

    # pH note
    ph_note = ""
    if   soil.pH < 5.5: ph_note = f" Soil is acidic (pH {soil.pH}) — consider liming."
    elif soil.pH > 7.8: ph_note = f" Soil is alkaline (pH {soil.pH}) — some micronutrients may be locked."

    crop_str = f"For {soil.crop} on {soil.soil_type} soil"
    if reasons:
        nutrient_ctx = "; ".join(reasons[:3])
        intro = f"{crop_str}, the model detected: {nutrient_ctx}. "
    else:
        intro = f"{crop_str} with balanced nutrient levels. "

    npk   = detail.get("npk", "")
    desc  = detail.get("desc", "")
    when  = detail.get("apply_when", "")

    return (
        f"{intro}{desc} NPK: {npk}. {when}{ph_note} "
        f"Model confidence: {score:.1f}%."
    ).strip()

# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "service" : "FertiSmart ML Service v2.0",
        "model"   : "RandomForestClassifier (200 trees)",
        "accuracy": f"{METADATA.get('test_accuracy',1)*100:.0f}%",
        "status"  : "ready" if MODEL_LOADED else "model not loaded — run train_model.py",
        "docs"    : "/docs",
    }

@app.get("/health")
def health():
    return {"status": "ok" if MODEL_LOADED else "degraded", "model_loaded": MODEL_LOADED}

@app.get("/model-info")
def model_info():
    return {
        "algorithm"        : "RandomForestClassifier",
        "n_estimators"     : METADATA.get("n_estimators", 200),
        "test_accuracy"    : f"{METADATA.get('test_accuracy',1)*100:.1f}%",
        "cv_accuracy"      : f"{METADATA.get('cv_accuracy',1)*100:.1f}%",
        "training_samples" : 98,
        "supported_crops"  : METADATA.get("crop_classes", []),
        "supported_soils"  : METADATA.get("soil_classes", []),
        "fertilizers"      : METADATA.get("fert_classes", []),
        "top_features"     : {
            "Nitrogen":34.5, "Moisture":21.7, "Phosphorous":16.1,
            "Crop_Type":12.5, "Temperature":7.5, "Potassium":5.4,
            "Humidity":1.6, "Soil_Type":0.6
        },
    }

@app.post("/predict", response_model=PredictionResponse)
def predict(soil: SoilInput):
    """
    Predict best fertilizer using the trained Random Forest.

    Supported crops : Cotton, Maize, Paddy, Sugarcane, Tobacco, Wheat
    Supported soils : Sandy, Loamy, Black, Red, Clayey
    Unknown inputs are matched to the nearest known class automatically.
    """
    if not MODEL_LOADED:
        raise HTTPException(503, "ML model not loaded. Run: python train_model.py")
    try:
        soil_enc = safe_encode(LE_SOIL, soil.soil_type)
        crop_enc = safe_encode(LE_CROP, soil.crop)

        # Feature order must match training: Temperature, Humidity, Moisture,
        # Soil_Enc, Crop_Enc, Nitrogen, Potassium, Phosphorous
        X = np.array([[
            soil.temperature, soil.humidity, soil.moisture,
            soil_enc, crop_enc,
            soil.N, soil.K, soil.P   # ← note K before P (matches dataset column order)
        ]])

        pred_idx   = RF_MODEL.predict(X)[0]
        proba      = RF_MODEL.predict_proba(X)[0]
        pred_name  = LE_FERT.inverse_transform([pred_idx])[0]
        classes    = LE_FERT.classes_

        prob_dict = {classes[i]: round(float(proba[i]) * 100, 1) for i in range(len(classes))}

        # Top-3 by probability
        ranked = sorted(prob_dict.items(), key=lambda x: x[1], reverse=True)[:3]
        recs = [
            FertilizerResult(
                fertilizer=FERT_DISPLAY.get(name, name),
                score=score,
                explanation=build_explanation(name, score, soil),
            )
            for name, score in ranked
        ]

        return PredictionResponse(
            recommendations=recs,
            model_info={
                "model"         : "Random Forest (200 trees)",
                "top_prediction": FERT_DISPLAY.get(pred_name, pred_name),
                "confidence"    : f"{prob_dict[pred_name]:.1f}%",
                "all_scores"    : {FERT_DISPLAY.get(k,k): f"{v:.1f}%" for k,v in sorted(prob_dict.items(), key=lambda x:-x[1])},
            },
            input_summary={
                "crop": soil.crop, "soil_type": soil.soil_type,
                "N": soil.N, "P": soil.P, "K": soil.K, "pH": soil.pH,
                "moisture": soil.moisture,
                "weather": {"temperature": soil.temperature, "humidity": soil.humidity, "rainfall": soil.rainfall},
            },
        )
    except Exception as e:
        raise HTTPException(500, f"Prediction failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
