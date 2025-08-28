import React, { useState } from 'react';
import { Menu, X, Flag, Users, BarChart3, History, Target, ChevronDown } from 'lucide-react';

const MobileMenu = ({ activeTab, setActiveTab, raceStarted, isRunning, stintRunning, currentTime, raceStartTime, currentLapStart, timeRemaining, raceProgress, formatTime, finishRace, setShowResetConfirm }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  const navigationTabs = [
    { id: 'course', label: 'Course', icon: Flag },
    { id: 'drivers', label: 'Pilotes', icon: Users },
    // { id: 'stats', label: 'Statistiques', icon: BarChart3 },
    { id: 'history', label: 'Historique', icon: History },
    { id: 'settings', label: 'Paramètres', icon: Target }
  ];

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setExpandedSection(null);
  };

  // Calculer le temps écoulé
  const totalElapsedTime = raceStarted && raceStartTime ? currentTime - raceStartTime : 0;
  
  // Calculer le temps du relais en cours
  const currentStintTime = stintRunning && currentLapStart > 0 ? currentTime - currentLapStart : 0;

  return (
    <>
      {/* Bouton Burger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Overlay sombre */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Menu mobile */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* En-tête du menu */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Menu</h2>
              <button
                onClick={closeMenu}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Statut de la course */}
            {raceStarted && (
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium mb-1">Temps écoulé</div>
                  <div className="text-lg font-mono font-bold text-blue-800">
                    {formatTime(totalElapsedTime)}
                  </div>
                </div>
                
                {timeRemaining > 0 && (
                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <div className="text-sm text-red-600 font-medium mb-1">Temps restant</div>
                    <div className="text-lg font-mono font-bold text-red-800">
                      {formatTime(timeRemaining)}
                    </div>
                  </div>
                )}
                
                {stintRunning && (
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="text-sm text-green-600 font-medium mb-1">Temps en course</div>
                    <div className="text-lg font-mono font-bold text-green-800">
                      {formatTime(currentStintTime)}
                    </div>
                  </div>
                )}
                
                {/* Barre de progression */}
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-sm text-gray-600 font-medium mb-2">Progression</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${raceProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{raceProgress.toFixed(1)}%</div>
                </div>
              </div>
            )}
          </div>

          {/* Boutons de contrôle - visibles sur mobile */}
          {raceStarted && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions rapides</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    finishRace();
                    closeMenu();
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-semibold"
                >
                  <span>🏁 Terminer course</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowResetConfirm(true);
                    closeMenu();
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold"
                >
                  <span>🔄 Reset</span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4">
              {navigationTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      closeMenu();
                    }}
                    className={`w-full flex items-center space-x-3 p-4 rounded-lg mb-2 transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="font-medium">{tab.label}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Pied de page */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-center text-sm text-gray-500">
              <div className="font-medium">Karting Endurance</div>
              <div className="text-xs">Version mobile optimisée</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
