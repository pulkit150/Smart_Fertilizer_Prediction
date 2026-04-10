// components/FertilizerForm.jsx
// ─────────────────────────────────────────────────────────────────────────────
// A reusable controlled form component for entering soil data.
//
// CONTROLLED vs UNCONTROLLED FORMS in React:
//
// Uncontrolled: the DOM manages the input values (using ref). Simple but
//   you can't easily validate or pre-fill values.
//
// Controlled: React state manages every input value. The input's `value`
//   prop is tied to state, and `onChange` updates the state. React is
//   always the "single source of truth" for the form data.
//
// We use controlled inputs here. Every keystroke:
//   1. Fires onChange
//   2. Calls setForm with the updated field
//   3. React re-renders with the new value
//
// PROPS:
//   onSubmit  = async function called with the form data when submitted
//   loading   = boolean — disables the submit button while request is in flight
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

// RULE: Keep this list in sync with the ML training data.
// Any crop here that the model hasn't seen gets mapped to the nearest known class.
// Currently trained on: Cotton, Maize, Paddy, Sugarcane, Tobacco, Wheat, Banana, Potato
const CROPS = [
  "wheat", "maize", "paddy", "sugarcane", "cotton", "tobacco",
  "banana", "potato",  // ← added when MOP was introduced (MOP targets high-K crops)
];

// Soil types the model knows. Must match training_data.csv exactly (case-sensitive).
const SOIL_TYPES = ["Sandy", "Loamy", "Black", "Red", "Clayey"];

// Default starting values — realistic mid-range soil readings
const INITIAL_FORM = {
  nitrogen: 40,
  phosphorus: 20,
  potassium: 30,
  pH: 6.5,
  moisture: 50,
  crop: "wheat",
  soilType: "Loamy",  // ← added: model uses this as a feature (0.6% importance)
  city: "Delhi",
};

export default function FertilizerForm({ onSubmit, loading }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  // Generic onChange — works for ALL inputs because we use [name] as the key
  // e.target.name must match the key in the form state object
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear that field's error as user types
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Simple client-side validation before sending to backend
  const validate = () => {
    const newErrors = {};
    if (form.pH < 0 || form.pH > 14) newErrors.pH = "pH must be between 0 and 14";
    if (form.moisture < 0 || form.moisture > 100) newErrors.moisture = "Moisture must be 0–100%";
    if (!form.crop) newErrors.crop = "Please select a crop";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return; // stop here — don't call onSubmit
    }
    onSubmit(form); // pass data UP to the parent (Recommendation page)
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">

      {/* Section: Nutrients */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>🧪</span> Soil Nutrients (kg/ha)
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Nitrogen (N)" name="nitrogen" value={form.nitrogen}
            onChange={handleChange} min={0} max={140} error={errors.nitrogen} />
          <NumberField label="Phosphorus (P)" name="phosphorus" value={form.phosphorus}
            onChange={handleChange} min={0} max={140} error={errors.phosphorus} />
          <NumberField label="Potassium (K)" name="potassium" value={form.potassium}
            onChange={handleChange} min={0} max={200} error={errors.potassium} />
        </div>
      </div>

      {/* Section: Soil Conditions */}
      <div className="pt-2 border-t border-gray-100">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>🌍</span> Soil Conditions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="pH Level" name="pH" value={form.pH}
            onChange={handleChange} min={0} max={14} step={0.1} error={errors.pH} />
          <NumberField label="Moisture (%)" name="moisture" value={form.moisture}
            onChange={handleChange} min={0} max={100} error={errors.moisture} />
        </div>
      </div>

      {/* Section: Crop + Location */}
      <div className="pt-2 border-t border-gray-100">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>🌾</span> Crop & Location
        </h2>
        <div className="space-y-3">
          {/* Soil Type — used by the ML model as a feature */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Soil Type</label>
            <select
              name="soilType" value={form.soilType} onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              {SOIL_TYPES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Crop Type</label>
            <select
              name="crop" value={form.crop} onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              {CROPS.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
            {errors.crop && <p className="text-xs text-red-500 mt-1">{errors.crop}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Your City <span className="font-normal text-gray-400">(for weather auto-fetch)</span>
            </label>
            <input
              type="text" name="city" value={form.city} onChange={handleChange}
              placeholder="e.g. Mumbai, Pune, Bhopal"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-base hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⟳</span> Analysing...
          </span>
        ) : (
          "Get My Recommendations →"
        )}
      </button>
    </form>
  );
}

// Reusable number input field — avoids repeating the same JSX 6 times
function NumberField({ label, name, value, onChange, min, max, step = 0.1, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <input
        type="number" name={name} value={value}
        min={min} max={max} step={step}
        onChange={onChange}
        className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}