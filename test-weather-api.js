// Script de test pour l'API météo OpenWeatherMap
// Utilisation : node test-weather-api.js VOTRE_CLE_API

const API_KEY = process.argv[2] || 'your_api_key_here';
const CITY = 'Paris';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

async function testWeatherAPI() {
  console.log('🌤️  Test de l\'API météo OpenWeatherMap');
  console.log('=====================================');
  console.log(`Clé API: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}`);
  console.log(`Ville test: ${CITY}`);
  console.log('');

  try {
    const response = await fetch(
      `${BASE_URL}/weather?q=${encodeURIComponent(CITY)}&appid=${API_KEY}&units=metric&lang=fr`
    );
    
    console.log(`Status de la réponse: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ Erreur API:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${errorData.message || 'Erreur inconnue'}`);
      
      if (response.status === 401) {
        console.log('💡 Solution: Vérifiez que votre clé API est correcte');
      } else if (response.status === 404) {
        console.log('💡 Solution: Vérifiez le nom de la ville');
      } else if (response.status === 429) {
        console.log('💡 Solution: Limite de requêtes dépassée, attendez quelques minutes');
      }
    } else {
      const data = await response.json();
      console.log('✅ API fonctionne correctement !');
      console.log(`   Ville: ${data.name}`);
      console.log(`   Température: ${data.main.temp}°C`);
      console.log(`   Conditions: ${data.weather[0].description}`);
      console.log(`   Humidité: ${data.main.humidity}%`);
      console.log(`   Vent: ${Math.round(data.wind.speed * 3.6)} km/h`);
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:');
    console.log(`   ${error.message}`);
  }
}

if (!API_KEY || API_KEY === 'your_api_key_here') {
  console.log('❌ Clé API non fournie');
  console.log('💡 Utilisation: node test-weather-api.js VOTRE_CLE_API');
} else {
  testWeatherAPI();
} 