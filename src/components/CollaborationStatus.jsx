import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Users, Activity, AlertCircle } from 'lucide-react';
import socketService from '../services/socketService';

const CollaborationStatus = ({ raceId }) => {
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    currentRaceId: null,
    socketId: null
  });
  const [activeUsers, setActiveUsers] = useState(0);
  const [lastActivity, setLastActivity] = useState(null);

  useEffect(() => {
    // Se connecter au service Socket.IO
    socketService.connect();

    // Écouter les changements de statut de connexion
    const updateConnectionStatus = () => {
      setConnectionStatus(socketService.getConnectionStatus());
    };

    // Écouter les événements de connexion
    socketService.on('connect', updateConnectionStatus);
    socketService.on('disconnect', updateConnectionStatus);
    socketService.on('reconnect', updateConnectionStatus);

    // Mettre à jour le statut initial
    updateConnectionStatus();

    // Rejoindre la course si elle existe
    if (raceId) {
      socketService.joinRace(raceId);
    }

    // Nettoyer lors du démontage
    return () => {
      socketService.off('connect', updateConnectionStatus);
      socketService.off('disconnect', updateConnectionStatus);
      socketService.off('reconnect', updateConnectionStatus);
    };
  }, [raceId]);

  useEffect(() => {
    if (raceId && connectionStatus.isConnected) {
      socketService.joinRace(raceId);
    }
  }, [raceId, connectionStatus.isConnected]);

  // Simuler le nombre d'utilisateurs actifs (en production, cela viendrait du serveur)
  useEffect(() => {
    if (connectionStatus.isConnected) {
      // Simuler un nombre d'utilisateurs entre 1 et 5
      setActiveUsers(Math.floor(Math.random() * 5) + 1);
      
      // Mettre à jour l'activité
      setLastActivity(new Date());
    }
  }, [connectionStatus.isConnected]);

  const getStatusColor = () => {
    if (!connectionStatus.isConnected) return 'text-red-500';
    if (activeUsers > 1) return 'text-green-500';
    return 'text-yellow-500';
  };

  const getStatusIcon = () => {
    if (!connectionStatus.isConnected) return WifiOff;
    return Wifi;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <StatusIcon className={`w-4 h-4 ${getStatusColor()}`} />
          <span className="text-sm font-medium text-gray-700">
            Collaboration
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Statut de connexion */}
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-500">
              {connectionStatus.isConnected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>

          {/* Nombre d'utilisateurs actifs */}
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3 text-blue-500" />
            <span className="text-xs text-gray-600">
              {activeUsers} utilisateur{activeUsers > 1 ? 's' : ''}
            </span>
          </div>

          {/* Activité récente */}
          {lastActivity && (
            <div className="flex items-center space-x-1">
              <Activity className="w-3 h-3 text-green-500" />
              <span className="text-xs text-gray-500">
                {lastActivity.toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Informations détaillées */}
      {connectionStatus.isConnected && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Course:</span>
              <span className="ml-1 font-medium text-gray-700">
                {connectionStatus.currentRaceId ? 'Active' : 'Aucune'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Socket ID:</span>
              <span className="ml-1 font-mono text-gray-600 text-xs">
                {connectionStatus.socketId ? 
                  connectionStatus.socketId.substring(0, 8) + '...' : 
                  'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Message d'état */}
      {!connectionStatus.isConnected && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1 text-xs text-red-600">
            <AlertCircle className="w-3 h-3" />
            <span>Mode hors ligne - Synchronisation désactivée</span>
          </div>
        </div>
      )}

      {/* Indicateur de collaboration active */}
      {connectionStatus.isConnected && activeUsers > 1 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-1 text-xs text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Collaboration active - {activeUsers} utilisateur{activeUsers > 1 ? 's' : ''} connecté{activeUsers > 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationStatus;
