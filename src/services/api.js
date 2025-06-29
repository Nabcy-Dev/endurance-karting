import axios from 'axios';

// Détection automatique de l'URL de l'API
const getApiBaseUrl = () => {
  // En production, utiliser l'URL de production spécifique
  if (process.env.NODE_ENV === 'production') {
    // Utiliser l'URL de production configurée ou détecter automatiquement
    const productionUrl = process.env.REACT_APP_API_URL || 'https://endurance-karting.onrender.com/api';
    return productionUrl;
  }
  
  // En développement, utiliser l'URL configurée ou localhost
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 Configuration API:', {
  environment: process.env.NODE_ENV,
  apiUrl: API_BASE_URL,
  currentOrigin: window.location.origin,
  productionUrl: process.env.REACT_APP_API_URL
});

// Configuration axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Timeout de 10 secondes
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
      fullUrl: error.config?.baseURL + error.config?.url
    });
    
    // Améliorer les messages d'erreur
    if (error.code === 'ERR_NETWORK') {
      error.message = 'Erreur de connexion au serveur. Vérifiez que le serveur est démarré.';
    } else if (error.response?.status === 502) {
      error.message = 'Serveur temporairement indisponible. Veuillez réessayer dans quelques minutes.';
    } else if (error.response?.status === 403) {
      error.message = 'Erreur CORS: Accès non autorisé.';
    } else if (error.response?.status === 404) {
      error.message = 'Route API non trouvée. Vérifiez la configuration de l\'URL API.';
    }
    
    return Promise.reject(error);
  }
);

// Service pour les courses
export const raceService = {
  // Récupérer toutes les courses
  getAll: () => api.get('/races'),
  
  // Récupérer une course par ID
  getById: (id) => api.get(`/races/${id}`),
  
  // Créer une nouvelle course
  create: (raceData) => api.post('/races', raceData),
  
  // Mettre à jour une course
  update: (id, raceData) => api.put(`/races/${id}`, raceData),
  
  // Supprimer une course
  delete: (id) => api.delete(`/races/${id}`),
  
  // Démarrer une course
  start: (id) => api.post(`/races/${id}/start`),
  
  // Pauser une course
  pause: (id) => api.post(`/races/${id}/pause`),
  
  // Terminer une course
  finish: (id) => api.post(`/races/${id}/finish`),
  
  // Changer de pilote actuel
  changeDriver: (id, driverId) => api.post(`/races/${id}/change-driver`, { driverId }),
  
  // Récupérer les statistiques d'une course
  getStats: (id) => api.get(`/races/${id}/stats`),
};

// Service pour les pilotes
export const driverService = {
  // Récupérer tous les pilotes
  getAll: () => api.get('/drivers'),
  
  // Récupérer un pilote par ID
  getById: (id) => api.get(`/drivers/${id}`),
  
  // Créer un nouveau pilote
  create: (driverData) => api.post('/drivers', driverData),
  
  // Mettre à jour un pilote
  update: (id, driverData) => api.put(`/drivers/${id}`, driverData),
  
  // Supprimer un pilote
  delete: (id) => api.delete(`/drivers/${id}`),
  
  // Récupérer les statistiques d'un pilote
  getStats: (id) => api.get(`/drivers/${id}/stats`),
  
  // Réinitialiser les statistiques d'un pilote
  resetStats: (id) => api.post(`/drivers/${id}/reset-stats`),
  
  // Récupérer le classement des pilotes
  getLeaderboard: () => api.get('/drivers/leaderboard/overall'),
  
  // Récupérer les statistiques calculées des pilotes
  getCalculatedStats: () => api.get('/drivers/stats/calculated'),
};

// Service pour les relais
export const lapService = {
  // Récupérer tous les relais
  getAll: (params) => api.get('/laps', { params }),
  
  // Récupérer un relais par ID
  getById: (id) => api.get(`/laps/${id}`),
  
  // Créer un nouveau relais
  create: (lapData) => api.post('/laps', lapData),
  
  // Mettre à jour un relais
  update: (id, lapData) => api.put(`/laps/${id}`, lapData),
  
  // Supprimer un relais
  delete: (id) => api.delete(`/laps/${id}`),
  
  // Récupérer les relais d'une course
  getByRace: (raceId, params) => api.get(`/laps/race/${raceId}`, { params }),
  
  // Récupérer les relais d'un pilote
  getByDriver: (driverId, params) => api.get(`/laps/driver/${driverId}`, { params }),
  
  // Récupérer les meilleurs relais
  getBestOverall: (limit) => api.get('/laps/best/overall', { params: { limit } }),
  
  // Récupérer les meilleurs relais d'une course
  getBestByRace: (raceId, limit) => api.get(`/laps/best/race/${raceId}`, { params: { limit } }),
  
  // Enregistrer un relais avec validation
  record: (raceId, driverId, lapTime, notes) => 
    api.post('/laps/record', { raceId, driverId, lapTime, notes }),
};

// Service utilitaire
export const utilService = {
  // Test de connexion API
  testConnection: () => api.get('/test'),
};

export default api; 