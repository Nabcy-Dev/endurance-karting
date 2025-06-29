import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Settings, AlertCircle, ChevronDown, ChevronUp, Clock, Calendar, Droplets, Gauge, Eye, Thermometer, Zap, Shield, Activity } from 'lucide-react';
import weatherService from '../services/weatherService';

const WeatherWidget = ({ city }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('current'); // 'current', 'hourly', 'daily'

  const getWeatherIcon = (weatherCode) => {
    // Codes météo OpenWeatherMap
    const iconMap = {
      '01': Sun,      // Ciel dégagé
      '02': Cloud,    // Peu nuageux
      '03': Cloud,    // Nuageux
      '04': Cloud,    // Très nuageux
      '09': CloudRain, // Averses
      '10': CloudRain, // Pluie
      '11': CloudRain, // Orage
      '13': CloudSnow, // Neige
      '50': Wind      // Brouillard
    };
    
    const code = weatherCode.substring(0, 2);
    return iconMap[code] || Cloud;
  };

  const fetchWeather = async () => {
    if (!city) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await weatherService.getDetailedForecast(city);
      setWeatherData(data);
    } catch (err) {
      setError(err.message);
      console.error('Erreur météo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    
    // Mettre à jour la météo toutes les 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [city]);

  const handleRetry = () => {
    fetchWeather();
  };

  const openApiConfig = () => {
    alert(`Pour configurer l'API météo :

1. Allez sur https://openweathermap.org/
2. Créez un compte gratuit
3. Générez une clé API
4. Créez un fichier .env à la racine du projet
5. Ajoutez : REACT_APP_OPENWEATHER_API_KEY=votre_cle_ici
6. Redémarrez l'application

Ou contactez votre administrateur pour configurer l'API.`);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-blue-200 rounded w-1/2 mb-4"></div>
          <div className="h-6 bg-blue-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    const isApiKeyError = error.includes('Clé API OpenWeatherMap non configurée') || 
                         error.includes('Clé API OpenWeatherMap invalide');
    
    return (
      <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Météo indisponible</h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          
          <div className="space-y-2">
            {isApiKeyError && (
              <button
                onClick={openApiConfig}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Configurer l'API</span>
              </button>
            )}
            
            <button
              onClick={handleRetry}
              className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
        <div className="text-center">
          <Cloud className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">Aucune donnée météo disponible</p>
        </div>
      </div>
    );
  }

  const { current, hourly, daily, alerts } = weatherData;
  const WeatherIcon = getWeatherIcon(current.weather[0].icon);

  // Prévisions pour les prochaines 6 heures à partir de maintenant
  const now = new Date();
  const next6Hours = hourly
    .filter(hour => hour.time > now)
    .slice(0, 6);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3">
      {/* En-tête avec météo actuelle */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Météo</h3>
          <p className="text-xs text-gray-600">{city}</p>
        </div>
        <WeatherIcon className="w-5 h-5 text-blue-600" />
      </div>
      
      {/* Météo actuelle */}
      <div className="space-y-1 mb-2">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-800">{Math.round(current.main.temp)}°C</span>
          <span className="text-xs text-gray-600">Ressenti: {Math.round(current.main.feels_like)}°C</span>
        </div>
        
        <div className="text-xs text-gray-700 capitalize">
          {current.weather[0].description}
        </div>
        
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200">
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-0.5 flex items-center justify-center">
              <Droplets className="w-3 h-3 mr-1" />
              Humidité
            </div>
            <div className="font-semibold text-gray-800 text-xs">{current.main.humidity}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 mb-0.5 flex items-center justify-center">
              <Wind className="w-3 h-3 mr-1" />
              Vent
            </div>
            <div className="font-semibold text-gray-800 text-xs">{Math.round(current.wind.speed * 3.6)} km/h</div>
          </div>
        </div>
      </div>

      {/* Bouton pour afficher/masquer les détails */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-center space-x-1 py-1 text-xs text-blue-700 hover:text-blue-800 transition-colors"
      >
        <span>Prévisions</span>
        {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Détails des prévisions */}
      {showDetails && (
        <div className="mt-2 pt-2 border-t border-blue-200">
          {/* Onglets */}
          <div className="flex space-x-1 mb-2">
            <button
              onClick={() => setActiveTab('current')}
              className={`flex-1 py-1 px-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'current' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Actuel
            </button>
            <button
              onClick={() => setActiveTab('hourly')}
              className={`flex-1 py-1 px-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'hourly' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-3 h-3 inline mr-1" />
              H
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex-1 py-1 px-1 text-xs font-medium rounded transition-colors ${
                activeTab === 'daily' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-3 h-3 inline mr-1" />
              J
            </button>
          </div>

          {/* Contenu des onglets */}
          {activeTab === 'current' && (
            <div className="space-y-2">
              {/* Informations détaillées actuelles */}
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div className="bg-white bg-opacity-50 p-1 rounded">
                  <div className="text-gray-600 mb-0.5 flex items-center">
                    <Gauge className="w-3 h-3 mr-1" />
                    Pression
                  </div>
                  <div className="font-semibold text-xs">{current.main.pressure} hPa</div>
                </div>
                <div className="bg-white bg-opacity-50 p-1 rounded">
                  <div className="text-gray-600 mb-0.5 flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    Visibilité
                  </div>
                  <div className="font-semibold text-xs">{(current.visibility / 1000).toFixed(1)} km</div>
                </div>
              </div>
              
              {/* Prévisions prochaines heures */}
              <div>
                <h4 className="text-xs font-semibold text-gray-800 mb-1">Prochaines heures</h4>
                <div className="flex space-x-1 overflow-x-auto pb-1">
                  {next6Hours.map((hour, index) => {
                    const HourIcon = getWeatherIcon(hour.icon);
                    return (
                      <div key={index} className="flex-shrink-0 bg-white bg-opacity-50 p-1 rounded text-center min-w-[50px]">
                        <div className="text-xs text-gray-600">{weatherService.formatTime(hour.time)}</div>
                        <HourIcon className="w-3 h-3 mx-auto my-0.5 text-blue-600" />
                        <div className="text-xs font-semibold">{hour.temperature}°</div>
                        <div className="text-xs text-gray-600">{hour.pop}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hourly' && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {hourly
                .filter(hour => hour.time > now)
                .slice(0, 12)
                .map((hour, index) => {
                const HourIcon = getWeatherIcon(hour.icon);
                const riskColor = weatherService.getRiskColor(hour.riskLevel);
                const comfortIcon = weatherService.getComfortIcon(hour.comfortIndex);
                
                return (
                  <div key={index} className="bg-white bg-opacity-50 p-1 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1">
                        <HourIcon className="w-3 h-3 text-blue-600" />
                        <div>
                          <div className="text-xs font-semibold">{weatherService.formatTime(hour.time)}</div>
                          <div className="text-xs text-gray-600 capitalize">{hour.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold">{hour.temperature}°C</div>
                        <div className="text-xs text-gray-600">{hour.windSpeed} km/h</div>
                      </div>
                    </div>
                    
                    {/* Détails supplémentaires */}
                    <div className="grid grid-cols-3 gap-1 text-xs">
                      <div className="text-center">
                        <div className="text-gray-600">Humidité</div>
                        <div className="font-semibold">{hour.humidity}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600">Pluie</div>
                        <div className="font-semibold">{hour.pop}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600">Confort</div>
                        <div className="font-semibold">{comfortIcon}</div>
                      </div>
                    </div>
                    
                    {/* Conditions karting */}
                    <div className="mt-1 pt-1 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex flex-wrap gap-1">
                          {hour.kartingConditions.slice(0, 1).map((condition, idx) => (
                            <span key={idx} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                              {condition}
                            </span>
                          ))}
                        </div>
                        <span className={`font-semibold ${riskColor}`}>
                          {hour.riskLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'daily' && (
            <div className="space-y-1">
              {daily.slice(0, 3).map((day, index) => {
                const DayIcon = getWeatherIcon(day.icon);
                const riskColor = weatherService.getRiskColor(day.dayConditions?.riskLevel || 'Faible');
                
                return (
                  <div key={index} className="bg-white bg-opacity-50 p-1 rounded">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1">
                        <DayIcon className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="text-xs font-semibold">{weatherService.formatDate(day.date)}</div>
                          <div className="text-xs text-gray-600 capitalize">{day.description}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-semibold">{day.avgTemp}°C</div>
                        <div className="text-xs text-gray-600">
                          {day.minTemp}° / {day.maxTemp}°
                        </div>
                      </div>
                    </div>
                    
                    {/* Statistiques quotidiennes */}
                    <div className="grid grid-cols-2 gap-1 text-xs mb-1">
                      <div className="text-center">
                        <div className="text-gray-600">Humidité</div>
                        <div className="font-semibold">{day.avgHumidity}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600">Vent</div>
                        <div className="font-semibold">{day.avgWindSpeed} km/h</div>
                      </div>
                    </div>
                    
                    {/* Conditions de la journée */}
                    {day.dayConditions && (
                      <div className="pt-1 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-1 py-0.5 bg-green-100 text-green-800 rounded">
                              {day.dayConditions.sunnyHours}h soleil
                            </span>
                            <span className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded">
                              {day.dayConditions.rainHours}h pluie
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {/* Alertes météo */}
      {alerts && alerts.length > 0 && (
        <div className="mt-2 p-1 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center space-x-1 mb-1">
            <AlertCircle className="w-3 h-3 text-yellow-600" />
            <span className="text-xs font-semibold text-yellow-800">Alertes</span>
          </div>
          {alerts.slice(0, 1).map((alert, index) => (
            <div key={index} className="text-xs text-yellow-700">
              <div className="font-medium">{alert.event}</div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        MAJ: {new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
      </div>
    </div>
  );
};

export default WeatherWidget; 