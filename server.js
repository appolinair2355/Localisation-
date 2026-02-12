const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const config = require("./config");

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static("public"));

if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(config.DB_FILE));
  } catch (error) {
    return { users: [], places: [], adminLogs: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(config.DB_FILE, JSON.stringify(data, null, 2));
}

const BENIN_LOCATIONS = {
  "Littoral": {
    "Cotonou": ["Cadjehoun", "Akpakpa", "Fidjrossè", "Ganhi", "Haie Vive", "Jéricho", "Missebo", "Sainte Rita", "Tokpa", "Zongo", "Agla", "Béthanie", "Dantokpa", "Enagnon", "Gbéto", "Houéyiho", "Kouhounou", "Midombô", "Sodjatome", "Vèdoko"],
    "Sèmè-Podji": ["Sèmè", "Podji", "Adjarra", "Aguégué", "Avrankou", "Akpro-Missérété"]
  },
  "Atlantique": {
    "Abomey-Calavi": ["Calavi", "Godomey", "Togoudo", "Hêvié", "Kpota", "Dekoungbé", "Togba", "Zinvié", "Hlanzounmè", "Dédomè", "Akassato", "Ouedo", "Togbin", "Dagbé", "Golo-Djigbé"],
    "Allada": ["Allada", "Attogon", "Avakpa", "Ayou", "Hinvi", "Lissègazoun", "Lon-Agonmey", "Sékou", "Togba-Domè", "Tokpa"],
    "Kpomassè": ["Kpomassè", "Amougui", "Avamè", "Azohoué-Aliho", "Azohoué-Cada", "Kpomassè-Centre", "Sèhoun", "Sohoué"],
    "Ouidah": ["Ouidah", "Avlékété", "Dékanmey", "Gakpè", "Houakpè-Daho", "Pahou", "Savi", "Tchaada"],
    "Sô-Ava": ["Sô-Ava", "Ahomey-Lokpo", "Dékanmey", "Ganvié", "Houédomè", "Sô-Tchanhoué"],
    "Toffo": ["Toffo", "Agué", "Dame", "Djanglanmey", "Houéyogbé", "Kpozoun", "Sèhoué", "Toffo-Centre"],
    "Tori-Bossito": ["Tori-Bossito", "Avamè", "Dékanmey", "Gbaffo", "Tori-Cada", "Tori-Gare"],
    "Zè": ["Zè", "Adohoun", "Colli-Agbamè", "Dawé", "Hounli", "Sékou", "Zè-Centre"]
  },
  "Ouémé": {
    "Porto-Novo": ["Adjara", "Agbodjèdo", "Agontan", "Ahossougbéta", "Ahouannonzoun", "Akébou", "Avrankou", "Ayéta", "Djidja", "Ganhi", "Houinvigue", "Missérété", "Sèmè", "Tchada", "Toffa"],
    "Adjarra": ["Adjarra", "Agué", "Avrankou", "Dékanmey", "Gangban", "Houédomè", "Kpoguidi", "Sèmè-Kpodji"],
    "Avrankou": ["Avrankou", "Atchoukpa", "Dékanmey", "Gbagoudo", "Houédomè", "Kpota", "Sèkou"],
    "Bonou": ["Bonou", "Agué", "Dékanmey", "Houédomè", "Sèmè"],
    "Dangbo": ["Dangbo", "Houédomè", "Kpozoun", "Sèmè"],
    "Sèmè-Podji": ["Sèmè", "Podji", "Adjarra", "Aguégué"]
  },
  "Mono": {
    "Lokossa": ["Lokossa", "Adjarra", "Agbodjèdo", "Bopa", "Comè", "Grand-Popo", "Houéyogbé", "Kpémé"],
    "Athiémé": ["Athiémé", "Adjarra", "Agbodjèdo", "Bopa", "Comè"],
    "Bopa": ["Bopa", "Agbodjèdo", "Comè", "Grand-Popo", "Houéyogbé"],
    "Comè": ["Comè", "Agbodjèdo", "Bopa", "Grand-Popo", "Houéyogbé"],
    "Grand-Popo": ["Grand-Popo", "Agbodjèdo", "Bopa", "Comè", "Houéyogbé"],
    "Houéyogbé": ["Houéyogbé", "Agbodjèdo", "Bopa", "Comè", "Grand-Popo"]
  },
  "Zou": {
    "Abomey": ["Abomey", "Agongointo", "Bohicon", "Covè", "Djidja", "Ouinhi", "Zagnanado", "Zogbodomey"],
    "Bohicon": ["Bohicon", "Abomey", "Covè", "Djidja", "Ouinhi", "Zagnanado", "Zogbodomey", "Adogbé", "Agongointo", "Sèhoun", "Tohoué", "Zakpota"],
    "Covè": ["Covè", "Abomey", "Bohicon", "Djidja", "Ouinhi", "Zagnanado"],
    "Djidja": ["Djidja", "Abomey", "Bohicon", "Covè", "Ouinhi", "Zagnanado", "Zogbodomey"],
    "Ouinhi": ["Ouinhi", "Abomey", "Bohicon", "Covè", "Djidja", "Zagnanado"],
    "Zagnanado": ["Zagnanado", "Abomey", "Bohicon", "Covè", "Djidja", "Ouinhi"],
    "Zogbodomey": ["Zogbodomey", "Abomey", "Bohicon", "Djidja", "Ouinhi", "Zagnanado"]
  },
  "Collines": {
    "Savalou": ["Savalou", "Bantè", "Dassa-Zoumè", "Glazoué", "Ouèssè", "Sakété"],
    "Bantè": ["Bantè", "Savalou", "Dassa-Zoumè", "Glazoué"],
    "Dassa-Zoumè": ["Dassa-Zoumè", "Savalou", "Bantè", "Glazoué", "Ouèssè"],
    "Glazoué": ["Glazoué", "Savalou", "Bantè", "Dassa-Zoumè", "Ouèssè"],
    "Ouèssè": ["Ouèssè", "Savalou", "Dassa-Zoumè", "Glazoué"],
    "Sakété": ["Sakété", "Savalou", "Pobè", "Kétou"]
  },
  "Borgou": {
    "Parakou": ["Parakou-Centre", "Alaga", "Awolowo", "Baka", "Banikanni", "Boré", "Ganou", "Gbérédou-Baran", "Guema", "Kobourou", "Konkoli", "Péonga", "Sakérou", "Titirou", "Wansirou", "Wori", "Yanka", "Zongo"],
    "Bembéréké": ["Bembéréké", "Bassila", "Goumori", "Kalalé", "N'Dali", "Nikki", "Ségbana", "Tchaourou"],
    "Kalalé": ["Kalalé", "Bembéréké", "Goumori", "N'Dali", "Nikki"],
    "N'Dali": ["N'Dali", "Bembéréké", "Kalalé", "Nikki", "Parakou"],
    "Nikki": ["Nikki", "Bembéréké", "Kalalé", "N'Dali", "Ségbana"],
    "Ségbana": ["Ségbana", "Bembéréké", "Kalalé", "Nikki"],
    "Tchaourou": ["Tchaourou", "Bembéréké", "Savalou", "Parakou"]
  },
  "Alibori": {
    "Kandi": ["Kandi", "Banikoara", "Gogounou", "Karimama", "Malanville", "Ségbana"],
    "Banikoara": ["Banikoara", "Kandi", "Gogounou", "Karimama"],
    "Gogounou": ["Gogounou", "Kandi", "Banikoara", "Karimama"],
    "Karimama": ["Karimama", "Kandi", "Banikoara", "Gogounou"],
    "Malanville": ["Malanville", "Kandi", "Karimama"]
  },
  "Atacora": {
    "Natitingou": ["Natitingou", "Boukoumbé", "Cobly", "Kérou", "Kouandé", "Matéri", "Pehonko", "Tanguiéta", "Toucountouna"],
    "Boukoumbé": ["Boukoumbé", "Natitingou", "Cobly", "Kérou", "Matéri"],
    "Cobly": ["Cobly", "Natitingou", "Boukoumbé", "Kérou", "Matéri"],
    "Kérou": ["Kérou", "Natitingou", "Boukoumbé", "Cobly", "Matéri"],
    "Kouandé": ["Kouandé", "Natitingou", "Matéri", "Pehonko", "Tanguiéta"],
    "Matéri": ["Matéri", "Natitingou", "Boukoumbé", "Cobly", "Kérou", "Kouandé"],
    "Pehonko": ["Pehonko", "Natitingou", "Kouandé", "Tanguiéta"],
    "Tanguiéta": ["Tanguiéta", "Natitingou", "Kouandé", "Matéri", "Pehonko", "Toucountouna"],
    "Toucountouna": ["Toucountouna", "Natitingou", "Kouandé", "Tanguiéta"]
  },
  "Donga": {
    "Djougou": ["Djougou", "Aplahoué", "Copargo", "Ouaké"],
    "Aplahoué": ["Aplahoué", "Djougou", "Copargo", "Ouaké"],
    "Copargo": ["Copargo", "Djougou", "Aplahoué", "Ouaké"],
    "Ouaké": ["Ouaké", "Djougou", "Aplahoué", "Copargo"]
  },
  "Plateau": {
    "Pobè": ["Pobè", "Adja-Ouèrè", "Ifangni", "Kétou", "Sakété"],
    "Adja-Ouèrè": ["Adja-Ouèrè", "Pobè", "Ifangni", "Kétou"],
    "Ifangni": ["Ifangni", "Pobè", "Adja-Ouèrè", "Kétou"],
    "Kétou": ["Kétou", "Pobè", "Adja-Ouèrè", "Ifangni", "Sakété"],
    "Sakété": ["Sakété", "Pobè", "Kétou"]
  }
};

app.get("/api/benin/departements", (req, res) => {
  res.json({
    success: true,
    departements: Object.keys(BENIN_LOCATIONS),
    heure_benin: config.getBeninTime(),
    message: config.getGreeting()
  });
});

app.get("/api/benin/communes/:departement", (req, res) => {
  const dept = req.params.departement;
  const communes = BENIN_LOCATIONS[dept];
  
  if (!communes) {
    return res.status(404).json({ success: false, error: "Département non trouvé" });
  }
  
  res.json({
    success: true,
    departement: dept,
    communes: Object.keys(communes),
    nombre: Object.keys(communes).length
  });
});

app.get("/api/benin/quartiers/:departement/:commune", (req, res) => {
  const { departement, commune } = req.params;
  const quartiers = BENIN_LOCATIONS[departement]?.[commune];
  
  if (!quartiers) {
    return res.status(404).json({ success: false, error: "Commune non trouvée" });
  }
  
  res.json({
    success: true,
    departement,
    commune,
    quartiers,
    nombre: quartiers.length
  });
});

app.get("/api/benin/all-locations", (req, res) => {
  const villes = [];
  const quartiersParVille = {};
  
  Object.entries(BENIN_LOCATIONS).forEach(([dept, communes]) => {
    Object.entries(communes).forEach(([commune, quartiers]) => {
      villes.push(commune);
      quartiersParVille[commune] = quartiers;
    });
  });
  
  res.json({
    success: true,
    villes: villes.sort(),
    quartiersParVille,
    totalVilles: villes.length,
    heure_benin: config.getBeninTime(),
    message: config.getGreeting()
  });
});

app.get("/api/categories", (req, res) => {
  res.json({
    success: true,
    categories: config.COMMERCE_CATEGORIES
  });
});

function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ success: false, error: "Authentification requise" });
  }
  
  const db = readDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ success: false, error: "Session invalide" });
  }
  
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  const userId = req.headers['x-user-id'];
  const db = readDB();
  const user = db.users.find(u => u.id === userId);
  
  if (!user || !user.isAdmin) {
    return res.status(403).json({ success: false, error: "Accès réservé aux administrateurs" });
  }
  
  req.user = user;
  next();
}

app.post("/register", (req, res) => {
  try {
    const { nom, prenom, email, password, photo } = req.body;
    
    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Tous les champs sont requis" 
      });
    }

    const db = readDB();
    
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({
        success: false,
        error: "Cet email est déjà utilisé"
      });
    }

    const isAdmin = config.isAdmin(nom, prenom, email);
    
    let photoPath = null;
    if (photo && photo.startsWith('data:image')) {
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
      const filename = `user_${Date.now()}.png`;
      photoPath = `/upload/${filename}`;
      fs.writeFileSync(path.join(config.UPLOAD_DIR, filename), base64Data, 'base64');
    }

    const user = {
      id: Date.now().toString(),
      nom,
      prenom,
      email,
      password,
      photo: photoPath,
      isAdmin: isAdmin,
      role: isAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString()
    };
    
    db.users.push(user);
    writeDB(db);

    let message = config.getGreeting();
    if (isAdmin) {
      message = `🎉 Bienvenue Kouamé Appolinaire ! Développeur web de ce site, vous êtes maintenant connecté en tant qu'Administrateur Suprême ! 👑`;
    }

    res.json({
      success: true,
      message: message,
      isAdmin: isAdmin,
      user: { 
        id: user.id, 
        nom: user.nom, 
        prenom: user.prenom, 
        email: user.email,
        photo: user.photo,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error("Erreur register:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

app.post("/login", (req, res) => {
  try {
    const { email, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Email ou mot de passe incorrect"
      });
    }

    let message = config.getGreeting();
    if (user.isAdmin) {
      message = `👑 Bienvenue Kouamé Appolinaire ! Votre royaume vous attend, Chef !`;
    }

    res.json({
      success: true,
      message: message,
      isAdmin: user.isAdmin,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        photo: user.photo,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

app.get("/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    heure_benin: config.getBeninTime(),
    message: config.getGreeting()
  });
});

// ============ GESTION DES LIEUX/COMMERCES ============

// Ajouter un nouveau lieu/commerce
app.post("/places", requireAuth, (req, res) => {
  try {
    const {
      nom,
      categorie,
      description,
      ville,
      quartier,
      adresseDetail,
      telephone,
      whatsapp,
      email,
      website,
      facebook,
      instagram,
      horaires,
      livraison,
      paiementMobile,
      photo
    } = req.body;

    if (!nom || !categorie || !ville || !telephone) {
      return res.status(400).json({
        success: false,
        error: "Nom, catégorie, ville et téléphone sont obligatoires"
      });
    }

    const db = readDB();

    // Sauvegarder la photo du lieu
    let photoPath = null;
    if (photo && photo.startsWith('data:image')) {
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
      const filename = `place_${Date.now()}.png`;
      photoPath = `/upload/${filename}`;
      fs.writeFileSync(path.join(config.UPLOAD_DIR, filename), base64Data, 'base64');
    }

    const place = {
      id: Date.now().toString(),
      nom,
      categorie,
      description: description || "",
      ville,
      quartier: quartier || "",
      adresseDetail: adresseDetail || "",
      telephone,
      whatsapp: whatsapp || "",
      email: email || "",
      website: website || "",
      facebook: facebook || "",
      instagram: instagram || "",
      horaires: horaires || "",
      livraison: livraison || false,
      paiementMobile: paiementMobile || [],
      photo: photoPath,
      proprietaire: {
        id: req.user.id,
        nom: req.user.nom,
        prenom: req.user.prenom
      },
      createdAt: new Date().toISOString(),
      verified: false,
      views: 0,
      rating: 0,
      reviews: []
    };

    db.places.push(place);
    writeDB(db);

    res.json({
      success: true,
      message: "Lieu ajouté avec succès ! Il sera visible par tous les utilisateurs.",
      place: {
        id: place.id,
        nom: place.nom,
        categorie: place.categorie,
        ville: place.ville
      }
    });
  } catch (error) {
    console.error("Erreur ajout lieu:", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

// Récupérer tous les lieux (avec filtres)
app.get("/places", (req, res) => {
  const db = readDB();
  let places = db.places || [];

  // Filtres
  const { categorie, ville, quartier, search } = req.query;

  if (categorie) {
    places = places.filter(p => p.categorie.toLowerCase().includes(categorie.toLowerCase()));
  }
  if (ville) {
    places = places.filter(p => p.ville.toLowerCase() === ville.toLowerCase());
  }
  if (quartier) {
    places = places.filter(p => p.quartier && p.quartier.toLowerCase().includes(quartier.toLowerCase()));
  }
  if (search) {
    const searchLower = search.toLowerCase();
    places = places.filter(p => 
      p.nom.toLowerCase().includes(searchLower) ||
      p.categorie.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.ville.toLowerCase().includes(searchLower)
    );
  }

  // Trier par date d'ajout (plus récent d'abord)
  places.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    total: places.length,
    places: places.map(p => ({
      id: p.id,
      nom: p.nom,
      categorie: p.categorie,
      description: p.description,
      ville: p.ville,
      quartier: p.quartier,
      adresseDetail: p.adresseDetail,
      telephone: p.telephone,
      whatsapp: p.whatsapp,
      email: p.email,
      website: p.website,
      facebook: p.facebook,
      instagram: p.instagram,
      horaires: p.horaires,
      livraison: p.livraison,
      paiementMobile: p.paiementMobile,
      photo: p.photo,
      proprietaire: p.proprietaire,
      createdAt: p.createdAt,
      verified: p.verified
    }))
  });
});

// Récupérer les lieux de l'utilisateur connecté
app.get("/my-places", requireAuth, (req, res) => {
  const db = readDB();
  const places = (db.places || []).filter(p => p.proprietaire.id === req.user.id);
  
  res.json({
    success: true,
    total: places.length,
    places
  });
});

// Supprimer un lieu (propriétaire ou admin)
app.delete("/places/:id", requireAuth, (req, res) => {
  const placeId = req.params.id;
  const db = readDB();
  
  const placeIndex = db.places.findIndex(p => p.id === placeId);
  if (placeIndex === -1) {
    return res.status(404).json({ success: false, error: "Lieu non trouvé" });
  }

  const place = db.places[placeIndex];
  
  // Vérifier permissions (propriétaire ou admin)
  if (place.proprietaire.id !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ success: false, error: "Vous ne pouvez pas supprimer ce lieu" });
  }

  // Supprimer la photo si existe
  if (place.photo) {
    const photoPath = path.join(config.UPLOAD_DIR, path.basename(place.photo));
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }
  }

  db.places.splice(placeIndex, 1);
  writeDB(db);

  res.json({
    success: true,
    message: "Lieu supprimé avec succès"
  });
});

// ============ ADMIN ROUTES ============

app.get("/admin/dashboard", requireAdmin, (req, res) => {
  const db = readDB();
  
  const stats = {
    totalUsers: db.users.length,
    totalAdmins: db.users.filter(u => u.isAdmin).length,
    totalPlaces: (db.places || []).length,
    recentUsers: db.users
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(u => ({
        id: u.id,
        nom: u.nom,
        prenom: u.prenom,
        email: u.email,
        photo: u.photo,
        createdAt: u.createdAt
      })),
    recentPlaces: (db.places || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        nom: p.nom,
        categorie: p.categorie,
        ville: p.ville,
        proprietaire: p.proprietaire,
        createdAt: p.createdAt
      }))
  };
  
  res.json({
    success: true,
    stats,
    heure_benin: config.getBeninTime()
  });
});

app.get("/admin/users", requireAdmin, (req, res) => {
  const db = readDB();
  
  const users = db.users.map(u => ({
    id: u.id,
    nom: u.nom,
    prenom: u.prenom,
    email: u.email,
    photo: u.photo,
    isAdmin: u.isAdmin,
    createdAt: u.createdAt
  }));
  
  res.json({
    success: true,
    total: users.length,
    users: users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  });
});

app.delete("/admin/users/:id", requireAdmin, (req, res) => {
  const userId = req.params.id;
  const db = readDB();
  
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, error: "Utilisateur non trouvé" });
  }
  
  if (db.users[userIndex].id === req.user.id) {
    return res.status(400).json({ success: false, error: "Vous ne pouvez pas supprimer votre propre compte" });
  }

  // Supprimer les lieux de cet utilisateur
  db.places = (db.places || []).filter(p => p.proprietaire.id !== userId);

  db.users.splice(userIndex, 1);
  writeDB(db);
  
  res.json({
    success: true,
    message: "Utilisateur et ses lieux supprimés avec succès"
  });
});

// Vérifier un lieu (admin)
app.put("/admin/places/:id/verify", requireAdmin, (req, res) => {
  const placeId = req.params.id;
  const db = readDB();
  
  const place = db.places.find(p => p.id === placeId);
  if (!place) {
    return res.status(404).json({ success: false, error: "Lieu non trouvé" });
  }

  place.verified = true;
  writeDB(db);

  res.json({
    success: true,
    message: "Lieu vérifié avec succès"
  });
});

// ============ RECHERCHE SERPAPI ============

app.post("/search", requireAuth, async (req, res) => {
  const { type, ville, quartier } = req.body;
  
  if (!type || !ville) {
    return res.status(400).json({ 
      success: false, 
      error: "Type et ville sont requis" 
    });
  }

  try {
    // Chercher d'abord dans la base locale
    const db = readDB();
    const localPlaces = (db.places || []).filter(p => {
      const matchType = p.categorie.toLowerCase().includes(type.toLowerCase()) || 
                       p.nom.toLowerCase().includes(type.toLowerCase());
      const matchVille = p.ville.toLowerCase() === ville.toLowerCase();
      const matchQuartier = !quartier || (p.quartier && p.quartier.toLowerCase().includes(quartier.toLowerCase()));
      return matchType && matchVille && matchQuartier;
    });

    const searchQuery = `${type} ${quartier ? quartier + ' ' : ''}${ville} Bénin`;
    const apiKey = config.API.SERPAPI_KEY;
    const isDemo = !apiKey || apiKey === "demo_key" || apiKey.length < 20;

    if (isDemo) {
      // Combiner résultats locaux + démo
      const demoResults = generateDemoData(type, ville, quartier).results;
      const combinedResults = [...localPlaces, ...demoResults];
      
      return res.json({
        success: true,
        demo: true,
        query: searchQuery,
        results: combinedResults,
        total: combinedResults.length,
        localCount: localPlaces.length,
        heure_benin: config.getBeninTime()
      });
    }

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

    let apiResults = [];
    if (response.data.local_results) {
      apiResults = Array.isArray(response.data.local_results) 
        ? response.data.local_results 
        : [response.data.local_results];
    } else if (response.data.place_results) {
      apiResults = [response.data.place_results];
    }

    const formattedApiResults = apiResults.map(place => ({
      id: place.place_id || Date.now().toString(),
      nom: place.title || place.name || "Nom inconnu",
      categorie: type,
      description: place.description || `${type} situé à ${ville}`,
      ville: ville,
      quartier: quartier || "",
      adresseDetail: place.address || "",
      telephone: place.phone || "Non disponible",
      whatsapp: "",
      email: "",
      website: place.website || place.link || "",
      facebook: "",
      instagram: "",
      horaires: formatHours(place.hours),
      livraison: false,
      paiementMobile: [],
      photo: place.thumbnail || place.image || null,
      gps: place.gps_coordinates || null,
      rating: place.rating ? place.rating.toString() : "N/A",
      reviews: place.reviews || 0,
      distance: place.distance || "À proximité",
      source: "google_maps",
      proprietaire: { nom: "Inconnu", prenom: "" }
    }));

    // Combiner résultats locaux + API
    const allResults = [...localPlaces, ...formattedApiResults];

    res.json({
      success: true,
      demo: false,
      query: searchQuery,
      results: allResults,
      total: allResults.length,
      localCount: localPlaces.length,
      apiCount: formattedApiResults.length,
      heure_benin: config.getBeninTime()
    });

  } catch (error) {
    console.error("Erreur SerpAPI:", error.message);
    // Fallback sur résultats locaux + démo
    const db = readDB();
    const localPlaces = (db.places || []).filter(p => {
      const matchType = p.categorie.toLowerCase().includes(type.toLowerCase()) || 
                       p.nom.toLowerCase().includes(type.toLowerCase());
      const matchVille = p.ville.toLowerCase() === ville.toLowerCase();
      return matchType && matchVille;
    });
    
    const demoResults = generateDemoData(type, ville, quartier).results;
    const combinedResults = [...localPlaces, ...demoResults];
    
    res.json({
      success: true,
      demo: true,
      query: `${type} ${ville}`,
      results: combinedResults,
      total: combinedResults.length,
      localCount: localPlaces.length,
      heure_benin: config.getBeninTime()
    });
  }
});

function formatHours(hours) {
  if (typeof hours === 'string') return hours;
  if (hours?.open_state) return hours.open_state;
  if (hours?.schedule) {
    const today = new Date().getDay();
    const todayHours = hours.schedule.find(h => h.day === today);
    return todayHours ? todayHours.time : "Horaires disponibles";
  }
  return "Horaires non disponibles";
}

function generateDemoData(type, ville, quartier) {
  const demoPlaces = [
    {
      id: "demo_1",
      nom: `${type} Le Gourmet`,
      categorie: type,
      description: `Excellent ${type.toLowerCase()} très apprécié des locaux.`,
      ville: ville,
      quartier: quartier || "Centre-ville",
      adresseDetail: quartier ? `${quartier}, ${ville}` : `Centre-ville, ${ville}`,
      telephone: "+229 97 00 00 01",
      whatsapp: "+229 97 00 00 01",
      email: "",
      website: "",
      facebook: "",
      instagram: "",
      horaires: "08:00 - 22:00",
      livraison: true,
      paiementMobile: ["MTN MoMo", "Moov Money"],
      photo: null,
      gps: { latitude: 6.365, longitude: 2.418 },
      rating: "4.5",
      reviews: 128,
      distance: "0.8 km",
      source: "demo",
      proprietaire: { nom: "Démonstration", prenom: "" }
    },
    {
      id: "demo_2",
      nom: `${type} Chez Mama`,
      categorie: type,
      description: `Ambiance conviviale et authentique.`,
      ville: ville,
      quartier: "Quartier résidentiel",
      adresseDetail: `Quartier résidentiel, ${ville}`,
      telephone: "+229 96 00 00 02",
      whatsapp: "",
      email: "mama@example.com",
      website: "",
      facebook: "facebook.com/chezmama",
      instagram: "",
      horaires: "07:00 - 23:00",
      livraison: false,
      paiementMobile: ["MTN MoMo"],
      photo: null,
      gps: { latitude: 6.370, longitude: 2.425 },
      rating: "4.2",
      reviews: 85,
      distance: "1.5 km",
      source: "demo",
      proprietaire: { nom: "Démonstration", prenom: "" }
    },
    {
      id: "demo_3",
      nom: `${type} Premium`,
      categorie: type,
      description: `Service premium et cadre exceptionnel.`,
      ville: ville,
      quartier: "Zone commerciale",
      adresseDetail: `Zone commerciale, ${ville}`,
      telephone: "+229 95 00 00 03",
      whatsapp: "+229 95 00 00 03",
      email: "",
      website: "https://example.com",
      facebook: "",
      instagram: "@premium_benin",
      horaires: "10:00 - 00:00",
      livraison: true,
      paiementMobile: ["MTN MoMo", "Moov Money", "Carte bancaire"],
      photo: null,
      gps: { latitude: 6.360, longitude: 2.410 },
      rating: "4.8",
      reviews: 256,
      distance: "2.1 km",
      source: "demo",
      proprietaire: { nom: "Démonstration", prenom: "" }
    }
  ];

  return {
    success: true,
    demo: true,
    message: "Mode démonstration - Données simulées",
    query: `${type} ${ville}`,
    results: demoPlaces,
    total: demoPlaces.length
  };
}

app.get("/config", (req, res) => {
  res.json({
    app: config.APP,
    heure_benin: config.getBeninTime(),
    message: config.getGreeting()
  });
});

app.listen(config.PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║   🌍 ${config.APP.NAME} v${config.APP.VERSION}           ║
  ║   👤 ${config.APP.AUTHOR}         ║
  ║   🔌 Port: ${config.PORT}                               ║
  ║   🕐 Heure Bénin: ${config.getBeninTime()}                    ║
  ║   👑 Admin: Sossou Kouamé configuré              ║
  ║   🏪 Gestion des commerces: ACTIVE              ║
  ╚══════════════════════════════════════════════════╝
  `);
});
