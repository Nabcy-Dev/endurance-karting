# Karting Endurance - Système de gestion des relais

Application React pour la gestion des courses de karting endurance avec API MongoDB.

## 🚀 Installation et démarrage

### Prérequis
- Node.js (v14 ou supérieur)
- MongoDB (local ou cloud)
- npm ou yarn

### Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd karting-endurance
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration MongoDB**
   
   Créer un fichier `.env` à la racine du projet :
   ```env
   MONGODB_URI=mongodb://localhost:27017/karting-endurance
   PORT=5000
   NODE_ENV=development
   REACT_APP_API_URL=http://localhost:5000/api
   ```

   Pour MongoDB Atlas :
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/karting-endurance
   PORT=5000
   NODE_ENV=development
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. **Démarrer MongoDB**
   - Local : `mongod`
   - Ou utiliser MongoDB Atlas (cloud)

5. **Lancer l'application**
```bash
# Démarrage complet (frontend + backend)
npm run dev

# Ou séparément :
npm run server  # Backend uniquement
npm start       # Frontend uniquement
```

## 📁 Structure du projet

```
karting-endurance/
├── server/                 # Backend API
│   ├── models/            # Modèles MongoDB
│   │   ├── Race.js        # Modèle Course
│   │   ├── Driver.js      # Modèle Pilote
│   │   └── Lap.js         # Modèle Relais
│   ├── routes/            # Routes API
│   │   ├── races.js       # Routes courses
│   │   ├── drivers.js     # Routes pilotes
│   │   └── laps.js        # Routes relais
│   └── server.js          # Serveur Express
├── src/                   # Frontend React
│   ├── services/          # Services API
│   │   └── api.js         # Configuration API
│   ├── pages/             # Pages React
│   │   └── Home.jsx       # Page principale
│   └── ...
└── package.json
```

## 🔧 API Endpoints

### Courses (`/api/races`)
- `GET /` - Récupérer toutes les courses
- `GET /:id` - Récupérer une course par ID
- `POST /` - Créer une nouvelle course
- `PUT /:id` - Mettre à jour une course
- `DELETE /:id` - Supprimer une course
- `POST /:id/start` - Démarrer une course
- `POST /:id/pause` - Pauser une course
- `POST /:id/finish` - Terminer une course
- `POST /:id/change-driver` - Changer de pilote
- `GET /:id/stats` - Statistiques d'une course

### Pilotes (`/api/drivers`)
- `GET /` - Récupérer tous les pilotes
- `GET /:id` - Récupérer un pilote par ID
- `POST /` - Créer un nouveau pilote
- `PUT /:id` - Mettre à jour un pilote
- `DELETE /:id` - Supprimer un pilote
- `GET /:id/stats` - Statistiques d'un pilote
- `POST /:id/reset-stats` - Réinitialiser les stats
- `GET /leaderboard/overall` - Classement général

### Relais (`/api/laps`)
- `GET /` - Récupérer tous les relais
- `GET /:id` - Récupérer un relais par ID
- `POST /` - Créer un nouveau relais
- `PUT /:id` - Mettre à jour un relais
- `DELETE /:id` - Supprimer un relais
- `GET /race/:raceId` - Relais d'une course
- `GET /driver/:driverId` - Relais d'un pilote
- `GET /best/overall` - Meilleurs relais
- `GET /best/race/:raceId` - Meilleurs relais par course
- `POST /record` - Enregistrer un relais avec validation

## 🗄️ Modèles de données

### Course
```javascript
{
  name: String,
  startTime: Date,
  endTime: Date,
  duration: Number, // minutes
  status: String, // 'pending', 'running', 'paused', 'finished'
  settings: {
    minStintTime: Number,
    maxStintTime: Number,
    targetLaps: Number
  },
  totalLaps: Number,
  totalTime: Number, // millisecondes
  currentDriver: ObjectId,
  currentStintStart: Date
}
```

### Pilote
```javascript
{
  name: String,
  color: String,
  totalTime: Number, // millisecondes
  laps: Number,
  bestLap: Number, // millisecondes
  averageLap: Number, // millisecondes
  isActive: Boolean
}
```

### Relais
```javascript
{
  race: ObjectId,
  driver: ObjectId,
  driverName: String,
  lapNumber: Number,
  lapTime: Number, // millisecondes
  totalTime: Number, // millisecondes
  stintStartTime: Date,
  stintEndTime: Date,
  isBestLap: Boolean,
  notes: String
}
```

## 🚀 Scripts disponibles

- `npm start` - Démarrer le frontend React
- `npm run server` - Démarrer le serveur backend
- `npm run dev` - Démarrer frontend + backend simultanément
- `npm run build` - Build de production
- `npm test` - Lancer les tests

## 🔒 Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|---------|
| `MONGODB_URI` | URI de connexion MongoDB | `mongodb://localhost:27017/karting-endurance` |
| `PORT` | Port du serveur backend | `5000` |
| `NODE_ENV` | Environnement | `development` |
| `REACT_APP_API_URL` | URL de l'API frontend | `http://localhost:5000/api` |

## 📊 Fonctionnalités

- ✅ Gestion des courses en temps réel
- ✅ Chronométrage précis des relais
- ✅ Gestion des pilotes et équipes
- ✅ Statistiques détaillées
- ✅ Graphiques de performance
- ✅ API REST complète
- ✅ Base de données MongoDB
- ✅ Interface responsive
- ✅ Persistance des données
- ✅ Gestion d'erreurs
- ✅ États de chargement

## 🛠️ Technologies utilisées

- **Frontend** : React, Tailwind CSS, Recharts, Axios
- **Backend** : Node.js, Express, MongoDB, Mongoose
- **API** : REST API avec validation
- **Base de données** : MongoDB avec indexation optimisée

## 🔧 Configuration rapide

1. **Créer le fichier `.env`** :
```bash
echo "MONGODB_URI=mongodb://localhost:27017/karting-endurance
PORT=5000
NODE_ENV=development
REACT_APP_API_URL=http://localhost:5000/api" > .env
```

2. **Démarrer MongoDB** :
```bash
mongod
```

3. **Lancer l'application** :
```bash
npm run dev
```

4. **Accéder à l'application** :
- Frontend : http://localhost:3000
- API : http://localhost:5000/api

## 🐛 Dépannage

### Erreur de connexion MongoDB
- Vérifiez que MongoDB est démarré
- Vérifiez l'URI dans le fichier `.env`
- Testez la connexion : `mongo mongodb://localhost:27017/karting-endurance`

### Erreur de connexion API
- Vérifiez que le serveur backend est démarré sur le port 5000
- Vérifiez la variable `REACT_APP_API_URL` dans `.env`
- Testez l'API : `curl http://localhost:5000/api/test`

### Erreur de build
- Supprimez `node_modules` et `package-lock.json`
- Relancez `npm install`
- Relancez `npm run dev`
