import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';
import socketService from '../services/socketService';

const SocketDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const updateDiagnostics = () => {
    const status = socketService.getConnectionStatus();
    const diag = socketService.getDiagnostics();
    setDiagnostics({ status, diag });
  };

  useEffect(() => {
    updateDiagnostics();
    
    if (autoRefresh) {
      const interval = setInterval(updateDiagnostics, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusIcon = () => {
    if (!diagnostics?.status?.isConnected) return WifiOff;
    return Wifi;
  };

  const getStatusColor = () => {
    if (!diagnostics?.status?.isConnected) return 'text-red-500';
    return 'text-green-500';
  };

  const getTransportColor = () => {
    const transport = diagnostics?.diag?.transport;
    if (transport === 'websocket') return 'text-green-600';
    if (transport === 'polling') return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getReadyStateText = () => {
    const state = diagnostics?.diag?.readyState;
    switch (state) {
      case 0: return 'Connexion...';
      case 1: return 'Connecté';
      case 2: return 'Déconnexion...';
      case 3: return 'Déconnecté';
      default: return 'Inconnu';
    }
  };

  const getReadyStateColor = () => {
    const state = diagnostics?.diag?.readyState;
    switch (state) {
      case 1: return 'text-green-600';
      case 0: return 'text-yellow-600';
      case 2: return 'text-orange-600';
      case 3: return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-40 p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        title="Diagnostic Socket.IO"
      >
        <Wifi className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Diagnostic Socket.IO</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-1 rounded ${autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}
            title={autoRefresh ? 'Arrêter auto-refresh' : 'Démarrer auto-refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {diagnostics ? (
        <div className="space-y-3 text-xs">
          {/* Statut de connexion */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Statut:</span>
            <div className="flex items-center space-x-2">
              {(() => {
                const Icon = getStatusIcon();
                return Icon ? <Icon className={`w-4 h-4 ${getStatusColor()}`} /> : null;
              })()}
              <span className={getStatusColor()}>
                {diagnostics.status.isConnected ? 'Connecté' : 'Déconnecté'}
              </span>
            </div>
          </div>

          {/* Socket ID */}
          {diagnostics.status.socketId && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Socket ID:</span>
              <span className="font-mono text-gray-800">
                {diagnostics.status.socketId.substring(0, 8)}...
              </span>
            </div>
          )}

          {/* Transport */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Transport:</span>
            <span className={`font-medium ${getTransportColor()}`}>
              {diagnostics.diag.transport || 'N/A'}
            </span>
          </div>

          {/* État de la connexion */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">État:</span>
            <span className={`font-medium ${getReadyStateColor()}`}>
              {getReadyStateText()}
            </span>
          </div>

          {/* URL du serveur */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Serveur:</span>
            <span className="font-mono text-gray-800 text-xs truncate max-w-32">
              {diagnostics.diag.url || 'N/A'}
            </span>
          </div>

          {/* Course actuelle */}
          {diagnostics.status.currentRaceId && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Course:</span>
              <span className="font-mono text-gray-800">
                {diagnostics.status.currentRaceId.substring(0, 8)}...
              </span>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex space-x-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => {
                socketService.disconnect();
                setTimeout(() => {
                  socketService.connect();
                  updateDiagnostics();
                }, 1000);
              }}
              className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              Reconnecter
            </button>
            <button
              onClick={updateDiagnostics}
              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
            >
              Actualiser
            </button>
          </div>

          {/* Informations de débogage */}
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
              Détails techniques
            </summary>
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(diagnostics.diag.opts, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
          <p>Diagnostic non disponible</p>
        </div>
      )}
    </div>
  );
};

export default SocketDiagnostics;
