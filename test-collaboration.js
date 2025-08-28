const io = require('socket.io-client');

console.log('🧪 Test de la collaboration en temps réel...\n');

// Test 1: Connexion au serveur
console.log('1️⃣ Test de connexion...');
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('✅ Connecté au serveur Socket.IO');
  console.log(`   Socket ID: ${socket.id}`);
  
  // Test 2: Rejoindre une course
  console.log('\n2️⃣ Test de rejoindre une course...');
  const testRaceId = 'test-race-123';
  socket.emit('join-race', testRaceId);
  
  // Test 3: Émettre un événement de test
  console.log('\n3️⃣ Test d\'émission d\'événement...');
  socket.emit('race-started', {
    raceId: testRaceId,
    startTime: new Date().toISOString(),
    timestamp: Date.now()
  });
  
  // Test 4: Écouter les événements
  console.log('\n4️⃣ Test d\'écoute d\'événements...');
  socket.on('race-started', (data) => {
    console.log('✅ Événement reçu:', data);
  });
  
  // Test 5: Déconnexion
  setTimeout(() => {
    console.log('\n5️⃣ Test de déconnexion...');
    socket.disconnect();
    console.log('✅ Déconnecté du serveur');
    console.log('\n🎉 Tous les tests sont passés !');
    process.exit(0);
  }, 2000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
  console.log('\n💡 Vérifiez que le serveur est démarré sur le port 5000');
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('🔌 Déconnecté du serveur');
});

// Timeout de sécurité
setTimeout(() => {
  console.error('⏰ Timeout - Le serveur ne répond pas');
  process.exit(1);
}, 10000);
