const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration CORS améliorée
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Augmenter la limite de taille des requêtes pour les images base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Configuration MongoDB avec meilleure gestion des erreurs
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Erreur : Variable d'environnement MONGODB_URI non définie");
  console.log("💡 Solutions possibles :");
  console.log("   1. Créez un fichier .env à la racine du projet");
  console.log("   2. Ajoutez : MONGODB_URI=mongodb://localhost:27017/karting-endurance");
  console.log("   3. Ou utilisez MongoDB Atlas : MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/karting-endurance");
  console.log("   4. Redémarrez le serveur après avoir créé le fichier .env");
  process.exit(1);
}

// Connexion à MongoDB
console.log("🔗 Tentative de connexion à MongoDB...");
console.log(`📡 URI: ${MONGODB_URI.substring(0, 20)}...${MONGODB_URI.substring(MONGODB_URI.length - 20)}`);

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  })
  .then(() => {
    console.log("🟢 Connecté à MongoDB avec succès !");
    console.log(`📊 Base de données: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion MongoDB :");
    console.error(`   Type d'erreur: ${err.name}`);
    console.error(`   Message: ${err.message}`);
    
    if (err.name === 'MongoNetworkError') {
      console.log("💡 Solution : Vérifiez que MongoDB est démarré localement");
      console.log("   - Sur Windows : Démarrez le service MongoDB");
      console.log("   - Sur macOS/Linux : sudo systemctl start mongod");
    } else if (err.name === 'MongoServerSelectionError') {
      console.log("💡 Solution : Vérifiez l'URI de connexion MongoDB");
      console.log("   - Format local : mongodb://localhost:27017/karting-endurance");
      console.log("   - Format Atlas : mongodb+srv://user:password@cluster.mongodb.net/karting-endurance");
    } else if (err.message.includes('Authentication failed')) {
      console.log("💡 Solution : Vérifiez les identifiants MongoDB");
    }
    
    process.exit(1);
  });

// Middleware pour gérer les erreurs CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Routes
app.use('/api/races', require('./routes/races'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/laps', require('./routes/laps'));

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API Karting Endurance fonctionnelle!' });
});

// Route racine
app.get('/', (req, res) => {
  res.json({ message: 'Serveur Karting Endurance démarré' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`API disponible sur http://localhost:${PORT}/api`);
  console.log(`📁 Environnement: ${process.env.NODE_ENV || 'development'}`);
}); 