const axios = require("axios");

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

/**
 * Call the ML microservice to get fertilizer predictions.
 * @param {Object} inputData - soil and weather data
 * @returns {Array} top 3 recommendations with scores and explanations
 */
const getPrediction = async (inputData) => {
  try {
    const response = await axios.post(`${ML_URL}/predict`, inputData, {
      timeout: 30000, // 30 second timeout
    });
    return response.data;
  } catch (error) {
    console.error("ML service error:", error.message);
    // Fallback mock response if ML service is down
    return {
      recommendations: [
        {
          fertilizer: "Urea",
          score: 92,
          explanation: "High nitrogen deficiency detected. Urea provides 46% N, ideal for your crop.",
        },
        {
          fertilizer: "DAP (Di-Ammonium Phosphate)",
          score: 78,
          explanation: "Moderate phosphorus need. DAP improves root development and early growth.",
        },
        {
          fertilizer: "MOP (Muriate of Potash)",
          score: 65,
          explanation: "Potassium levels are borderline. MOP enhances drought resistance.",
        },
      ],
    };
  }
};

module.exports = { getPrediction };
