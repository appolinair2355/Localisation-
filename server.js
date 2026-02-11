const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 10000;

app.use(express.json());
app.use(express.static("public"));

const DB_FILE = "./db.json";

// Lire base JSON
function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE));
}

// Enregistrer utilisateur
app.post("/register", (req, res) => {
  const db = readDB();
  db.users.push(req.body);
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

  res.json({
    message: "Bienvenue 😄 Sossou Kouamé est heureux de vous compter parmi ses abonnés."
  });
});

// Recherche (simulation API)
app.post("/search", (req, res) => {

  const { type, ville, quartier } = req.body;

  res.json({
    name: `${type} Premium`,
    address: `${quartier}, ${ville}`,
    description: "Un excellent lieu très apprécié des visiteurs.",
    distance: "1.2 km"
  });

});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur port ${PORT}`);
});
