// ==========================================
// CONFIGURATION CENTRALISÉE
// ==========================================

const config = {
  // Serveur
  PORT: process.env.PORT || 10000,
  
  // Base de données
  DB_FILE: "./db.json",
  
  // API Externe - SerpAPI
  API: {
    // ✅ TA CLÉ API SERPAPI
    SERPAPI_KEY: process.env.SERPAPI_KEY || "d3d3456a79967181d142b402040806b4d9b47fff0fa0191939a6173f5bd7d526",
    
    // Paramètres de recherche
    DEFAULT_COUNTRY: "bj",
    DEFAULT_LANGUAGE: "fr",
    RESULTS_LIMIT: 8,
    
    // URLs
    BASE_URL: "https://serpapi.com/search",
    TIMEOUT: 15000
  },
  
  // Application
  APP: {
    NAME: "Localisateur Intelligent",
    VERSION: "2.0.0",
    AUTHOR: "Sossou Kouamé"
  }
};

module.exports = config;
