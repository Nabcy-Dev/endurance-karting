import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Users, Trophy, BarChart3, Flag, Clock, Plus, Trash2, RefreshCw, Target, Zap, Loader2, AlertTriangle, Camera, X, Download, History, CheckCircle, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { raceService, driverService, lapService, utilService } from '../services/api';
import WeatherWidget from '../components/WeatherWidget';
import CollaborationStatus from '../components/CollaborationStatus';
import RealtimeNotifications from '../components/RealtimeNotifications';
import MobileMenu from '../components/MobileMenu';
import SocketDiagnostics from '../components/SocketDiagnostics';
import socketService from '../services/socketService';
import * as XLSX from 'xlsx';

// Import conditionnel de Recharts pour éviter les erreurs
let LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart;

try {
  const recharts = require('recharts');
  LineChart = recharts.LineChart;
  Line = recharts.Line;
  XAxis = recharts.XAxis;
  YAxis = recharts.YAxis;
  CartesianGrid = recharts.CartesianGrid;
  Tooltip = recharts.Tooltip;
  Legend = recharts.Legend;
  ResponsiveContainer = recharts.ResponsiveContainer;
  BarChart = recharts.BarChart;
  Bar = recharts.Bar;
  PieChart = recharts.PieChart;
  Pie = recharts.Pie;
  Cell = recharts.Cell;
  AreaChart = recharts.AreaChart;
  Area = recharts.Area;
  RadarChart = recharts.RadarChart;
  Radar = recharts.Radar;
  PolarGrid = recharts.PolarGrid;
  PolarAngleAxis = recharts.PolarAngleAxis;
  PolarRadiusAxis = recharts.PolarRadiusAxis;
  ComposedChart = recharts.ComposedChart;
} catch (error) {
  console.warn('Recharts non disponible:', error);
}

const KartingEnduranceApp = () => {
  // États principaux
  const [activeTab, setActiveTab] = useState('course');
  const [isRunning, setIsRunning] = useState(false);
  const [currentDriverIndex, setCurrentDriverIndex] = useState(0);
  const [raceStarted, setRaceStarted] = useState(false);
  const [raceStartTime, setRaceStartTime] = useState(null);
  const [newDriverName, setNewDriverName] = useState("");
  const [stintRunning, setStintRunning] = useState(false);
  
  // États API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentRace, setCurrentRace] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [laps, setLaps] = useState([]);
  const [currentLapStart, setCurrentLapStart] = useState(0);
  
  // États pour les temps en temps réel
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [currentStintTime, setCurrentStintTime] = useState(0);
  
  // État pour la confirmation de reset
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // États pour l'upload d'images
  const [uploadingImage, setUploadingImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // États pour l'historique des courses
  const [allRaces, setAllRaces] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedRaceLaps, setSelectedRaceLaps] = useState([]);
  const [showRaceDetails, setShowRaceDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [raceToDelete, setRaceToDelete] = useState(null);
  
  // Configuration de course
  const [raceSettings, setRaceSettings] = useState({
    raceName: 'Course d\'endurance', // Nom de la course
    teamName: 'Endurance - Sigma Team', // Nom de l'équipe
    duration: 60, // minutes
    minStintTime: 10, // minutes minimum par relais
    maxStintTime: 30, // minutes maximum par relais
    targetLaps: 0,
    city: 'Paris' // Nouveau champ pour la ville
  });
  
  // Références et intervalles
  const intervalRef = useRef(null);
  const timeIntervalRef = useRef(null);

  // États pour les statistiques de la course actuelle
  const [currentRaceDriverStats, setCurrentRaceDriverStats] = useState({});

  // Initialisation - Charger les données depuis l'API
  const initializeApp = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Test de connexion API
      await utilService.testConnection();

      // Charger les pilotes
      const driversResponse = await driverService.getAll();
      setDrivers(driversResponse.data);

      // Charger toutes les courses (actives et terminées)
      const racesResponse = await raceService.getAll();
      setAllRaces(racesResponse.data);
      
      let activeRace = racesResponse.data.find(race => race.status === 'running' || race.status === 'pending');
      
      if (!activeRace) {
        // Créer une nouvelle course
        const newRace = await raceService.create({
          name: raceSettings.raceName,
          teamName: raceSettings.teamName,
          duration: raceSettings.duration,
          settings: raceSettings
        });
        activeRace = newRace.data;
        setAllRaces(prev => [activeRace, ...prev]);
      } else {
        // Mettre à jour les paramètres de course avec ceux de la course existante
        if (activeRace.settings) {
          setRaceSettings({
            raceName: activeRace.name || raceSettings.raceName,
            teamName: activeRace.teamName || raceSettings.teamName,
            duration: activeRace.duration || raceSettings.duration,
            minStintTime: activeRace.settings.minStintTime || raceSettings.minStintTime,
            maxStintTime: activeRace.settings.maxStintTime || raceSettings.maxStintTime,
            targetLaps: activeRace.settings.targetLaps || raceSettings.targetLaps,
            city: activeRace.settings.city || raceSettings.city
          });
        }
      }

      setCurrentRace(activeRace);
      
      // Charger les relais de la course
      if (activeRace._id) {
        const lapsResponse = await lapService.getByRace(activeRace._id);
        setLaps(lapsResponse.data);
        
        // Calculer les statistiques des pilotes pour cette course spécifique
        const raceDriverStats = {};
        lapsResponse.data.forEach(lap => {
          if (!raceDriverStats[lap.driver]) {
            raceDriverStats[lap.driver] = {
              driverId: lap.driver,
              driverName: lap.driverName,
              laps: 0,
              totalTime: 0,
              lapTimes: []
            };
          }
          raceDriverStats[lap.driver].laps++;
          raceDriverStats[lap.driver].totalTime += lap.lapTime;
          raceDriverStats[lap.driver].lapTimes.push(lap.lapTime);
        });
        
        // Calculer les moyennes et meilleurs temps
        Object.keys(raceDriverStats).forEach(driverId => {
          const stats = raceDriverStats[driverId];
          stats.bestLap = Math.min(...stats.lapTimes);
          stats.averageLap = stats.totalTime / stats.laps;
        });
        
        setCurrentRaceDriverStats(raceDriverStats);
      }

      // Mettre à jour l'état de la course
      if (activeRace.status === 'running') {
        setRaceStarted(true);
        setRaceStartTime(new Date(activeRace.startTime));
        setIsRunning(true);
        
        // Vérifier s'il y a un relais en cours
        if (activeRace.currentStintStart) {
          const stintStartTime = new Date(activeRace.currentStintStart);
          const now = Date.now();
          const stintDuration = now - stintStartTime.getTime();
          
          // Si le relais a commencé il y a moins de 2 heures, on le considère comme en cours
          if (stintDuration < 2 * 60 * 60 * 1000) { // 2 heures
            console.log('🔄 Relais en cours détecté au chargement:', {
              startTime: stintStartTime,
              duration: stintDuration,
              driver: activeRace.currentDriver
            });
            
            setStintRunning(true);
            setCurrentLapStart(stintStartTime.getTime());
            setCurrentStintTime(stintDuration);
          } else {
            console.log('⚠️ Relais trop ancien, pas de relais en cours');
            setStintRunning(false);
            setCurrentLapStart(0);
            setCurrentStintTime(0);
          }
        } else {
          console.log('ℹ️ Aucun relais en cours détecté');
          setStintRunning(false);
          setCurrentLapStart(0);
          setCurrentStintTime(0);
        }
      }

      if (activeRace.currentDriver) {
        const driverIndex = driversResponse.data.findIndex(d => d._id === activeRace.currentDriver);
        if (driverIndex !== -1) {
          setCurrentDriverIndex(driverIndex);
        }
      }

    } catch (err) {
      console.error('Erreur d\'initialisation:', err);
      setError('Erreur de connexion à l\'API. Vérifiez que le serveur est démarré.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  // Configuration des écouteurs Socket.IO pour la collaboration en temps réel
  useEffect(() => {
    // Se connecter au service Socket.IO
    console.log('🔌 Tentative de connexion Socket.IO...');
    socketService.connect();
    
    // Vérifier le statut de connexion
    const checkConnection = () => {
      const status = socketService.getConnectionStatus();
      console.log('🔌 Statut Socket.IO:', status);
    };
    
    // Vérifier immédiatement
    checkConnection();
    
    // Vérifier après un délai
    setTimeout(checkConnection, 1000);
    
    if (!currentRace?._id) return;
    
    // Demander l'état actuel de la course aux autres clients
    console.log('🔄 Demande de synchronisation avec les autres clients...');
    socketService.requestRaceState(currentRace._id);

    // Écouter les événements de course
    const handleRaceStarted = (data) => {
      if (data.raceId === currentRace._id) {
        console.log('🔌 Événement reçu: Course démarrée par un autre utilisateur');
        setRaceStarted(true);
        setRaceStartTime(new Date(data.startTime || Date.now()));
        setIsRunning(true);
      }
    };

    const handleRaceFinished = (data) => {
      if (data.raceId === currentRace._id) {
        console.log('🔌 Événement reçu: Course terminée par un autre utilisateur');
        setIsRunning(false);
        setRaceStarted(false);
        setStintRunning(false);
        setCurrentStintTime(0);
      }
    };

    const handleRaceReset = (data) => {
      if (data.raceId === currentRace._id) {
        console.log('🔌 Événement reçu: Course réinitialisée par un autre utilisateur');
        setIsRunning(false);
        setRaceStarted(false);
        setRaceStartTime(null);
        setCurrentDriverIndex(0);
        setLaps([]);
        setCurrentLapStart(0);
        setStintRunning(false);
        setCurrentStintTime(0);
        setCurrentRaceDriverStats({});
      }
    };

    // Écouter les événements de relais
    const handleStintStarted = (data) => {
      if (data.raceId === currentRace._id) {
        console.log('🔌 Événement reçu: Relais démarré par un autre utilisateur');
        console.log('   - Données reçues:', data);
        
        // Mettre à jour TOUS les états en une fois pour éviter les problèmes de synchronisation
        const now = Date.now();
        
        // Synchroniser le pilote actuel si l'événement contient l'ID du pilote
        let newDriverIndex = currentDriverIndex;
        if (data.driverId) {
          const driverIndex = drivers.findIndex(d => d._id === data.driverId);
          if (driverIndex !== -1) {
            console.log('🔌 Synchronisation du pilote actuel:', drivers[driverIndex].name, 'à l\'index', driverIndex);
            newDriverIndex = driverIndex;
          } else {
            console.warn('⚠️ Pilote non trouvé pour l\'ID:', data.driverId);
          }
        } else {
          console.warn('⚠️ Événement stint-started sans driverId');
        }
        
        // Mettre à jour tous les états en une fois
        setStintRunning(true);
        setIsRunning(true);
        setCurrentLapStart(now);
        setCurrentStintTime(0);
        setCurrentDriverIndex(newDriverIndex);
        
        // Forcer la mise à jour de l'interface
        console.log('🔄 Interface mise à jour avec le relais démarré');
      }
    };

    const handleStintEnded = (data) => {
      if (data.raceId === currentRace._id) {
        console.log('🔌 Événement reçu: Relais terminé par un autre utilisateur');
        console.log('   - Données reçues:', data);
        
        // Mettre à jour l'état local immédiatement
        setStintRunning(false);
        setIsRunning(false);
        setCurrentStintTime(0);
        setCurrentLapStart(0);
        
        // Recharger les données de la course pour avoir l'historique à jour
        setTimeout(() => {
          refreshRaceData();
        }, 100);
        
        console.log('🔄 Interface mise à jour avec le relais terminé');
      }
    };

    // Écouter les événements de pilotes
    const handleDriverChanged = (data) => {
      if (data.raceId === currentRace._id) {
        console.log('🔌 Événement reçu: Pilote changé par un autre utilisateur');
        const driverIndex = drivers.findIndex(d => d._id === data.driverId);
        if (driverIndex !== -1) {
          setCurrentDriverIndex(driverIndex);
        }
      }
    };

    const handleDriverAdded = (data) => {
      console.log('🔌 Événement reçu: Pilote ajouté par un autre utilisateur');
      refreshDrivers();
    };

    const handleDriverRemoved = (data) => {
      console.log('🔌 Événement reçu: Pilote supprimé par un autre utilisateur');
      refreshDrivers();
    };

    // Écouter les événements de paramètres
    const handleRaceSettingsUpdated = (data) => {
      if (data.raceId === currentRace._id) {
        console.log('🔌 Événement reçu: Paramètres mis à jour par un autre utilisateur');
        refreshRaceData();
      }
    };
    
    // Écouter la demande d'état de la course
    const handleRaceStateRequested = (data) => {
      if (data.raceId === currentRace._id) {
        console.log('🔌 Demande d\'état de la course reçue, émission de l\'état actuel');
        // Émettre l'état actuel de la course
        socketService.emitRaceState(currentRace._id, {
          raceStarted,
          isRunning,
          stintRunning,
          currentDriverIndex,
          currentLapStart,
          raceStartTime,
          timestamp: Date.now()
        });
      }
    };
    
    // Écouter la mise à jour de l'état de la course
    const handleRaceStateUpdated = (data) => {
      if (data.raceId === currentRace._id) {
        console.log('🔌 État de la course reçu, synchronisation...');
        console.log('   - Données reçues:', data);
        
        // Synchroniser TOUS les états en une fois
        const updates = {};
        
        if (data.raceStarted !== undefined) {
          updates.raceStarted = data.raceStarted;
          setRaceStarted(data.raceStarted);
        }
        
        if (data.isRunning !== undefined) {
          updates.isRunning = data.isRunning;
          setIsRunning(data.isRunning);
        }
        
        if (data.stintRunning !== undefined) {
          updates.stintRunning = data.stintRunning;
          setStintRunning(data.stintRunning);
        }
        
        if (data.currentDriverIndex !== undefined) {
          updates.currentDriverIndex = data.currentDriverIndex;
          setCurrentDriverIndex(data.currentDriverIndex);
        }
        
        if (data.currentLapStart !== undefined) {
          updates.currentLapStart = data.currentLapStart;
          setCurrentLapStart(data.currentLapStart);
        }
        
        if (data.raceStartTime !== undefined) {
          updates.raceStartTime = data.raceStartTime;
          setRaceStartTime(new Date(data.raceStartTime));
        }
        
        console.log('🔄 États synchronisés:', updates);
      }
    };

    // Enregistrer tous les écouteurs
    socketService.on('race-started', handleRaceStarted);
    socketService.on('race-finished', handleRaceFinished);
    socketService.on('race-reset', handleRaceReset);
    socketService.on('stint-started', handleStintStarted);
    socketService.on('stint-ended', handleStintEnded);
    socketService.on('driver-changed', handleDriverChanged);
    socketService.on('driver-added', handleDriverAdded);
    socketService.on('driver-removed', handleDriverRemoved);
    socketService.on('race-settings-updated', handleRaceSettingsUpdated);
    socketService.on('race-state-requested', handleRaceStateRequested);
    socketService.on('race-state-updated', handleRaceStateUpdated);

    // Nettoyer les écouteurs lors du démontage
    return () => {
      socketService.off('race-started', handleRaceStarted);
      socketService.off('race-finished', handleRaceFinished);
      socketService.off('race-reset', handleRaceReset);
      socketService.off('stint-started', handleStintStarted);
      socketService.off('stint-ended', handleStintEnded);
      socketService.off('driver-changed', handleDriverChanged);
      socketService.off('driver-added', handleDriverAdded);
      socketService.off('driver-removed', handleDriverRemoved);
      socketService.off('race-settings-updated', handleRaceSettingsUpdated);
      socketService.off('race-state-requested', handleRaceStateRequested);
      socketService.off('race-state-updated', handleRaceStateUpdated);
    };
  }, [currentRace?._id, drivers]);

  // Fonction pour rafraîchir les données de la course
  const refreshRaceData = async () => {
    if (!currentRace?._id) return;
    
    try {
      const [raceResponse, lapsResponse] = await Promise.all([
        raceService.getById(currentRace._id),
        lapService.getByRace(currentRace._id)
      ]);
      
      setCurrentRace(raceResponse.data);
      setLaps(lapsResponse.data);
      
      // Recalculer les statistiques
      const raceDriverStats = {};
      lapsResponse.data.forEach(lap => {
        if (!raceDriverStats[lap.driver]) {
          raceDriverStats[lap.driver] = {
            driverId: lap.driver,
            driverName: lap.driverName,
            laps: 0,
            totalTime: 0,
            lapTimes: []
          };
        }
        raceDriverStats[lap.driver].laps++;
        raceDriverStats[lap.driver].totalTime += lap.lapTime;
        raceDriverStats[lap.driver].lapTimes.push(lap.lapTime);
      });
      
      Object.keys(raceDriverStats).forEach(driverId => {
        const stats = raceDriverStats[driverId];
        stats.bestLap = Math.min(...stats.lapTimes);
        stats.averageLap = stats.totalTime / stats.laps;
      });
      
      setCurrentRaceDriverStats(raceDriverStats);
    } catch (err) {
      console.error('Erreur lors du rafraîchissement des données:', err);
    }
  };

  // Fonction pour rafraîchir la liste des pilotes
  const refreshDrivers = async () => {
    try {
      const driversResponse = await driverService.getAll();
      setDrivers(driversResponse.data);
    } catch (err) {
      console.error('Erreur lors du rafraîchissement des pilotes:', err);
    }
  };

  // Chronomètre principal pour les temps en temps réel
  useEffect(() => {
    // Mettre à jour le temps actuel toutes les 100ms
    timeIntervalRef.current = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      
      // Calculer le temps du relais en cours
      if (raceStarted && isRunning && currentLapStart > 0) {
        const stintTime = now - currentLapStart;
        setCurrentStintTime(stintTime);
      }
    }, 100);

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [raceStarted, isRunning, currentLapStart]);

  // Démarrer la course
  const startRace = async () => {
    if (!currentRace) return;
    
    try {
      const response = await raceService.start(currentRace._id);
      const updatedRace = response.data;
      
      setCurrentRace(updatedRace);
      setRaceStarted(true);
      setRaceStartTime(new Date(updatedRace.startTime));
      setCurrentLapStart(new Date(updatedRace.currentStintStart));
      setIsRunning(true);

      // Émettre l'événement de collaboration
      socketService.emitRaceStarted(currentRace._id, {
        startTime: updatedRace.startTime,
        currentStintStart: updatedRace.currentStintStart
      });
    } catch (err) {
      console.error('Erreur lors du démarrage de la course:', err);
      setError('Erreur lors du démarrage de la course');
    }
  };

  // Reset complet
  const resetRace = async () => {
    try {
      const oldRaceId = currentRace?._id;
      
      setIsRunning(false);
      setRaceStarted(false);
      setRaceStartTime(null);
      setCurrentDriverIndex(0);
      setLaps([]);
      setCurrentLapStart(0);
      setStintRunning(false);
      setCurrentStintTime(0);
      setShowResetConfirm(false);
      
      // Réinitialiser les statistiques de la course actuelle
      setCurrentRaceDriverStats({});
      
      // Créer une nouvelle course avec les paramètres actuels
      const newRace = await raceService.create({
        name: raceSettings.raceName,
        teamName: raceSettings.teamName,
        duration: raceSettings.duration,
        settings: raceSettings
      });
      
      setCurrentRace(newRace.data);

      // Émettre l'événement de collaboration si une course existait
      if (oldRaceId) {
        socketService.emitRaceReset(oldRaceId, {
          newRaceId: newRace.data._id,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error('Erreur lors du reset:', err);
      setError('Erreur lors du reset de la course');
    }
  };

  // Démarrer un relais (et la course si c'est le premier)
  const startStint = async () => {
    if (!currentRace || !drivers[currentDriverIndex]) return;
    
    try {
      // Si c'est le premier relais, démarrer la course automatiquement
      if (!raceStarted) {
        const response = await raceService.start(currentRace._id);
        const updatedRace = response.data;
        
        setCurrentRace(updatedRace);
        setRaceStarted(true);
        setRaceStartTime(new Date(updatedRace.startTime));
        setIsRunning(true);

        // Émettre l'événement de démarrage de course
        socketService.emitRaceStarted(currentRace._id, {
          startTime: updatedRace.startTime,
          currentStintStart: updatedRace.currentStintStart
        });
      }
      
      // Démarrer le relais (sans changer de pilote automatiquement)
      setStintRunning(true);
      setIsRunning(true);
      const now = Date.now();
      setCurrentLapStart(now);
      setCurrentStintTime(0);
      
      // Mettre à jour la course dans la base de données avec le début du relais
      try {
        await raceService.update(currentRace._id, {
          currentStintStart: new Date(now),
          currentDriver: drivers[currentDriverIndex]._id
        });
        console.log('💾 Course mise à jour dans la base de données');
      } catch (err) {
        console.warn('⚠️ Impossible de mettre à jour la course:', err);
      }
      
      console.log('🚀 Relais démarré localement:', {
        driver: drivers[currentDriverIndex].name,
        stintRunning: true,
        isRunning: true,
        currentLapStart: now
      });

      // Vérifier que Socket.IO est connecté avant d'émettre
      if (socketService.getConnectionStatus().isConnected) {
        // Émettre l'événement de démarrage de relais
        socketService.emitStintStarted(currentRace._id, drivers[currentDriverIndex].name, {
          driverId: drivers[currentDriverIndex]._id,
          timestamp: now
        });
        
        // Émettre l'état complet de la course pour synchroniser tous les clients
        socketService.emitRaceState(currentRace._id, {
          raceStarted: true,
          isRunning: true,
          stintRunning: true,
          currentDriverIndex: currentDriverIndex,
          currentLapStart: now,
          raceStartTime: raceStarted ? raceStartTime : now,
          timestamp: Date.now()
        });
        
        console.log('🚀 Relais démarré et état émis à tous les clients');
      } else {
        console.warn('⚠️ Socket.IO non connecté, impossible d\'émettre les événements');
      }
    } catch (err) {
      console.error('Erreur lors du démarrage du relais:', err);
      setError('Erreur lors du démarrage du relais');
    }
  };

  // Terminer un relais
  const endStint = async () => {
    if (!stintRunning || !currentRace || !drivers[currentDriverIndex]) return;
    
    try {
      setIsRunning(false);
      setStintRunning(false);
      
      // Enregistrer le relais
      const now = Date.now();
      const lapTime = now - currentLapStart;
      
      const lapData = {
        race: currentRace._id,
        driver: drivers[currentDriverIndex]._id,
        driverName: drivers[currentDriverIndex].name,
        lapNumber: laps.length + 1,
        lapTime: lapTime,
        totalTime: currentRace.totalTime + lapTime,
        stintStartTime: new Date(currentLapStart),
        stintEndTime: new Date(now)
      };
      
      const newLap = await lapService.create(lapData);
      setLaps(prev => [...prev, newLap.data]);
      
      // Mettre à jour la course dans la base de données
      try {
        await raceService.update(currentRace._id, {
          currentStintStart: null,
          currentDriver: null
        });
        console.log('💾 Course mise à jour dans la base de données (relais terminé)');
      } catch (err) {
        console.warn('⚠️ Impossible de mettre à jour la course:', err);
      }
      
      // Récupérer la course mise à jour
      const updatedRace = await raceService.getById(currentRace._id);
      setCurrentRace(updatedRace.data);
      
      // Mettre à jour les statistiques de la course actuelle
      const currentDriverId = drivers[currentDriverIndex]._id;
      setCurrentRaceDriverStats(prev => {
        const updated = { ...prev };
        if (!updated[currentDriverId]) {
          updated[currentDriverId] = {
            driverId: currentDriverId,
            driverName: drivers[currentDriverIndex].name,
            laps: 0,
            totalTime: 0,
            lapTimes: []
          };
        }
        updated[currentDriverId].laps++;
        updated[currentDriverId].totalTime += lapTime;
        updated[currentDriverId].lapTimes.push(lapTime);
        updated[currentDriverId].bestLap = Math.min(...updated[currentDriverId].lapTimes);
        updated[currentDriverId].averageLap = updated[currentDriverId].totalTime / updated[currentDriverId].laps;
        return updated;
      });
      
      setCurrentStintTime(0);

      // Vérifier que Socket.IO est connecté avant d'émettre
      if (socketService.getConnectionStatus().isConnected) {
        // Émettre l'événement de fin de relais
        socketService.emitStintEnded(currentRace._id, drivers[currentDriverIndex].name, {
          lapId: newLap.data._id,
          lapTime: lapTime,
          timestamp: now
        });
        
        // Émettre l'état complet de la course pour synchroniser tous les clients
        socketService.emitRaceState(currentRace._id, {
          raceStarted: true,
          isRunning: false,
          stintRunning: false,
          currentDriverIndex: currentDriverIndex,
          currentLapStart: 0,
          raceStartTime: raceStartTime,
          timestamp: Date.now()
        });
        
        console.log('⏹️ Relais terminé et état émis à tous les clients');
      } else {
        console.warn('⚠️ Socket.IO non connecté, impossible d\'émettre les événements');
      }
    } catch (err) {
      console.error('Erreur lors de la fin du relais:', err);
      setError('Erreur lors de la fin du relais');
    }
  };

  // Changer de pilote (relais)
  const changeDriver = async (newIndex) => {
    if (!currentRace || !drivers[newIndex]) return;
    
    // Empêcher le changement de pilote pendant un relais
    if (stintRunning) {
      console.log('⚠️ Impossible de changer de pilote pendant un relais en cours');
      return; // Pas d'erreur visible, juste empêcher l'action
    }
    
    try {
      setCurrentDriverIndex(newIndex);
      
      if (raceStarted) {
        await raceService.changeDriver(currentRace._id, drivers[newIndex]._id);
        const updatedRace = await raceService.getById(currentRace._id);
        setCurrentRace(updatedRace.data);

        // Émettre l'événement de changement de pilote
        socketService.emitDriverChanged(currentRace._id, drivers[newIndex].name, {
          driverId: drivers[newIndex]._id,
          timestamp: Date.now()
        });
        
        // Émettre l'état complet de la course pour synchroniser tous les clients
        socketService.emitRaceState(currentRace._id, {
          raceStarted,
          isRunning,
          stintRunning,
          currentDriverIndex: newIndex,
          currentLapStart,
          raceStartTime,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error('Erreur lors du changement de pilote:', err);
      setError('Erreur lors du changement de pilote');
    }
  };

  // Ajouter un pilote
  const addDriver = async () => {
    if (!newDriverName.trim()) return;
    
    try {
      const driverData = {
        name: newDriverName,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
      };
      
      const newDriver = await driverService.create(driverData);
      setDrivers(prev => [...prev, newDriver.data]);
      setNewDriverName("");

      // Émettre l'événement d'ajout de pilote
      if (currentRace?._id) {
        socketService.emitDriverAdded(currentRace._id, {
          driverId: newDriver.data._id,
          driverName: newDriver.data.name,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout du pilote:', err);
      setError('Erreur lors de l\'ajout du pilote');
    }
  };

  // Supprimer un pilote
  const removeDriver = async (id) => {
    if (drivers.length > 1) {
      try {
        await driverService.delete(id);
        setDrivers(prev => prev.filter(d => d._id !== id));
        
        if (currentDriverIndex >= drivers.length - 1) {
          setCurrentDriverIndex(0);
        }

        // Émettre l'événement de suppression de pilote
        if (currentRace?._id) {
          socketService.emitDriverRemoved(currentRace._id, id);
        }
      } catch (err) {
        console.error('Erreur lors de la suppression du pilote:', err);
        setError('Erreur lors de la suppression du pilote');
      }
    }
  };

  // Réinitialiser les statistiques d'un pilote
  const resetDriverStats = async (driverId) => {
    try {
      await driverService.resetStats(driverId);
      setDrivers(prev => prev.map(d => 
        d._id === driverId 
          ? { ...d, totalTime: 0, laps: 0, bestLap: null, averageLap: 0 }
          : d
      ));
    } catch (err) {
      console.error('Erreur lors de la réinitialisation des stats:', err);
      setError('Erreur lors de la réinitialisation des statistiques');
    }
  };

  // Formatage du temps
  const formatTime = (ms) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calcul du temps total de course
  const totalElapsedTime = raceStarted && raceStartTime ? currentTime - raceStartTime : 0;

  // Calcul du temps restant
  const timeRemaining = Math.max(0, (raceSettings.duration * 60000) - totalElapsedTime);
  const raceProgress = (totalElapsedTime / (raceSettings.duration * 60000)) * 100;

  // Données pour les graphiques
  const lapTimeData = laps.map((lap, index) => ({
    lap: index + 1,
    time: lap.lapTime / 1000,
    driver: lap.driverName,
    ...drivers.reduce((acc, driver) => {
      acc[driver.name] = lap.driver === driver._id ? lap.lapTime / 1000 : null;
      return acc;
    }, {})
  }));

  const driverStatsData = Object.values(currentRaceDriverStats).map(stats => ({
    name: stats.driverName,
    laps: stats.laps,
    totalTime: stats.totalTime / 1000,
    avgLap: stats.laps > 0 ? (stats.totalTime / stats.laps) / 1000 : 0,
    bestLap: stats.bestLap ? stats.bestLap / 1000 : 0
  }));

  // Données pour les graphiques avancés
  const lapTimeDataAdvanced = laps.map((lap, index) => ({
    lap: index + 1,
    time: lap.lapTime / 1000,
    driver: lap.driverName,
    driverId: lap.driver,
    timestamp: new Date(lap.stintStartTime),
    ...drivers.reduce((acc, driver) => {
      acc[driver.name] = lap.driver === driver._id ? lap.lapTime / 1000 : null;
      return acc;
    }, {})
  }));

  const driverStatsDataAdvanced = Object.values(currentRaceDriverStats).map(stats => {
    const driver = drivers.find(d => d._id === stats.driverId);
    return {
      name: stats.driverName,
      laps: stats.laps,
      totalTime: stats.totalTime / 1000,
      avgLap: stats.laps > 0 ? (stats.totalTime / stats.laps) / 1000 : 0,
      bestLap: stats.bestLap ? stats.bestLap / 1000 : 0,
      color: driver ? driver.color : '#6b7280'
    };
  });

  // Données pour le graphique en radar
  const radarData = Object.values(currentRaceDriverStats).map(stats => ({
    subject: stats.driverName,
    'Nombre de relais': stats.laps,
    'Temps total (min)': Math.round(stats.totalTime / 60000 * 10) / 10,
    'Meilleur relais (min)': stats.bestLap ? Math.round(stats.bestLap / 60000 * 10) / 10 : 0,
    'Moyenne (min)': stats.laps > 0 ? Math.round((stats.totalTime / stats.laps) / 60000 * 10) / 10 : 0,
    fullMark: Math.max(
      ...Object.values(currentRaceDriverStats).map(s => s.laps),
      ...Object.values(currentRaceDriverStats).map(s => Math.round(s.totalTime / 60000 * 10) / 10),
      ...Object.values(currentRaceDriverStats).map(s => s.bestLap ? Math.round(s.bestLap / 60000 * 10) / 10 : 0)
    )
  }));

  // Données pour le graphique en secteurs
  const pieData = Object.values(currentRaceDriverStats).map(stats => {
    const driver = drivers.find(d => d._id === stats.driverId);
    return {
      name: stats.driverName,
      value: stats.laps,
      color: driver ? driver.color : '#6b7280'
    };
  });

  // Données pour l'évolution temporelle
  const timeEvolutionData = laps.map((lap, index) => {
    const driver = drivers.find(d => d._id === lap.driver);
    return {
      lap: index + 1,
      time: lap.lapTime / 1000,
      driver: driver?.name || lap.driverName,
      color: driver?.color || '#6b7280',
      timestamp: new Date(lap.stintStartTime),
      cumulativeTime: lap.totalTime / 1000
    };
  });

  // Composant de graphique simplifié
  const SimpleChart = ({ data, title }) => {
    if (!LineChart) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-bold mb-6 text-gray-800">{title}</h3>
          <div className="text-center text-gray-500 py-8">
            Graphiques temporairement indisponibles
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
        <h3 className="text-xl font-bold mb-6 text-gray-800">{title}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="lap" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              wrapperStyle={{ outline: 'none' }}
              isAnimationActive={false}
            />
            <Legend />
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <Line type="monotone" dataKey="time" stroke="#1f2937" strokeWidth={2} />
            {drivers.map(driver => (
              <Line key={driver._id} type="monotone" dataKey={driver.name} stroke={driver.color} strokeWidth={2} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Mettre à jour les paramètres de course
  const updateRaceSettings = async (newSettings) => {
    if (!currentRace) return;
    
    try {
      const updatedSettings = { ...raceSettings, ...newSettings };
      setRaceSettings(updatedSettings);
      
      // Mettre à jour la course dans la base de données
      const updateData = {
        duration: updatedSettings.duration,
        settings: updatedSettings
      };
      
      // Si le nom de course a changé, l'inclure dans la mise à jour
      if (newSettings.raceName) {
        updateData.name = newSettings.raceName;
      }
      
      // Si le nom d'équipe a changé, l'inclure dans la mise à jour
      if (newSettings.teamName) {
        updateData.teamName = newSettings.teamName;
      }
      
      await raceService.update(currentRace._id, updateData);
      
      // Mettre à jour la course locale
      const updatedRace = await raceService.getById(currentRace._id);
      setCurrentRace(updatedRace.data);
      
      // Mettre à jour la liste des courses si le nom a changé
      if (newSettings.raceName) {
        setAllRaces(prev => prev.map(race => 
          race._id === currentRace._id ? { ...race, name: newSettings.raceName } : race
        ));
      }

      // Émettre l'événement de mise à jour des paramètres
      socketService.emitRaceSettingsUpdated(currentRace._id, updatedSettings);
    } catch (err) {
      console.error('Erreur lors de la mise à jour des paramètres:', err);
      setError('Erreur lors de la mise à jour des paramètres');
    }
  };

  // Compresser une image
  const compressImage = (base64, maxWidth = 300, quality = 0.8) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculer les nouvelles dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dessiner l'image compressée
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en base64 avec compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.src = base64;
    });
  };

  // Gérer l'upload d'image de profil
  const handleImageUpload = async (event, driverId) => {
    const file = event.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image valide');
        return;
      }

      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image est trop volumineuse. Taille maximum : 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target.result;
        setImagePreview(base64Image);
        setUploadingImage(driverId);
        
        try {
          const compressedBase64 = await compressImage(base64Image);
          await driverService.update(driverId, { profileImage: compressedBase64 });
          setDrivers(prev => prev.map(d => 
            d._id === driverId ? { ...d, profileImage: compressedBase64 } : d
          ));
          setImagePreview(null);
          setUploadingImage(null);
        } catch (err) {
          console.error('Erreur lors de l\'upload de l\'image:', err);
          setError('Erreur lors de l\'upload de l\'image');
          setImagePreview(null);
          setUploadingImage(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Supprimer l'image de profil
  const removeProfileImage = async (driverId) => {
    try {
      await driverService.update(driverId, { profileImage: null });
      setDrivers(prev => prev.map(d => 
        d._id === driverId ? { ...d, profileImage: null } : d
      ));
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'image:', err);
      setError('Erreur lors de la suppression de l\'image');
    }
  };

  // Composant pour afficher la photo de profil
  const ProfileImage = ({ driver, size = "w-8 h-8" }) => {
    if (driver.profileImage) {
      return (
        <div className={`${size} rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0`}>
          <img 
            src={driver.profileImage} 
            alt={driver.name}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    
    return (
      <div className={`${size} rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0`}>
        <span className="text-gray-600 font-bold text-sm">
          {driver.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  // Fonction pour exporter en Excel
  const exportToExcel = async () => {
    if (!currentRace || laps.length === 0) {
      setError('Aucune donnée à exporter');
      return;
    }

    try {
      console.log('Debug - Données disponibles:', {
        drivers: drivers.length,
        laps: laps.length,
        currentRace: currentRace.name
      });

      // Préparer les données pour l'historique des relais
      const relaisData = laps.map((lap, index) => {
        const driver = drivers.find(d => d._id === lap.driver);
        return {
          'Numéro de relais': lap.lapNumber,
          'Nom du pilote': lap.driverName,
          'Heure début relais': new Date(lap.stintStartTime).toLocaleString('fr-FR'),
          'Heure fin relais': new Date(lap.stintEndTime).toLocaleString('fr-FR'),
          'Temps du relais': formatTime(lap.lapTime),
          'Temps du relais (ms)': lap.lapTime,
          'Temps total course': formatTime(lap.totalTime),
          'Temps total course (ms)': lap.totalTime
        };
      });

      // Calculer les statistiques côté client avec debug
      const calculatedStats = drivers.map(driver => {
        const driverLaps = laps.filter(lap => lap.driver === driver._id);
        const totalTime = driverLaps.reduce((acc, lap) => acc + lap.lapTime, 0);
        const lapsCount = driverLaps.length;
        const bestLap = lapsCount > 0 ? Math.min(...driverLaps.map(lap => lap.lapTime)) : 0;
        const averageLap = lapsCount > 0 ? totalTime / lapsCount : 0;

        console.log(`Debug - Pilote ${driver.name}:`, {
          driverId: driver._id,
          lapsCount,
          totalTime,
          bestLap,
          averageLap,
          driverLaps: driverLaps.length,
          allLapsForDriver: laps.filter(lap => lap.driverName === driver.name).length
        });

        // Vérification alternative : chercher par nom si l'ID ne correspond pas
        if (lapsCount === 0) {
          const lapsByName = laps.filter(lap => lap.driverName === driver.name);
          if (lapsByName.length > 0) {
            console.log(`Debug - Trouvé ${lapsByName.length} relais par nom pour ${driver.name}`);
            const totalTimeByName = lapsByName.reduce((acc, lap) => acc + lap.lapTime, 0);
            const bestLapByName = Math.min(...lapsByName.map(lap => lap.lapTime));
            const averageLapByName = totalTimeByName / lapsByName.length;

            return {
              _id: driver._id,
              name: driver.name,
              totalTime: totalTimeByName,
              laps: lapsByName.length,
              bestLap: bestLapByName,
              averageLap: averageLapByName
            };
          }
        }

        return {
          _id: driver._id,
          name: driver.name,
          totalTime: totalTime,
          laps: lapsCount,
          bestLap: bestLap,
          averageLap: averageLap
        };
      });

      // Trier par temps total (ascendant) puis par nombre de relais (descendant)
      calculatedStats.sort((a, b) => {
        if (a.totalTime !== b.totalTime) {
          return a.totalTime - b.totalTime;
        }
        return b.laps - a.laps;
      });

      console.log('Debug - Statistiques calculées:', calculatedStats);

      // Préparer les données pour le classement des pilotes
      const pilotesData = calculatedStats.map((driver, index) => {
        return {
          'Rang': index + 1,
          'Nom du pilote': driver.name,
          'Nombre de relais': driver.laps,
          'Temps total': formatTime(driver.totalTime),
          'Temps total (ms)': driver.totalTime,
          'Meilleur relais': formatTime(driver.bestLap),
          'Meilleur relais (ms)': driver.bestLap,
          'Moyenne par relais': formatTime(driver.averageLap),
          'Moyenne par relais (ms)': driver.averageLap
        };
      });

      console.log('Debug - Données Excel pilotes:', pilotesData);

      // Créer le workbook Excel
      const workbook = XLSX.utils.book_new();

      // Feuille 1 : Historique des relais
      const relaisWorksheet = XLSX.utils.json_to_sheet(relaisData);
      XLSX.utils.book_append_sheet(workbook, relaisWorksheet, 'Historique des relais');

      // Feuille 2 : Classement des pilotes
      const pilotesWorksheet = XLSX.utils.json_to_sheet(pilotesData);
      XLSX.utils.book_append_sheet(workbook, pilotesWorksheet, 'Classement des pilotes');

      // Feuille 3 : Informations de la course
      const courseInfo = [
        { 'Informations': 'Nom de la course', 'Valeur': currentRace.name },
        { 'Informations': 'Date de création', 'Valeur': new Date(currentRace.createdAt).toLocaleString('fr-FR') },
        { 'Informations': 'Statut', 'Valeur': currentRace.status },
        { 'Informations': 'Durée prévue (minutes)', 'Valeur': currentRace.duration },
        { 'Informations': 'Nombre total de relais', 'Valeur': laps.length },
        { 'Informations': 'Temps total de course', 'Valeur': formatTime(currentRace.totalTime) },
        { 'Informations': 'Date d\'export', 'Valeur': new Date().toLocaleString('fr-FR') }
      ];
      const infoWorksheet = XLSX.utils.json_to_sheet(courseInfo);
      XLSX.utils.book_append_sheet(workbook, infoWorksheet, 'Informations course');

      // Générer le nom du fichier
      const fileName = `karting-endurance-${currentRace.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;

      // Télécharger le fichier
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      setError('Erreur lors de l\'export Excel');
    }
  };

  // Fonction pour exporter une course spécifique en Excel
  const exportRaceToExcel = async (race) => {
    try {
      // Charger les relais de la course spécifique
      const lapsResponse = await lapService.getByRace(race._id);
      const raceLaps = lapsResponse.data;
      
      if (raceLaps.length === 0) {
        setError('Aucun relais trouvé pour cette course');
        return;
      }

      // Préparer les données pour l'historique des relais
      const relaisData = raceLaps.map((lap, index) => {
        return {
          'Numéro de relais': lap.lapNumber,
          'Nom du pilote': lap.driverName,
          'Heure début relais': new Date(lap.stintStartTime).toLocaleString('fr-FR'),
          'Heure fin relais': new Date(lap.stintEndTime).toLocaleString('fr-FR'),
          'Temps du relais': formatTime(lap.lapTime),
          'Temps du relais (ms)': lap.lapTime,
          'Temps total course': formatTime(lap.totalTime),
          'Temps total course (ms)': lap.totalTime
        };
      });

      // Calculer les statistiques des pilotes pour cette course
      const driverStats = {};
      raceLaps.forEach(lap => {
        if (!driverStats[lap.driverName]) {
          driverStats[lap.driverName] = {
            name: lap.driverName,
            laps: 0,
            totalTime: 0,
            lapTimes: []
          };
        }
        driverStats[lap.driverName].laps++;
        driverStats[lap.driverName].totalTime += lap.lapTime;
        driverStats[lap.driverName].lapTimes.push(lap.lapTime);
      });

      // Calculer les moyennes et meilleurs temps
      const pilotesData = Object.values(driverStats).map((driver, index) => {
        const bestLap = Math.min(...driver.lapTimes);
        const averageLap = driver.totalTime / driver.laps;
        
        return {
          'Rang': index + 1,
          'Nom du pilote': driver.name,
          'Nombre de relais': driver.laps,
          'Temps total': formatTime(driver.totalTime),
          'Temps total (ms)': driver.totalTime,
          'Meilleur relais': formatTime(bestLap),
          'Meilleur relais (ms)': bestLap,
          'Moyenne par relais': formatTime(averageLap),
          'Moyenne par relais (ms)': averageLap
        };
      }).sort((a, b) => a['Temps total (ms)'] - b['Temps total (ms)']);

      // Créer le workbook Excel
      const workbook = XLSX.utils.book_new();

      // Feuille 1 : Historique des relais
      const relaisWorksheet = XLSX.utils.json_to_sheet(relaisData);
      XLSX.utils.book_append_sheet(workbook, relaisWorksheet, 'Historique des relais');

      // Feuille 2 : Classement des pilotes
      const pilotesWorksheet = XLSX.utils.json_to_sheet(pilotesData);
      XLSX.utils.book_append_sheet(workbook, pilotesWorksheet, 'Classement des pilotes');

      // Feuille 3 : Informations de la course
      const courseInfo = [
        { 'Informations': 'Nom de la course', 'Valeur': race.name },
        { 'Informations': 'Équipe', 'Valeur': race.teamName },
        { 'Informations': 'Date de création', 'Valeur': new Date(race.createdAt).toLocaleString('fr-FR') },
        { 'Informations': 'Statut', 'Valeur': race.status },
        { 'Informations': 'Durée prévue (minutes)', 'Valeur': race.duration },
        { 'Informations': 'Nombre total de relais', 'Valeur': raceLaps.length },
        { 'Informations': 'Temps total de course', 'Valeur': formatTime(race.totalTime) },
        { 'Informations': 'Date d\'export', 'Valeur': new Date().toLocaleString('fr-FR') }
      ];
      const infoWorksheet = XLSX.utils.json_to_sheet(courseInfo);
      XLSX.utils.book_append_sheet(workbook, infoWorksheet, 'Informations course');

      // Générer le nom du fichier
      const fileName = `karting-endurance-${race.name.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`;

      // Télécharger le fichier
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('Erreur lors de l\'export Excel de la course:', error);
      setError('Erreur lors de l\'export Excel de la course');
    }
  };

  // Terminer la course
  const finishRace = async () => {
    if (!currentRace || !raceStarted) return;
    
    try {
      // Terminer le relais en cours s'il y en a un
      if (stintRunning) {
        await endStint();
      }
      
      // Terminer la course
      const response = await raceService.finish(currentRace._id);
      const updatedRace = response.data;
      
      setCurrentRace(updatedRace);
      setIsRunning(false);
      setRaceStarted(false);
      setStintRunning(false);
      setCurrentStintTime(0);
      
      // Mettre à jour la liste des courses
      setAllRaces(prev => prev.map(race => 
        race._id === updatedRace._id ? updatedRace : race
      ));
      
      // Créer une nouvelle course pour la prochaine session
      const newRace = await raceService.create({
        name: raceSettings.raceName,
        teamName: raceSettings.teamName,
        duration: raceSettings.duration,
        settings: raceSettings
      });
      
      setCurrentRace(newRace.data);
      setAllRaces(prev => [newRace.data, ...prev]);
      setLaps([]);
      
      // Réinitialiser les statistiques de la course actuelle
      setCurrentRaceDriverStats({});

      // Émettre l'événement de fin de course
      socketService.emitRaceFinished(updatedRace._id, {
        endTime: updatedRace.endTime,
        totalLaps: updatedRace.totalLaps,
        totalTime: updatedRace.totalTime,
        timestamp: Date.now()
      });
      
    } catch (err) {
      console.error('Erreur lors de la fin de la course:', err);
      setError('Erreur lors de la fin de la course');
    }
  };

  // Charger les détails d'une course
  const loadRaceDetails = async (race) => {
    try {
      setSelectedRace(race);
      const lapsResponse = await lapService.getByRace(race._id);
      setSelectedRaceLaps(lapsResponse.data);
      setShowRaceDetails(true);
    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err);
      setError('Erreur lors du chargement des détails de la course');
    }
  };

  // Supprimer une course
  const deleteRace = async (raceId) => {
    try {
      await raceService.delete(raceId);
      
      // Mettre à jour la liste des courses
      setAllRaces(prev => prev.filter(race => race._id !== raceId));
      
      // Fermer la modal de confirmation
      setShowDeleteConfirm(false);
      setRaceToDelete(null);
      
      // Si c'était la course actuelle ou s'il n'y a plus de course active, créer une nouvelle
      if (currentRace && currentRace._id === raceId) {
        const newRace = await raceService.create({
          name: raceSettings.raceName,
          teamName: raceSettings.teamName,
          duration: raceSettings.duration,
          settings: raceSettings
        });
        setCurrentRace(newRace.data);
        setAllRaces(prev => [newRace.data, ...prev]);
        setLaps([]);
        setRaceStarted(false);
        setIsRunning(false);
        setStintRunning(false);
        setCurrentStintTime(0);
        setCurrentLapStart(0);
      } else {
        // Vérifier s'il y a encore une course active après suppression
        const remainingRaces = allRaces.filter(race => race._id !== raceId);
        const activeRace = remainingRaces.find(race => race.status === 'running' || race.status === 'pending');
        
        if (!activeRace) {
          // Créer une nouvelle course active
          const newRace = await raceService.create({
            name: raceSettings.raceName,
            teamName: raceSettings.teamName,
            duration: raceSettings.duration,
            settings: raceSettings
          });
          setCurrentRace(newRace.data);
          setAllRaces(prev => [newRace.data, ...prev.filter(race => race._id !== raceId)]);
          setLaps([]);
          setRaceStarted(false);
          setIsRunning(false);
          setStintRunning(false);
          setCurrentStintTime(0);
          setCurrentLapStart(0);
        }
      }
      
    } catch (err) {
      console.error('Erreur lors de la suppression de la course:', err);
      setError('Erreur lors de la suppression de la course');
    }
  };

  // Confirmer la suppression d'une course
  const confirmDeleteRace = (race) => {
    setRaceToDelete(race);
    setShowDeleteConfirm(true);
  };

  // Gestion des erreurs
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Erreur</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={initializeApp}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <div className="text-gray-600">Chargement de l'application...</div>
        </div>
      </div>
    );
  }

  // Navigation
  const navigationTabs = [
    { id: 'course', label: 'Course', icon: Flag },
    { id: 'drivers', label: 'Pilotes', icon: Users },
    // { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'settings', label: 'Paramètres', icon: Target }
  ];

  // Composant de graphique avancé
  const AdvancedChart = ({ data, title, type = 'line', height = 300, showLegend = true }) => {
    if (!LineChart) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-bold mb-6 text-gray-800">{title}</h3>
          <div className="text-center text-gray-500 py-8">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Graphiques temporairement indisponibles</p>
            <p className="text-sm mt-2">Installez recharts pour voir les graphiques</p>
          </div>
        </div>
      );
    }

    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 pointer-events-none">
            <p className="font-semibold text-gray-800 mb-2">Relais {label}</p>
            {payload.map((entry, index) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: {entry.value ? `${Math.round(entry.value / 60 * 10) / 10} min` : 'N/A'}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
        <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          {title}
        </h3>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="lap" 
              stroke="#6b7280" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Math.round(value / 60 * 10) / 10}m`}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ strokeDasharray: '3 3' }}
              wrapperStyle={{ outline: 'none' }}
              isAnimationActive={false}
            />
            {showLegend && <Legend />}
            {drivers.map(driver => (
              <Line 
                key={driver._id} 
                type="monotone" 
                dataKey={driver.name} 
                stroke={driver.color} 
                strokeWidth={3}
                dot={{ fill: driver.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: driver.color, strokeWidth: 2 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Composant pour les statistiques avancées
  const AdvancedStats = () => {
    if (!BarChart || !PieChart || !RadarChart) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-bold mb-6 text-gray-800">Statistiques Avancées</h3>
          <div className="text-center text-gray-500 py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Graphiques avancés temporairement indisponibles</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
        <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
          Statistiques Avancées
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Graphique en barres pour les statistiques des pilotes */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-700">Performance par Pilote</h4>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={driverStatsDataAdvanced}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'totalTime' ? `${Math.round(value / 60 * 10) / 10} min` : 
                    name === 'avgLap' ? `${Math.round(value / 60 * 10) / 10} min` :
                    name === 'bestLap' ? `${Math.round(value / 60 * 10) / 10} min` : value,
                    name === 'totalTime' ? 'Temps total' :
                    name === 'avgLap' ? 'Moyenne' :
                    name === 'bestLap' ? 'Meilleur relais' : 'Relais'
                  ]}
                  cursor={{ strokeDasharray: '3 3' }}
                  wrapperStyle={{ outline: 'none' }}
                  isAnimationActive={false}
                />
                <Legend />
                <Bar dataKey="laps" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Line 
                  type="monotone" 
                  dataKey="avgLap" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique en secteurs pour la répartition des relais */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-700">Répartition des Relais</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} relais`, 'Nombre de relais']} 
                  cursor={{ strokeDasharray: '3 3' }}
                  wrapperStyle={{ outline: 'none' }}
                  isAnimationActive={false}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique en radar pour la comparaison des pilotes */}
        <div className="mt-8">
          <h4 className="text-lg font-semibold mb-4 text-gray-700">Comparaison des Pilotes</h4>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" stroke="#6b7280" fontSize={12} />
              <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} stroke="#6b7280" />
              <Radar
                name="Performance"
                dataKey="Nombre de relais"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
              <Radar
                name="Temps"
                dataKey="Temps total (min)"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.3}
              />
              <Radar
                name="Meilleur"
                dataKey="Meilleur relais (min)"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                wrapperStyle={{ outline: 'none' }}
                isAnimationActive={false}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Menu mobile */}
      <MobileMenu 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        raceStarted={raceStarted}
        isRunning={isRunning}
        stintRunning={stintRunning}
        currentTime={currentTime}
        raceStartTime={raceStartTime}
        currentLapStart={currentLapStart}
        timeRemaining={timeRemaining}
        raceProgress={raceProgress}
        formatTime={formatTime}
        finishRace={finishRace}
        setShowResetConfirm={setShowResetConfirm}
      />
      {/* En-tête */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête principal */}
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <img src="/sygma-control-logo.svg" alt="Sygma Control" className="h-6 sm:h-8" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Karting Endurance</h1>
            </div>
            
            {/* Date - visible sur tous les écrans */}
            <div className="hidden sm:block text-sm text-gray-500">
              {new Date().toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            
            {/* Boutons de contrôle - cachés sur mobile (dans le menu) */}
            <div className="hidden lg:flex items-center space-x-3">
              {raceStarted && (
                <button
                  onClick={finishRace}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-semibold"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Terminer course</span>
                </button>
              )}
              
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>
          
          {/* Barre de temps - responsive */}
          {raceStarted && (
            <div className="pb-4 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                {/* Temps de course écoulé */}
                <div className="text-center bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Temps écoulé</div>
                  <div className="text-base sm:text-lg font-mono font-bold text-blue-800">
                    {formatTime(totalElapsedTime)}
                  </div>
                </div>
                
                {/* Temps restant de course */}
                <div className="text-center bg-red-50 rounded-lg p-3 border border-red-200">
                  <div className="text-xs sm:text-sm text-red-600 font-medium mb-1">Temps restant</div>
                  <div className="text-base sm:text-lg font-mono font-bold text-red-800">
                    {formatTime(timeRemaining)}
                  </div>
                </div>
                
                {/* Temps en course (relais en cours) */}
                {stintRunning && (
                  <div className="text-center bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="text-xs sm:text-sm text-green-600 font-medium mb-1">Temps en course</div>
                    <div className="text-base sm:text-lg font-mono font-bold text-green-800">
                      {formatTime(currentStintTime)}
                    </div>
                  </div>
                )}
                
                {/* Barre de progression */}
                <div className="text-center bg-gray-50 rounded-lg p-3 border border-gray-200 col-span-2 sm:col-span-1">
                  <div className="text-xs sm:text-sm text-gray-600 font-medium mb-2">Progression</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${raceProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">{raceProgress.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Navigation - cachée sur mobile (remplacée par le menu burger) */}
      <nav className="hidden lg:block bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigationTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Onglet Course */}
        {activeTab === 'course' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Colonne 1 : Widget météo + Statut collaboration - caché sur mobile */}
            <div className="hidden lg:block lg:col-span-3 space-y-6">
              <WeatherWidget city={raceSettings.city} />
              <CollaborationStatus raceId={currentRace?._id} />
                     {/* Statistiques rapides */}
                     <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800 flex items-center">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                  Stats rapides
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Total relais</span>
                    <span className="font-semibold text-gray-800">{laps.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Temps total</span>
                    <span className="font-semibold text-gray-800">{formatTime(currentRace?.totalTime || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Meilleur relais</span>
                    <span className="font-semibold text-gray-800">
                      {laps.length > 0 ? formatTime(Math.min(...laps.map(lap => lap.lapTime))) : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600">Moyenne</span>
                    <span className="font-semibold text-gray-800">
                      {laps.length > 0 ? formatTime(laps.reduce((acc, lap) => acc + lap.lapTime, 0) / laps.length) : '--'}
                    </span>
                  </div>
                </div>
              </div>
              {/* <CollaborationStatus raceId={currentRace?._id} /> */}
            </div>

            {/* Colonne 2 : Relais en cours + Derniers relais (dominante) */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-6">
              {/* Chronomètre et contrôles */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                <div className="text-center mb-6 sm:mb-8">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-mono font-bold mb-3 sm:mb-4 text-gray-800">
                    {stintRunning ? (
                      <span className="text-green-600">
                        Relais en cours : {formatTime(currentStintTime)}
                      </span>
                    ) : (
                      <span className="text-gray-600">
                        Relais en cours : 00:00:00
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm sm:text-lg text-gray-600 mb-3 sm:mb-4 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <span>Pilote actuel :</span>
                    {drivers[currentDriverIndex] ? (
                      <>
                        <ProfileImage driver={drivers[currentDriverIndex]} size="w-6 h-6" />
                        <span className={`font-semibold ${stintRunning ? 'text-green-600' : 'text-gray-800'}`}>
                          {drivers[currentDriverIndex].name}
                          {stintRunning && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              🏁 En course
                            </span>
                          )}
                        </span>
                      </>
                    ) : (
                      <span>Aucun pilote</span>
                    )}
                    
                    {/* Indicateur de synchronisation en temps réel */}
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">Temps réel</span>
                    </div>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3 sm:mb-4">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${raceProgress}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-gray-500">
                    Temps restant : {formatTime(timeRemaining)}
                  </div>
                </div>

                {/* Contrôles */}
                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  {!stintRunning ? (
                    <button
                      onClick={startStint}
                      disabled={!drivers[currentDriverIndex]}
                      className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Démarrer relais</span>
                    </button>
                  ) : (
                    <button
                      onClick={endStint}
                      className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                    >
                      <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Terminer relais</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Derniers relais */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800 flex items-center">
                  <History className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                  Derniers relais
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {laps.slice(-5).reverse().map((lap, index) => {
                    const driver = drivers.find(d => d._id === lap.driver);
                    return (
                      <div key={lap._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                            {laps.length - index}
                          </div>
                          <div className="flex items-center space-x-2">
                            <ProfileImage driver={driver || { name: lap.driverName }} size="w-8 h-8" />
                            <div>
                              <div className="font-semibold text-gray-800">{lap.driverName}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(lap.stintEndTime).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-semibold text-gray-800">{formatTime(lap.lapTime)}</div>
                          <div className="text-sm text-gray-500">Relais</div>
                        </div>
                      </div>
                    );
                  })}
                  {laps.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>Aucun relais enregistré</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne 3 : Relais pilotes + Stats rapides */}
            <div className="lg:col-span-3 space-y-4 sm:space-y-6">
              {/* Relais par pilote */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800 flex items-center">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                  Relais par pilote
                </h3>
                <div className="space-y-3">
                  {drivers.map((driver, index) => {
                    const raceStats = currentRaceDriverStats[driver._id];
                    const lapsCount = raceStats ? raceStats.laps : 0;
                    
                    return (
                      <div 
                        key={driver._id} 
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          stintRunning 
                            ? 'opacity-50 cursor-not-allowed' // Grisé et non-cliquable pendant un relais
                            : 'cursor-pointer hover:border-gray-300' // Normal et cliquable
                        } ${
                          index === currentDriverIndex 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200'
                        }`}
                        onClick={() => !stintRunning && changeDriver(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <ProfileImage driver={driver} size="w-8 h-8" />
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: driver.color }}
                              ></div>
                              <span className="font-semibold text-gray-800">{driver.name}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-800">{lapsCount}</div>
                            <div className="text-xs text-gray-500">relais</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

       
            </div>
          </div>
        )}

        {/* Onglet Pilotes */}
        {activeTab === 'drivers' && (
          <div className="space-y-8">
            {/* Ajouter un pilote */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-blue-600" />
                Ajouter un pilote
              </h3>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  placeholder="Nom du pilote"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addDriver()}
                />
                <button
                  onClick={addDriver}
                  disabled={!newDriverName.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>

            {/* Liste des pilotes */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Pilotes ({drivers.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {drivers.map((driver) => (
                  <div key={driver._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <ProfileImage driver={driver} size="w-16 h-16" />
                          {/* Bouton pour changer l'image */}
                          <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700 transition-colors">
                            <Camera className="w-3 h-3" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, driver._id)}
                            />
                          </label>
                          {uploadingImage === driver._id && (
                            <div className="absolute inset-0 bg-white bg-opacity-75 rounded-full flex items-center justify-center">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{driver.name}</h4>
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: driver.color }}
                          ></div>
                        </div>
                      </div>
                      {drivers.length > 1 && (
                        <button
                          onClick={() => removeDriver(driver._id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Relais</span>
                        <span className="font-semibold">
                          {currentRaceDriverStats[driver._id] ? currentRaceDriverStats[driver._id].laps : 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Temps total</span>
                        <span className="font-semibold">
                          {currentRaceDriverStats[driver._id] ? formatTime(currentRaceDriverStats[driver._id].totalTime) : '00:00:00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Meilleur relais</span>
                        <span className="font-semibold">
                          {currentRaceDriverStats[driver._id] && currentRaceDriverStats[driver._id].bestLap ? 
                            formatTime(currentRaceDriverStats[driver._id].bestLap) : '--'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Moyenne</span>
                        <span className="font-semibold">
                          {currentRaceDriverStats[driver._id] && currentRaceDriverStats[driver._id].laps > 0 ? 
                            formatTime(currentRaceDriverStats[driver._id].averageLap) : '--'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {driver.profileImage && (
                        <button
                          onClick={() => removeProfileImage(driver._id)}
                          className="w-full px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          title="Supprimer l'image de profil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Onglet Statistiques */}
        {activeTab === 'stats' && (
          <div className="space-y-8">
            {/* Graphique principal des temps de relais */}
            <AdvancedChart 
              data={lapTimeDataAdvanced} 
              title="Évolution des Temps par Relais" 
              height={400}
            />

            {/* Statistiques avancées avec graphiques multiples */}
            <AdvancedStats />

            {/* Statistiques détaillées en tableau */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                Classement des pilotes
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rang</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pilote</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relais</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temps total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meilleur relais</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moyenne</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.values(currentRaceDriverStats)
                      .sort((a, b) => a.totalTime - b.totalTime)
                      .map((stats, index) => {
                        const driver = drivers.find(d => d._id === stats.driverId);
                        return (
                          <tr key={stats.driverId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div 
                                  className="w-4 h-4 rounded-full mr-3"
                                  style={{ backgroundColor: driver ? driver.color : '#6b7280' }}
                                ></div>
                                <span className="text-sm font-medium text-gray-900">{stats.driverName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stats.laps}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(stats.totalTime)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stats.bestLap ? formatTime(stats.bestLap) : '--'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {stats.laps > 0 ? formatTime(stats.averageLap) : '--'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Historique */}
        {activeTab === 'history' && (
          <div className="space-y-8">
            {/* Actions */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Historique des courses</h2>
              <button
                onClick={exportToExcel}
                disabled={!currentRace || laps.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Exporter Excel</span>
              </button>
            </div>

            {/* Liste des courses */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allRaces.map((race) => (
                <div key={race._id} className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">{race.name}</h3>
                      <p className="text-sm text-gray-600">{race.teamName}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => exportRaceToExcel(race)}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Exporter en Excel"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => loadRaceDetails(race)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Voir les détails"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDeleteRace(race)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Supprimer la course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Statut</span>
                      <span className={`font-medium ${
                        race.status === 'running' ? 'text-green-600' :
                        race.status === 'finished' ? 'text-blue-600' :
                        race.status === 'paused' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {race.status === 'running' ? 'En cours' :
                         race.status === 'finished' ? 'Terminée' :
                         race.status === 'paused' ? 'En pause' :
                         'En attente'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Durée</span>
                      <span className="font-medium">{race.duration} min</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Relais</span>
                      <span className="font-medium">{race.totalLaps}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Créée le</span>
                      <span className="font-medium">
                        {new Date(race.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  
                  {race.status === 'running' && (
                    <button
                      onClick={() => finishRace()}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Terminer la course
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onglet Paramètres */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Paramètres de course */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Paramètres de course
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la course
                  </label>
                  <input
                    type="text"
                    value={raceSettings.raceName}
                    onChange={(e) => updateRaceSettings({ raceName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'équipe
                  </label>
                  <input
                    type="text"
                    value={raceSettings.teamName}
                    onChange={(e) => updateRaceSettings({ teamName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée de course (minutes)
                  </label>
                  <input
                    type="number"
                    value={raceSettings.duration}
                    onChange={(e) => updateRaceSettings({ duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville pour la météo
                  </label>
                  <input
                    type="text"
                    value={raceSettings.city}
                    onChange={(e) => updateRaceSettings({ city: e.target.value })}
                    placeholder="Paris, Lyon, Marseille..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temps minimum par relais (minutes)
                  </label>
                  <input
                    type="number"
                    value={raceSettings.minStintTime}
                    onChange={(e) => updateRaceSettings({ minStintTime: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temps maximum par relais (minutes)
                  </label>
                  <input
                    type="number"
                    value={raceSettings.maxStintTime}
                    onChange={(e) => updateRaceSettings({ maxStintTime: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmer le reset</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir réinitialiser la course ? Toutes les données seront perdues.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={resetRace}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && raceToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer la course "{raceToDelete.name}" ? Cette action est irréversible.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteRace(raceToDelete._id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {showRaceDetails && selectedRace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Détails de la course : {selectedRace.name}</h3>
                <p className="text-gray-600 mt-1">{selectedRace.teamName}</p>
              </div>
              <button
                onClick={() => setShowRaceDetails(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium">Statut</div>
                  <div className="font-bold text-blue-800 text-lg">
                    {selectedRace.status === 'running' ? 'En cours' :
                     selectedRace.status === 'finished' ? 'Terminée' :
                     selectedRace.status === 'paused' ? 'En pause' :
                     'En attente'}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600 font-medium">Total relais</div>
                  <div className="font-bold text-green-800 text-lg">{selectedRaceLaps.length}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm text-purple-600 font-medium">Temps total</div>
                  <div className="font-bold text-purple-800 text-lg">{formatTime(selectedRace.totalTime)}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-sm text-orange-600 font-medium">Durée prévue</div>
                  <div className="font-bold text-orange-800 text-lg">{selectedRace.duration} min</div>
                </div>
              </div>

              {/* Informations temporelles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 font-medium">Créée le</div>
                  <div className="font-semibold text-gray-800">
                    {new Date(selectedRace.createdAt).toLocaleString('fr-FR')}
                  </div>
                </div>
                {selectedRace.startTime && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 font-medium">Démarrée le</div>
                    <div className="font-semibold text-gray-800">
                      {new Date(selectedRace.startTime).toLocaleString('fr-FR')}
                    </div>
                  </div>
                )}
                {selectedRace.endTime && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 font-medium">Terminée le</div>
                    <div className="font-semibold text-gray-800">
                      {new Date(selectedRace.endTime).toLocaleString('fr-FR')}
                    </div>
                  </div>
                )}
              </div>

              {/* Statistiques des pilotes */}
              {selectedRaceLaps.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                    Statistiques des pilotes
                  </h4>
                  
                  {/* Calculer les statistiques des pilotes */}
                  {(() => {
                    const driverStats = {};
                    selectedRaceLaps.forEach(lap => {
                      if (!driverStats[lap.driverName]) {
                        driverStats[lap.driverName] = {
                          name: lap.driverName,
                          laps: 0,
                          totalTime: 0,
                          lapTimes: []
                        };
                      }
                      driverStats[lap.driverName].laps++;
                      driverStats[lap.driverName].totalTime += lap.lapTime;
                      driverStats[lap.driverName].lapTimes.push(lap.lapTime);
                    });

                    const sortedDrivers = Object.values(driverStats)
                      .map(driver => ({
                        ...driver,
                        bestLap: Math.min(...driver.lapTimes),
                        averageLap: driver.totalTime / driver.laps
                      }))
                      .sort((a, b) => a.totalTime - b.totalTime);

                    return (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rang</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pilote</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relais</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temps total</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meilleur relais</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Moyenne</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {sortedDrivers.map((driver, index) => (
                              <tr key={driver.name} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {index + 1}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {driver.name}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{driver.laps}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatTime(driver.totalTime)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatTime(driver.bestLap)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatTime(driver.averageLap)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Historique détaillé des relais */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                  <History className="w-5 h-5 mr-2 text-blue-600" />
                  Historique détaillé des relais ({selectedRaceLaps.length})
                </h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedRaceLaps.length > 0 ? (
                    selectedRaceLaps.map((lap, index) => (
                      <div key={lap._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {lap.lapNumber}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{lap.driverName}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(lap.stintStartTime).toLocaleString('fr-FR')} - {new Date(lap.stintEndTime).toLocaleString('fr-FR')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-lg text-gray-800">{formatTime(lap.lapTime)}</div>
                          <div className="text-sm text-gray-600">Temps total: {formatTime(lap.totalTime)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>Aucun relais enregistré pour cette course</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistiques globales */}
              {selectedRaceLaps.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                    Statistiques globales
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatTime(Math.min(...selectedRaceLaps.map(lap => lap.lapTime)))}
                      </div>
                      <div className="text-sm text-gray-600">Meilleur relais</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatTime(selectedRaceLaps.reduce((acc, lap) => acc + lap.lapTime, 0) / selectedRaceLaps.length)}
                      </div>
                      <div className="text-sm text-gray-600">Moyenne par relais</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatTime(Math.max(...selectedRaceLaps.map(lap => lap.lapTime)))}
                      </div>
                      <div className="text-sm text-gray-600">Plus lent relais</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedRaceLaps.length}
                      </div>
                      <div className="text-sm text-gray-600">Total relais</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bouton d'export */}
              <div className="flex justify-center">
                <button
                  onClick={() => exportRaceToExcel(selectedRace)}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span>Exporter cette course en Excel</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications en temps réel */}
      <RealtimeNotifications />
      
      {/* Diagnostic Socket.IO (visible en production) */}
      {process.env.NODE_ENV === 'production' && <SocketDiagnostics />}
    </div>
  );
};

export default KartingEnduranceApp;
