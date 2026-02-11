const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const config = require("./config");

const app = express();

// Middleware
app.use(express.json());
app.use(express.static("public"));

// ==========================================
// BASE DE DONNÉES
// ==========================================

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(config.DB_FILE));
  } catch (error) {
    return { users: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(config.DB_FILE, JSON.stringify(data, null, 2));
}

// ==========================================
// ROUTES UTILISATEURS
// ==========================================

// Inscription
app.post("/register", (req, res) => {
  try {
    const { nom, prenom, email, password } = req.body;
    
    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Tous les champs sont requis" 
      });
    }

    const db = readDB();
    
    // Vérifier si email existe déjà
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({
        success: false,
        error: "Cet email est déjà utilisé"
      });
    }

    const user = {
      id: Date.now().toString(),
      nom,
      prenom,
      email,
      password, // Note: En production, hasher le mot de passe !
      createdAt: new Date().toISOString()
    };
    
    db.users.push(user);
    writeDB(db);

    res.json({
      success: true,
      message: `Bienvenue ${prenom} ! ${config.APP.AUTHOR} est heureux de vous compter parmi ses abonnés.`,
      user: { 
        id: user.id, 
        nom: user.nom, 
        prenom: user.prenom, 
        email: user.email 
      }
    });
  } catch (error) {
    console.error("Erreur register:", error);
    res.status(500).json({ 
      success: false, 
      error: "Erreur serveur lors de l'inscription" 
    });
  }
});

// Liste utilisateurs (admin)
app.get("/users", (req, res) => {
  try {
    const db = readDB();
    res.json({ 
      success: true, 
      count: db.users.length,
      users: db.users.map(u => ({ 
        id: u.id, 
        nom: u.nom, 
        prenom: u.prenom, 
        email: u.email,
        createdAt: u.createdAt 
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// ==========================================
// ROUTES RECHERCHE SERPAPI
// ==========================================

// Recherche principale
app.post("/search", async (req, res) => {
  const { type, ville, quartier } = req.body;
  
  if (!type || !ville) {
    return res.status(400).json({ 
      success: false, 
      error: "Type et ville sont requis" 
    });
  }

  try {
    const searchQuery = `${type} ${quartier ? quartier + ' ' : ''}${ville} Bénin`;
    
    // Vérifier si clé API est configurée
    const apiKey = config.API.SERPAPI_KEY;
    const isDemo = !apiKey || apiKey === "demo_key" || apiKey.length < 20;

    if (isDemo) {
      console.log("⚠️ Mode DÉMO - Clé API non configurée");
      return res.json(generateDemoData(type, ville, quartier));
    }

    // Appel API SerpAPI réel
    console.log(`🔍 Recherche: "${searchQuery}"`);
    
    const response = await axios.get(config.API.BASE_URL, {
      params: {
        engine: "google_maps",
        q: searchQuery,
        ll: "@6.365,2.418,12z",
        type: "search",
        api_key: apiKey,
        hl: config.API.DEFAULT_LANGUAGE,
        gl: config.API.DEFAULT_COUNTRY,
        num: config.API.RESULTS_LIMIT
      },
      timeout: config.API.TIMEOUT
    });

    // Traiter les résultats
    let results = [];
    
    if (response.data.local_results) {
      results = Array.isArray(response.data.local_results) 
        ? response.data.local_results 
        : [response.data.local_results];
    } else if (response.data.place_results) {
      results = [response.data.place_results];
    }

    if (results.length === 0) {
      return res.json({
        success: true,
        demo: false,
        query: searchQuery,
        results: [],
        message: "Aucun résultat trouvé pour cette recherche"
      });
    }

    // Formater les résultats
    const formattedResults = results.map(place => ({
      name: place.title || place.name || "Nom inconnu",
      address: place.address || `${quartier || ville}, Bénin`,
      phone: place.phone || "Non disponible",
      rating: place.rating ? place.rating.toString() : "N/A",
      reviews: place.reviews || 0,
      distance: place.distance || "À proximité",
      description: place.description || `${type} à ${ville}`,
      thumbnail: place.thumbnail || place.image || null,
      gps: place.gps_coordinates || null,
      website: place.website || place.link || null,
      hours: place.hours ? formatHours(place.hours) : "Horaires non disponibles",
      type: type
    }));

    res.json({
      success: true,
      demo: false,
      query: searchQuery,
      results: formattedResults,
      total: formattedResults.length,
      source: "SerpAPI Google Maps"
    });

  } catch (error) {
    console.error("❌ Erreur SerpAPI:", error.message);
    
    // Fallback en mode démo si erreur API
    res.json(generateDemoData(type, ville, quartier));
  }
});

// Formater les horaires
function formatHours(hours) {
  if (typeof hours === 'string') return hours;
  if (hours.open_state) return hours.open_state;
  if (hours.schedule) {
    const today = new Date().getDay();
    const todayHours = hours.schedule.find(h => h.day === today);
    return todayHours ? `${todayHours.time}` : "Horaires disponibles";
  }
  return "Horaires non disponibles";
}

// Générer données démo
function generateDemoData(type, ville, quartier) {
  const demoPlaces = [
    {
      name: `${type} Le Gourmet`,
      address: `${quartier || 'Centre-ville'}, ${ville}`,
      phone: "+229 97 00 00 01",
      rating: "4.5",
      reviews: 128,
      distance: "0.8 km",
      description: `Excellent ${type.toLowerCase()} très apprécié des locaux.`,
      thumbnail: null,
      gps: { latitude: 6.365, longitude: 2.418 },
      website: null,
      hours: "08:00 - 22:00",
      type: type
    },
    {
      name: `${type} Chez Mama`,
      address: `Akpakpa, ${ville}`,
      phone: "+229 96 00 00 02",
      rating: "4.2",
      reviews: 85,
      distance: "1.5 km",
      description: `Ambiance conviviale et authentique.`,
      thumbnail: null,
      gps: { latitude: 6.370, longitude: 2.425 },
      website: null,
      hours: "07:00 - 23:00",
      type: type
    },
    {
      name: `${type} Premium`,
      address: `Fidjrossè, ${ville}`,
      phone: "+229 95 00 00 03",
      rating: "4.8",
      reviews: 256,
      distance: "2.1 km",
      description: `Service premium et cadre exceptionnel.`,
      thumbnail: null,
      gps: { latitude: 6.360, longitude: 2.410 },
      website: "https://example.com",
      hours: "10:00 - 00:00",
      type: type
    }
  ];

  return {
    success: true,
    demo: true,
    message: "Mode démonstration - Données simulées",
    query: `${type} ${ville}`,
    results: demoPlaces,
    total: demoPlaces.length,
    source: "Démonstration"
  };
}

// Route santé / config
app.get("/config", (req, res) => {
  const apiKey = config.API.SERPAPI_KEY;
  const isConfigured = apiKey && apiKey !== "demo_key" && apiKey.length > 20;
  
  res.json({
    app: config.APP,
    apiConfigured: isConfigured,
    port: config.PORT,
    mode: isConfigured ? "PRODUCTION" : "DEMO"
  });
});

// Route santé
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    version: config.APP.VERSION
  });
});

// ==========================================
// DÉMARRAGE
// ==========================================

app.listen(config.PORT, () => {
  const apiKey = config.API.SERPAPI_KEY;
  const isConfigured = apiKey && apiKey !== "demo_key" && apiKey.length > 20;
  
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   🌍 ${config.APP.NAME} v${config.APP.VERSION}      ║
  ║   👤 ${config.APP.AUTHOR}                    ║
  ╠═══════════════════════════════════════╣
  ║   🔌 Port: ${config.PORT}                    ║
  ║   🔑 API: ${isConfigured ? "✅ CONFIGURÉE" : "⚠️  DÉMO"}              ║
  ╚═══════════════════════════════════════╝
  `);
});
