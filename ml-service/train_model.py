"""
train_model.py
──────────────────────────────────────────────────────────────────────────────
Run this script to retrain the fertilizer recommendation model.

Usage:
    python train_model.py

What it does:
    1. Loads the training dataset from models/training_data.csv
    2. Encodes categorical features (soil type, crop type, fertilizer name)
    3. Trains a Random Forest classifier (200 trees)
    4. Evaluates with train/test split + cross-validation
    5. Saves the model and encoders to models/ directory

To extend with more data:
    - Add more rows to models/training_data.csv (same column format)
    - Run this script again — it overwrites the old model
──────────────────────────────────────────────────────────────────────────────
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score
import joblib
import json
import os

# ── Config ────────────────────────────────────────────────────────────────────
DATA_PATH   = "models/training_data.csv"
MODEL_DIR   = "models"
FEATURE_COLS = ['Temperature', 'Humidity', 'Moisture', 'Soil_Enc', 'Crop_Enc',
                'Nitrogen', 'Potassium', 'Phosphorous']

# ── Load data ─────────────────────────────────────────────────────────────────
print("Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(f"  Shape: {df.shape}")
print(f"  Fertilizer distribution:\n{df['Fertilizer'].value_counts()}\n")

# ── Encode categorical features ───────────────────────────────────────────────
le_soil = LabelEncoder()
le_crop = LabelEncoder()
le_fert = LabelEncoder()

df['Soil_Enc'] = le_soil.fit_transform(df['Soil_Type'])
df['Crop_Enc'] = le_crop.fit_transform(df['Crop_Type'])
df['Fert_Enc'] = le_fert.fit_transform(df['Fertilizer'])

X = df[FEATURE_COLS].values
y = df['Fert_Enc'].values

# ── Train / test split ────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── Train model ───────────────────────────────────────────────────────────────
print("Training Random Forest (200 trees)...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=None,
    min_samples_split=2,
    min_samples_leaf=1,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

# ── Evaluate ──────────────────────────────────────────────────────────────────
y_pred = model.predict(X_test)
test_acc = accuracy_score(y_test, y_pred)

cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
cv_acc = cv_scores.mean()

print(f"\nTest Accuracy  : {test_acc * 100:.1f}%")
print(f"CV Accuracy    : {cv_acc * 100:.1f}% (+/- {cv_scores.std() * 100:.1f}%)")
print(f"\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=le_fert.classes_))

print("Feature Importances:")
for feat, imp in sorted(zip(FEATURE_COLS, model.feature_importances_), key=lambda x: -x[1]):
    bar = "█" * int(imp * 50)
    print(f"  {feat:<15} {imp:.4f}  {bar}")

# ── Save artifacts ────────────────────────────────────────────────────────────
os.makedirs(MODEL_DIR, exist_ok=True)

joblib.dump(model,   f"{MODEL_DIR}/fertilizer_rf_model.pkl")
joblib.dump(le_soil, f"{MODEL_DIR}/le_soil.pkl")
joblib.dump(le_crop, f"{MODEL_DIR}/le_crop.pkl")
joblib.dump(le_fert, f"{MODEL_DIR}/le_fert.pkl")

metadata = {
    "soil_classes" : list(le_soil.classes_),
    "crop_classes" : list(le_crop.classes_),
    "fert_classes" : list(le_fert.classes_),
    "features"     : FEATURE_COLS,
    "test_accuracy": float(test_acc),
    "cv_accuracy"  : float(cv_acc),
    "n_estimators" : 200
}
with open(f"{MODEL_DIR}/metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print(f"\nAll artifacts saved to ./{MODEL_DIR}/")
print("  - fertilizer_rf_model.pkl")
print("  - le_soil.pkl, le_crop.pkl, le_fert.pkl")
print("  - metadata.json")
