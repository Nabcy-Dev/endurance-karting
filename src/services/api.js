import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configuration axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
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