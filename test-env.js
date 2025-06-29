// Script de test pour vérifier la configuration des variables d'environnement
require('dotenv').config();

console.log('🔍 Test de configuration des variables d\'environnement');
console.log('==================================================');
console.log('');

// Vérifier si le fichier .env est chargé
console.log('📁 Fichier .env :');
if (process.env.MONGODB_URI) {
  console.log('✅ MONGODB_URI est défini');
  console.log(`   URI: ${process.env.MONGODB_URI.substring(0, 30)}...${process.env.MONGODB_URI.substring(process.env.MONGODB_URI.length - 20)}`);
} else {
  console.log('❌ MONGODB_URI n\'est PAS défini');
}

console.log('');

// Vérifier les autres variables importantes
console.log('🔧 Autres variables :');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'non défini'}`);
console.log(`   PORT: ${process.env.PORT || '5000 (défaut)'}`);
console.log(`   REACT_APP_API_URL: ${process.env.REACT_APP_API_URL || 'non défini'}`);

console.log('');

// Vérifier le chemin du fichier .env
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '.env');
console.log('📂 Vérification du fichier .env :');
console.log(`   Chemin: ${envPath}`);
console.log(`   Existe: ${fs.existsSync(envPath) ? '✅ Oui' : '❌ Non'}`);

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  console.log(`   Lignes de configuration: ${lines.length}`);
  
  if (lines.length > 0) {
    console.log('   Variables trouvées:');
    lines.forEach(line => {
      const [key] = line.split('=');
      console.log(`     - ${key}`);
    });
  }
}

console.log('');

// Suggestions
console.log('💡 Suggestions :');
if (!process.env.MONGODB_URI) {
  console.log('   1. Créez un fichier .env à la racine du projet');
  console.log('   2. Ajoutez la ligne : MONGODB_URI=mongodb://localhost:27017/karting-endurance');
  console.log('   3. Pour MongoDB local, assurez-vous que MongoDB est installé et démarré');
  console.log('   4. Pour MongoDB Atlas, utilisez l\'URI de connexion fourni');
} else {
  console.log('   ✅ Configuration MongoDB détectée');
  console.log('   🚀 Vous pouvez démarrer le serveur avec : npm run server');
}

console.log('');
console.log('🔗 Pour tester la connexion MongoDB, lancez : node server/server.js'); 