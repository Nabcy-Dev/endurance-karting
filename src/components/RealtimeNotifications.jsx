import React, { useState, useEffect } from 'react';
import { Bell, X, Users, Play, Pause, RotateCcw, Trophy, Settings, UserPlus, UserMinus } from 'lucide-react';
import socketService from '../services/socketService';

const RealtimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Écouter les événements de collaboration
    const handleRaceStarted = (data) => {
      addNotification({
        id: Date.now(),
        type: 'race-started',
        title: 'Course démarrée',
        message: `La course a été démarrée par un autre utilisateur`,
        timestamp: new Date(),
        icon: Play,
        color: 'bg-green-500'
      });
    };

    const handleRaceFinished = (data) => {
      addNotification({
        id: Date.now(),
        type: 'race-finished',
        title: 'Course terminée',
        message: `La course a été terminée par un autre utilisateur`,
        timestamp: new Date(),
        icon: Trophy,
        color: 'bg-blue-500'
      });
    };

    const handleRaceReset = (data) => {
      addNotification({
        id: Date.now(),
        type: 'race-reset',
        title: 'Course réinitialisée',
        message: `La course a été réinitialisée par un autre utilisateur`,
        timestamp: new Date(),
        icon: RotateCcw,
        color: 'bg-orange-500'
      });
    };

    const handleStintStarted = (data) => {
      addNotification({
        id: Date.now(),
        type: 'stint-started',
        title: 'Relais démarré',
        message: `${data.driverName} a démarré un relais`,
        timestamp: new Date(),
        icon: Play,
        color: 'bg-green-500'
      });
    };

    const handleStintEnded = (data) => {
      addNotification({
        id: Date.now(),
        type: 'stint-ended',
        title: 'Relais terminé',
        message: `${data.driverName} a terminé son relais`,
        timestamp: new Date(),
        icon: Pause,
        color: 'bg-red-500'
      });
    };

    const handleDriverChanged = (data) => {
      addNotification({
        id: Date.now(),
        type: 'driver-changed',
        title: 'Pilote changé',
        message: `Le pilote actuel est maintenant ${data.driverName}`,
        timestamp: new Date(),
        icon: Users,
        color: 'bg-purple-500'
      });
    };

    const handleDriverAdded = (data) => {
      addNotification({
        id: Date.now(),
        type: 'driver-added',
        title: 'Pilote ajouté',
        message: `${data.driverName} a été ajouté à l'équipe`,
        timestamp: new Date(),
        icon: UserPlus,
        color: 'bg-green-500'
      });
    };

    const handleDriverRemoved = (data) => {
      addNotification({
        id: Date.now(),
        type: 'driver-removed',
        title: 'Pilote supprimé',
        message: `Un pilote a été supprimé de l'équipe`,
        timestamp: new Date(),
        icon: UserMinus,
        color: 'bg-red-500'
      });
    };

    const handleRaceSettingsUpdated = (data) => {
      addNotification({
        id: Date.now(),
        type: 'race-settings-updated',
        title: 'Paramètres mis à jour',
        message: `Les paramètres de course ont été modifiés`,
        timestamp: new Date(),
        icon: Settings,
        color: 'bg-yellow-500'
      });
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
    };
  }, []);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Garder max 5 notifications
    setIsVisible(true);
    
    // Auto-hide après 5 secondes
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notifications.length <= 1) {
      setIsVisible(false);
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setIsVisible(false);
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => {
        const Icon = notification.icon;
        return (
          <div
            key={notification.id}
            className={`${notification.color} text-white rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out`}
          >
            <div className="flex items-start space-x-3">
              <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm">{notification.title}</h4>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm mt-1 opacity-90">{notification.message}</p>
                <div className="text-xs opacity-75 mt-2">
                  {notification.timestamp.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {notifications.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={clearAllNotifications}
            className="text-xs text-gray-500 hover:text-gray-700 bg-white rounded px-2 py-1 shadow-sm transition-colors"
          >
            Effacer tout
          </button>
        </div>
      )}
    </div>
  );
};

export default RealtimeNotifications;
