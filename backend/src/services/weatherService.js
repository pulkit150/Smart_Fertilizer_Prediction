const axios = require("axios");

const WEATHER_KEY = process.env.WEATHER_API_KEY;

/**
 * Fetch current weather from OpenWeatherMap.
 * Falls back to mock data if API key is missing or call fails.
 */
const getWeather = async (city = "Delhi") => {
  // If no API key, return mock data
  if (!WEATHER_KEY || WEATHER_KEY === "your_openweather_api_key_here") {
    console.log("Using mock weather data (no API key set)");
    return getMockWeather(city);
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_KEY}&units=metric`;
    const { data } = await axios.get(url, { timeout: 5000 });

    return {
      city: data.name,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      rainfall: data.rain ? data.rain["1h"] || 0 : 0,
    };
  } catch (error) {
    console.error("Weather API error:", error.message);
    return getMockWeather(city);
  }
};

// Mock weather for development without an API key
const getMockWeather = (city) => ({
  city,
  temperature: 28,
  humidity: 65,
  description: "partly cloudy",
  rainfall: 5,
  isMock: true,
});

module.exports = { getWeather };
