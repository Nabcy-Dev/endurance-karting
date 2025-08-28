import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentRaceId = null;
    this.eventListeners = new Map();
  }

  // Se connecter au serveur Socket.IO
  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    // Détecter l'URL du serveur
    const serverUrl = process.env.NODE_ENV === 'production' 
      ? (process.env.REACT_APP_API_URL || 'https://endurance-karting.onrender.com')
      : 'http://localhost:5000';

    // Retirer /api de l'URL pour Socket.IO
    const socketUrl = serverUrl.replace('/api', '');

    console.log('🔌 Connexion Socket.IO à:', socketUrl);

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: process.env.NODE_ENV === 'production' ? 30000 : 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 10,
      forceNew: true,
      autoConnect: true,
      upgrade: true,
      rememberUpgrade: true,
      secure: process.env.NODE_ENV === 'production',
      rejectUnauthorized: false
    });

    this.setupEventListeners();
  }

  // Configurer les écouteurs d'événements de base
  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('🔌 Connecté au serveur Socket.IO');
      this.isConnected = true;
      this.emit('client-connected', { timestamp: Date.now() });
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Déconnecté du serveur Socket.IO');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion Socket.IO:', error);
      console.error('   - Type:', error.type);
      console.error('   - Message:', error.message);
      console.error('   - Description:', error.description);
      this.isConnected = false;
      
      // En production, essayer de se reconnecter avec polling
      if (process.env.NODE_ENV === 'production' && this.socket.io.opts.transports.includes('websocket')) {
        console.log('🔄 Tentative de reconnexion avec polling uniquement...');
        this.socket.io.opts.transports = ['polling'];
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnexion Socket.IO réussie (tentative ${attemptNumber})`);
      this.isConnected = true;
      
      // Rejoindre la course actuelle si elle existe
      if (this.currentRaceId) {
        this.joinRace(this.currentRaceId);
      }
    });
  }

  // Rejoindre une course
  joinRace(raceId) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ Socket.IO non connecté, impossible de rejoindre la course');
      return;
    }

    // Quitter la course précédente si elle existe
    if (this.currentRaceId && this.currentRaceId !== raceId) {
      this.leaveRace(this.currentRaceId);
    }

    this.currentRaceId = raceId;
    this.socket.emit('join-race', raceId);
    console.log(`🏁 Rejoint la course: ${raceId}`);
  }

  // Quitter une course
  leaveRace(raceId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('leave-race', raceId);
    if (this.currentRaceId === raceId) {
      this.currentRaceId = null;
    }
    console.log(`🚪 Quitté la course: ${raceId}`);
  }

  // Émettre un événement
  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      console.warn(`⚠️ Socket.IO non connecté, événement ${event} ignoré`);
      return;
    }

    this.socket.emit(event, data);
  }

  // Écouter un événement
  on(event, callback) {
    if (!this.socket) {
      console.warn(`⚠️ Socket.IO non initialisé, impossible d'écouter ${event}`);
      return;
    }

    // Stocker le callback pour pouvoir le supprimer plus tard
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);

    this.socket.on(event, callback);
  }

  // Arrêter d'écouter un événement
  off(event, callback) {
    if (!this.socket) {
      return;
    }

    if (callback) {
      this.socket.off(event, callback);
      
      // Supprimer le callback de la liste
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      // Supprimer tous les écouteurs pour cet événement
      this.socket.off(event);
      this.eventListeners.delete(event);
    }
  }

  // Événements de course
  emitRaceStarted(raceId, raceData) {
    this.emit('race-started', { raceId, ...raceData });
  }

  emitRaceFinished(raceId, raceData) {
    this.emit('race-finished', { raceId, ...raceData });
  }

  emitRaceReset(raceId, raceData) {
    this.emit('race-reset', { raceId, ...raceData });
  }

  // Événements de relais
  emitStintStarted(raceId, driverName, driverData) {
    this.emit('stint-started', { raceId, driverName, ...driverData });
  }

  emitStintEnded(raceId, driverName, lapData) {
    this.emit('stint-ended', { raceId, driverName, ...lapData });
  }

  // Événements de pilotes
  emitDriverChanged(raceId, driverName, driverData) {
    this.emit('driver-changed', { raceId, driverName, ...driverData });
  }

  emitDriverAdded(raceId, driverData) {
    this.emit('driver-added', { raceId, ...driverData });
  }

  emitDriverRemoved(raceId, driverId) {
    this.emit('driver-removed', { raceId, driverId });
  }

  // Événements de paramètres
  emitRaceSettingsUpdated(raceId, settings) {
    this.emit('race-settings-updated', { raceId, settings });
  }
  
  // Demander l'état actuel de la course
  requestRaceState(raceId) {
    this.emit('request-race-state', raceId);
  }
  
  // Émettre l'état actuel de la course
  emitRaceState(raceId, raceState) {
    this.emit('emit-race-state', { raceId, ...raceState });
  }

  // Se déconnecter
  disconnect() {
    if (this.socket) {
      if (this.currentRaceId) {
        this.leaveRace(this.currentRaceId);
      }
      
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRaceId = null;
      this.eventListeners.clear();
      
      console.log('🔌 Déconnecté du serveur Socket.IO');
    }
  }

  // Vérifier l'état de la connexion
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      currentRaceId: this.currentRaceId,
      socketId: this.socket?.id
    };
  }

  // Diagnostic de la connexion
  getDiagnostics() {
    if (!this.socket) {
      return { error: 'Socket non initialisé' };
    }

    return {
      connected: this.isConnected,
      socketId: this.socket.id,
      transport: this.socket.io?.engine?.transport?.name || 'inconnu',
      readyState: this.socket.io?.readyState || 'inconnu',
      url: this.socket.io?.uri || 'inconnu',
      opts: {
        transports: this.socket.io?.opts?.transports || [],
        timeout: this.socket.io?.opts?.timeout || 'inconnu',
        reconnection: this.socket.io?.opts?.reconnection || false
      }
    };
  }
}

// Créer une instance singleton
const socketService = new SocketService();

export default socketService;
