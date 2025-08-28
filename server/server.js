const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Autoriser toutes les origines en production pour Socket.IO
      if (!origin || origin.includes('.onrender.com') || origin.includes('localhost')) {
        return callback(null, true);
      }
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 5000;

// Configuration CORS améliorée pour Render et Socket.IO
app.use(cors({
  origin: function (incomingOrigin, callback) {
    // Autoriser les requêtes sans origine (comme les appels API directs)
    if (!incomingOrigin) {
      return callback(null, true);
    }
    
    // Autoriser localhost en développement
    if (incomingOrigin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Autoriser tous les domaines Render
    if (incomingOrigin.includes('.onrender.com')) {
      console.log('✅ Origine Render autorisée:', incomingOrigin);
      return callback(null, true);
    }
    
    // Autoriser les autres domaines en production
    if (process.env.NODE_ENV === 'production') {
      console.log('✅ Origine production autorisée:', incomingOrigin);
      return callback(null, true);
    }
    
    console.log('❌ Origin non autorisée:', incomingOrigin);
    callback(new Error('Origin non autorisée par CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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
      console.log("�� Solution : Vérifiez l'URI de connexion MongoDB");
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
  res.json({ 
    message: 'API Karting Endurance fonctionnelle!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({ 
    message: 'Serveur Karting Endurance démarré',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route pour servir les fichiers statiques React en production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  
  // Servir les fichiers statiques du build React
  app.use(express.static(path.join(__dirname, '../build')));
  
  // Route catch-all pour servir index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
  });
}

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  
  if (err.message === 'Origin non autorisée par CORS') {
    return res.status(403).json({ 
      message: 'Erreur CORS: Origine non autorisée',
      error: err.message 
    });
  }
  
  res.status(500).json({ 
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur serveur'
  });
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log(`🔌 Client connecté: ${socket.id} depuis ${socket.handshake.headers.origin || 'origine inconnue'}`);
  
  // Gérer les erreurs de connexion
  socket.on('error', (error) => {
    console.error(`❌ Erreur Socket.IO pour ${socket.id}:`, error);
  });
  
  // Gérer la déconnexion
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client déconnecté: ${socket.id}, raison: ${reason}`);
  });
  
  // Rejoindre la salle de course
  socket.on('join-race', (raceId) => {
    try {
      socket.join(`race-${raceId}`);
      console.log(`🏁 Client ${socket.id} a rejoint la course ${raceId}`);
      
      // Émettre l'état actuel de la course à tous les clients dans la salle
      socket.to(`race-${raceId}`).emit('user-joined-race', {
        raceId,
        userId: socket.id,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`❌ Erreur lors de la jointure de course:`, error);
    }
  });
  
  // Quitter la salle de course
  socket.on('leave-race', (raceId) => {
    try {
      socket.leave(`race-${raceId}`);
      console.log(`🚪 Client ${socket.id} a quitté la course ${raceId}`);
    } catch (error) {
      console.error(`❌ Erreur lors de la sortie de course:`, error);
    }
  });
  
  // Événements de course
  socket.on('race-started', (data) => {
    try {
      socket.to(`race-${data.raceId}`).emit('race-started', data);
      console.log(`🚀 Course démarrée: ${data.raceId}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'émission race-started:`, error);
    }
  });
  
  socket.on('race-finished', (data) => {
    try {
      socket.to(`race-${data.raceId}`).emit('race-finished', data);
      console.log(`🏁 Course terminée: ${data.raceId}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'émission race-finished:`, error);
    }
  });
  
  socket.on('race-reset', (data) => {
    try {
      socket.to(`race-${data.raceId}`).emit('race-reset', data);
      console.log(`🔄 Course réinitialisée: ${data.raceId}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'émission race-reset:`, error);
    }
  });
  
  // Événements de relais
  socket.on('stint-started', (data) => {
    try {
      socket.to(`race-${data.raceId}`).emit('stint-started', data);
      console.log(`▶️ Relais démarré: ${data.driverName} dans la course ${data.raceId}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'émission stint-started:`, error);
    }
  });
  
  socket.on('stint-ended', (data) => {
    try {
      socket.to(`race-${data.raceId}`).emit('stint-ended', data);
      console.log(`⏹️ Relais terminé: ${data.driverName} dans la course ${data.raceId}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'émission stint-ended:`, error);
    }
  });
  
  // Événements de pilotes
  socket.on('driver-changed', (data) => {
    try {
      socket.to(`race-${data.raceId}`).emit('driver-changed', data);
      console.log(`👤 Pilote changé: ${data.driverName} dans la course ${data.raceId}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'émission driver-changed:`, error);
    }
  });
  
  socket.on('driver-added', (data) => {
    try {
      socket.to(`race-${data.raceId}`).emit('driver-added', data);
      console.log(`➕ Pilote ajouté: ${data.driverName}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'émission driver-added:`, error);
    }
  });
  
  socket.on('driver-removed', (data) => {
    try {
      socket.to(`race-${data.raceId}`).emit('driver-removed', data);
      console.log(`➖ Pilote supprimé: ${data.driverId}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'émission driver-removed:`, error);
    }
  });
  
  // Événements de paramètres
  socket.on('race-settings-updated', (data) => {
    try {
      socket.to(`race-${data.raceId}`).emit('race-settings-updated', data);
      console.log(`⚙️ Paramètres mis à jour pour la course ${data.raceId}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'émission race-settings-updated:`, error);
    }
  });
  
  // Demander l'état actuel de la course
  socket.on('request-race-state', (raceId) => {
    try {
      socket.to(`race-${raceId}`).emit('race-state-requested', {
        raceId,
        requesterId: socket.id,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`❌ Erreur lors de l'émission request-race-state:`, error);
    }
  });
  
  // Émettre l'état actuel de la course
  socket.on('emit-race-state', (data) => {
    try {
      socket.to(`race-${data.raceId}`).emit('race-state-updated', data);
      console.log(`🔄 État de la course émis pour ${data.raceId}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'émission emit-race-state:`, error);
    }
  });
});

// Modifier la ligne d'écoute pour utiliser le serveur HTTP
server.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`API disponible sur http://localhost:${PORT}/api`);
  console.log(`📁 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.IO activé pour la collaboration en temps réel`);
  console.log(`🌐 CORS configuré pour la production`);
  console.log(`📡 Transports Socket.IO: websocket, polling`);
  console.log(`⏱️ Timeout: ${process.env.NODE_ENV === 'production' ? '60s' : '30s'}`);
}); 