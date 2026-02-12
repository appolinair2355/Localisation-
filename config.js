const config = {
  PORT: process.env.PORT || 10000,
  DB_FILE: "./db.json",
  UPLOAD_DIR: "./public/upload",
  
  API: {
    SERPAPI_KEY: process.env.SERPAPI_KEY || "d3d3456a79967181d142b402040806b4d9b47fff0fa0191939a6173f5bd7d526",
    DEFAULT_COUNTRY: "bj",
    DEFAULT_LANGUAGE: "fr",
    RESULTS_LIMIT: 10,
    BASE_URL: "https://serpapi.com/search",
    TIMEOUT: 15000
  },
  
  APP: {
    NAME: "Localisateur Bénin",
    VERSION: "3.1.0",
    AUTHOR: "Sossou Kouamé Appolinaire"
  },

  // Fuseau horaire Bénin (UTC+1)
  TIMEZONE: "Africa/Porto-Novo",

  // Messages drôles selon l'heure
  GREETINGS: {
    morning: [
      "Bonjour ! ☀️ Sossou Kouamé Appolinaire vous souhaite la bienvenue !",
      "Wooo ! Le soleil est levé et votre serviteur Sossou Kouamé aussi ! 🌅",
      "Bonjour ! J'espère que vous avez dormi mieux qu'un chat sur un toit ! 😸",
      "Salut ! Sossou Kouamé est réveillé (miracle) et prêt à vous aider ! ☕",
      "Bonjour ! Même le miel est jaloux de la douceur de cette matinée ! 🍯"
    ],
    afternoon: [
      "Bonjour ! 🌤️ Sossou Kouamé Appolinaire vous souhaite la bienvenue !",
      "Il fait chaud hein ? Pas autant que mes blagues ! 😎",
      "Bonjour ! Le soleil tape fort mais Sossou Kouamé tape plus fort ! 💪",
      "Salut ! Si vous cherchiez un endroit cool, vous êtes déjà sur le bon site ! ❄️",
      "Bonjour ! Même les poules cherchent de l'ombre, et vous cherchez un lieu ! 🐔"
    ],
    evening: [
      "Bonsoir ! 🌙 Sossou Kouamé Appolinaire vous souhaite la bienvenue !",
      "Bonsoir ! Le soleil se couche mais Sossou Kouamé ne dort jamais ! 🦉",
      "Bonsoir ! Si vous aviez faim, ce site ne vend pas du poulet mais trouve des restos ! 🍗",
      "Salut ! La nuit tombe mais vos recherches montent ! 🌟",
      "Bonsoir ! Même les chauves-souris sortent, et vous aussi apparemment ! 🦇"
    ],
    night: [
      "Bonsoir ! 🌃 Sossou Kouamé Appolinaire vous souhaite la bienvenue !",
      "Mais vous ne dormez jamais ?! Sossou Kouamé non plus apparemment ! 🌜",
      "Bonsoir ! Les hiboux hululent et vous cherchez des lieux... intéressant ! 🦉",
      "Salut ! Il fait nuit noire mais votre écran éclaire votre vie ! 💡",
      "Bonsoir ! Même les zombies dorment, mais pas vous ni Sossou Kouamé ! 🧟"
    ]
  }
};

// Fonction pour obtenir le message selon l'heure du Bénin
config.getGreeting = function() {
  const now = new Date();
  const beninHour = now.getUTCHours() + 1; // UTC+1 pour le Bénin
  
  let period;
  if (beninHour >= 5 && beninHour < 12) period = 'morning';
  else if (beninHour >= 12 && beninHour < 15) period = 'afternoon';
  else if (beninHour >= 15 && beninHour < 20) period = 'evening';
  else period = 'night';
  
  const messages = this.GREETINGS[period];
  return messages[Math.floor(Math.random() * messages.length)];
};

// Fonction pour obtenir l'heure du Bénin formatée
config.getBeninTime = function() {
  return new Date().toLocaleTimeString('fr-FJ', {
    timeZone: 'Africa/Porto-Novo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

module.exports = config;
      
