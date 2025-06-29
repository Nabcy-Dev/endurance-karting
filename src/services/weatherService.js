const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY ;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

class WeatherService {
  async getCurrentWeather(city) {
    try {
      // Vérifier si la clé API est configurée
      if (!API_KEY || API_KEY === 'your_api_key_here') {
        throw new Error('Clé API OpenWeatherMap non configurée. Veuillez ajouter REACT_APP_OPENWEATHER_API_KEY dans le fichier .env');
      }

      const response = await fetch(
        `${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=fr`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Clé API OpenWeatherMap invalide. Veuillez vérifier votre clé API.');
        } else if (response.status === 404) {
          throw new Error(`Ville "${city}" non trouvée. Veuillez vérifier le nom de la ville.`);
        } else if (response.status === 429) {
          throw new Error('Limite de requêtes API dépassée. Veuillez réessayer plus tard.');
        } else {
          throw new Error(`Erreur API (${response.status}): ${errorData.message || 'Erreur inconnue'}`);
        }
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur météo:', error);
      throw error;
    }
  }

  async getWeatherForecast(city) {
    try {
      // Vérifier si la clé API est configurée
      if (!API_KEY || API_KEY === 'your_api_key_here') {
        throw new Error('Clé API OpenWeatherMap non configurée');
      }

      const response = await fetch(
        `${BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=fr`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur lors de la récupération des prévisions: ${errorData.message || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur prévisions:', error);
      throw error;
    }
  }

  // Méthode améliorée pour obtenir des prévisions très détaillées
  async getDetailedForecast(city) {
    try {
      const forecast = await this.getWeatherForecast(city);
      
      // Traiter les données pour créer des intervalles très précis
      const processedForecast = this.processDetailedForecastData(forecast);
      
      return {
        current: await this.getCurrentWeather(city),
        hourly: processedForecast.hourly,
        daily: processedForecast.daily,
        alerts: forecast.alerts || []
      };
    } catch (error) {
      console.error('Erreur prévisions détaillées:', error);
      throw error;
    }
  }

  // Traitement amélioré des données de prévision avec plus de détails
  processDetailedForecastData(forecast) {
    const hourly = [];
    const daily = [];
    
    // Obtenir l'heure actuelle
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.toISOString().split('T')[0];
    
    // Grouper par jour
    const dailyGroups = {};
    
    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toISOString().split('T')[0];
      const hour = date.getHours();
      
      if (!dailyGroups[dayKey]) {
        dailyGroups[dayKey] = [];
      }
      dailyGroups[dayKey].push({
        ...item,
        hour,
        date
      });
    });

    // Créer des prévisions horaires très détaillées avec interpolation
    Object.keys(dailyGroups).forEach(dayKey => {
      const dayData = dailyGroups[dayKey];
      
      // Trier par heure
      dayData.sort((a, b) => a.hour - b.hour);
      
      // Déterminer l'heure de début pour ce jour
      let startHour = 0;
      if (dayKey === currentDay) {
        // Pour aujourd'hui, commencer à l'heure actuelle
        startHour = currentHour;
      }
      
      // Créer des prévisions pour chaque heure à partir de l'heure de début
      for (let hour = startHour; hour < 24; hour++) {
        // Trouver les deux points de données les plus proches pour l'interpolation
        const before = dayData.find(item => item.hour <= hour);
        const after = dayData.find(item => item.hour > hour);
        
        let interpolatedData;
        
        if (before && after) {
          // Interpolation linéaire entre deux points
          const weight = (hour - before.hour) / (after.hour - before.hour);
          interpolatedData = this.interpolateWeatherData(before, after, weight);
        } else if (before) {
          // Utiliser les données du point précédent
          interpolatedData = before;
        } else if (after) {
          // Utiliser les données du point suivant
          interpolatedData = after;
        } else {
          // Pas de données pour cette heure, passer
          continue;
        }
        
        // Créer la date pour cette heure
        const hourDate = new Date(dayKey);
        hourDate.setHours(hour, 0, 0, 0);
        
        // Vérifier que cette heure n'est pas dans le passé
        if (hourDate <= now) {
          continue;
        }
        
        // Calculer l'indice UV approximatif (basé sur l'heure et la saison)
        const uvIndex = this.calculateUVIndex(hour, new Date(dayKey).getMonth());
        
        // Calculer l'indice de confort
        const comfortIndex = this.calculateComfortIndex(interpolatedData.main.temp, interpolatedData.main.humidity, interpolatedData.wind.speed);
        
        // Déterminer la qualité de l'air (approximative)
        const airQuality = this.estimateAirQuality(interpolatedData.main.pressure, interpolatedData.main.humidity);
        
        hourly.push({
          time: hourDate,
          hour: hour,
          temperature: Math.round(interpolatedData.main.temp * 10) / 10, // Une décimale
          feelsLike: Math.round(interpolatedData.main.feels_like * 10) / 10,
          humidity: Math.round(interpolatedData.main.humidity),
          windSpeed: Math.round(interpolatedData.wind.speed * 3.6 * 10) / 10, // km/h avec une décimale
          windDirection: interpolatedData.wind.deg,
          windDirectionText: this.getWindDirection(interpolatedData.wind.deg),
          pressure: Math.round(interpolatedData.main.pressure),
          description: interpolatedData.weather[0].description,
          icon: interpolatedData.weather[0].icon,
          pop: Math.round(interpolatedData.pop * 100), // Probabilité de précipitation en %
          clouds: Math.round(interpolatedData.clouds.all), // Couverture nuageuse en %
          visibility: interpolatedData.visibility ? Math.round((interpolatedData.visibility / 1000) * 10) / 10 : null, // km
          uvIndex: uvIndex,
          comfortIndex: comfortIndex,
          airQuality: airQuality,
          weatherMain: interpolatedData.weather[0].main, // Type principal de météo
          weatherId: interpolatedData.weather[0].id, // ID météo pour plus de précision
          // Informations supplémentaires pour le karting
          kartingConditions: this.getKartingConditions(interpolatedData.weather[0].id, interpolatedData.wind.speed, interpolatedData.main.humidity, interpolatedData.pop),
          riskLevel: this.calculateRiskLevel(interpolatedData.weather[0].id, interpolatedData.wind.speed, interpolatedData.pop)
        });
      }
      
      // Calculer les moyennes quotidiennes détaillées
      const avgTemp = Math.round(dayData.reduce((sum, item) => sum + item.main.temp, 0) / dayData.length * 10) / 10;
      const minTemp = Math.round(Math.min(...dayData.map(item => item.main.temp)) * 10) / 10;
      const maxTemp = Math.round(Math.max(...dayData.map(item => item.main.temp)) * 10) / 10;
      const avgHumidity = Math.round(dayData.reduce((sum, item) => sum + item.main.humidity, 0) / dayData.length);
      const avgWindSpeed = Math.round(dayData.reduce((sum, item) => sum + item.wind.speed, 0) / dayData.length * 3.6 * 10) / 10;
      const avgPressure = Math.round(dayData.reduce((sum, item) => sum + item.main.pressure, 0) / dayData.length);
      const totalPop = Math.round(dayData.reduce((sum, item) => sum + item.pop, 0) / dayData.length);
      
      daily.push({
        date: new Date(dayKey),
        dayKey,
        avgTemp,
        minTemp,
        maxTemp,
        avgHumidity,
        avgWindSpeed,
        avgPressure,
        totalPop,
        description: dayData[0].weather[0].description,
        icon: dayData[0].weather[0].icon,
        hours: dayData.length,
        // Conditions générales pour la journée
        dayConditions: this.getDayConditions(dayData)
      });
    });

    return {
      hourly: hourly.slice(0, 72), // Limiter à 72 heures (3 jours)
      daily: daily.slice(0, 7) // Limiter à 7 jours
    };
  }

  // Méthode pour interpoler les données météo entre deux points
  interpolateWeatherData(before, after, weight) {
    return {
      main: {
        temp: before.main.temp + (after.main.temp - before.main.temp) * weight,
        feels_like: before.main.feels_like + (after.main.feels_like - before.main.feels_like) * weight,
        humidity: Math.round(before.main.humidity + (after.main.humidity - before.main.humidity) * weight),
        pressure: Math.round(before.main.pressure + (after.main.pressure - before.main.pressure) * weight)
      },
      wind: {
        speed: before.wind.speed + (after.wind.speed - before.wind.speed) * weight,
        deg: Math.round(before.wind.deg + (after.wind.deg - before.wind.deg) * weight)
      },
      weather: [before.weather[0]], // Garder la description météo du point le plus proche
      pop: before.pop + (after.pop - before.pop) * weight,
      clouds: {
        all: Math.round(before.clouds.all + (after.clouds.all - before.clouds.all) * weight)
      },
      visibility: before.visibility ? before.visibility + (after.visibility - before.visibility) * weight : null
    };
  }

  // Calculer l'indice UV approximatif
  calculateUVIndex(hour, month) {
    // Simulation basée sur l'heure et la saison
    const summerMonths = [5, 6, 7, 8]; // Mai à Août
    const isSummer = summerMonths.includes(month);
    const isDaytime = hour >= 6 && hour <= 18;
    
    if (!isDaytime) return 0;
    
    const peakHour = hour >= 11 && hour <= 15;
    if (isSummer && peakHour) return Math.floor(Math.random() * 3) + 6; // 6-8
    if (isSummer) return Math.floor(Math.random() * 3) + 3; // 3-5
    if (peakHour) return Math.floor(Math.random() * 2) + 2; // 2-3
    return Math.floor(Math.random() * 2) + 1; // 1-2
  }

  // Calculer l'indice de confort
  calculateComfortIndex(temp, humidity, windSpeed) {
    // Formule simplifiée de l'indice de confort
    let comfort = 0;
    
    // Effet de la température
    if (temp >= 20 && temp <= 26) comfort += 3;
    else if (temp >= 15 && temp <= 30) comfort += 2;
    else if (temp >= 10 && temp <= 35) comfort += 1;
    
    // Effet de l'humidité
    if (humidity >= 30 && humidity <= 60) comfort += 2;
    else if (humidity >= 20 && humidity <= 70) comfort += 1;
    
    // Effet du vent (rafraîchissant en été, refroidissant en hiver)
    const isSummer = new Date().getMonth() >= 5 && new Date().getMonth() <= 8;
    if (isSummer && windSpeed > 2) comfort += 1;
    else if (!isSummer && windSpeed < 5) comfort += 1;
    
    return Math.min(comfort, 5); // Échelle de 0 à 5
  }

  // Estimer la qualité de l'air
  estimateAirQuality(pressure, humidity) {
    // Estimation basée sur la pression et l'humidité
    if (pressure > 1020 && humidity < 60) return 'Excellente';
    if (pressure > 1010 && humidity < 70) return 'Bonne';
    if (pressure > 1000 && humidity < 80) return 'Modérée';
    return 'Mauvaise';
  }

  // Obtenir les conditions spécifiques au karting
  getKartingConditions(weatherId, windSpeed, humidity, pop) {
    const conditions = [];
    
    // Conditions de pluie
    if (weatherId >= 200 && weatherId < 300) conditions.push('Orage');
    if (weatherId >= 300 && weatherId < 400) conditions.push('Bruine');
    if (weatherId >= 500 && weatherId < 600) conditions.push('Pluie');
    if (weatherId >= 600 && weatherId < 700) conditions.push('Neige');
    if (weatherId >= 700 && weatherId < 800) conditions.push('Brouillard');
    
    // Conditions de vent
    if (windSpeed > 10) conditions.push('Vent fort');
    else if (windSpeed > 5) conditions.push('Vent modéré');
    else conditions.push('Vent faible');
    
    // Conditions d'humidité
    if (humidity > 80) conditions.push('Très humide');
    else if (humidity > 60) conditions.push('Humide');
    else conditions.push('Sec');
    
    // Probabilité de précipitations
    if (pop > 70) conditions.push('Risque élevé de pluie');
    else if (pop > 40) conditions.push('Risque modéré de pluie');
    else if (pop > 10) conditions.push('Risque faible de pluie');
    else conditions.push('Pas de pluie');
    
    return conditions;
  }

  // Calculer le niveau de risque pour le karting
  calculateRiskLevel(weatherId, windSpeed, pop) {
    let risk = 0;
    
    // Risque météo
    if (weatherId >= 200 && weatherId < 300) risk += 3; // Orage
    if (weatherId >= 500 && weatherId < 600 && pop > 70) risk += 2; // Forte pluie
    if (weatherId >= 600 && weatherId < 700) risk += 3; // Neige
    if (weatherId >= 700 && weatherId < 800) risk += 2; // Brouillard
    
    // Risque de vent
    if (windSpeed > 15) risk += 2;
    else if (windSpeed > 10) risk += 1;
    
    // Risque de précipitations
    if (pop > 80) risk += 2;
    else if (pop > 60) risk += 1;
    
    if (risk >= 5) return 'Élevé';
    if (risk >= 3) return 'Modéré';
    if (risk >= 1) return 'Faible';
    return 'Minimal';
  }

  // Obtenir les conditions générales de la journée
  getDayConditions(dayData) {
    const conditions = {
      rainHours: 0,
      sunnyHours: 0,
      cloudyHours: 0,
      maxWind: 0,
      minTemp: Infinity,
      maxTemp: -Infinity
    };
    
    dayData.forEach(item => {
      if (item.pop > 50) conditions.rainHours++;
      if (item.clouds < 30) conditions.sunnyHours++;
      if (item.clouds > 70) conditions.cloudyHours++;
      
      conditions.maxWind = Math.max(conditions.maxWind, item.wind.speed * 3.6);
      conditions.minTemp = Math.min(conditions.minTemp, item.main.temp);
      conditions.maxTemp = Math.max(conditions.maxTemp, item.main.temp);
    });
    
    return conditions;
  }

  getWeatherIcon(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  getWeatherDescription(weatherData) {
    if (!weatherData || !weatherData.weather || !weatherData.weather[0]) {
      return 'Météo indisponible';
    }
    return weatherData.weather[0].description;
  }

  // Méthode pour vérifier si la clé API est configurée
  isApiKeyConfigured() {
    return API_KEY && API_KEY !== 'your_api_key_here';
  }

  // Méthode pour obtenir la direction du vent
  getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  // Méthode pour formater l'heure
  formatTime(date) {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // Méthode pour formater la date
  formatDate(date) {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  }

  // Méthode pour formater la date complète
  formatFullDate(date) {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  }

  // Méthode pour obtenir le nom du jour
  getDayName(date) {
    return date.toLocaleDateString('fr-FR', { weekday: 'long' });
  }

  // Méthode pour obtenir l'icône de confort
  getComfortIcon(comfortIndex) {
    if (comfortIndex >= 4) return '😊'; // Très confortable
    if (comfortIndex >= 3) return '🙂'; // Confortable
    if (comfortIndex >= 2) return '😐'; // Acceptable
    if (comfortIndex >= 1) return '😕'; // Inconfortable
    return '😰'; // Très inconfortable
  }

  // Méthode pour obtenir la couleur du risque
  getRiskColor(riskLevel) {
    switch (riskLevel) {
      case 'Minimal': return 'text-green-600';
      case 'Faible': return 'text-yellow-600';
      case 'Modéré': return 'text-orange-600';
      case 'Élevé': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }
}

export default new WeatherService(); 