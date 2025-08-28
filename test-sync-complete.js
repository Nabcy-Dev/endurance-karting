const io = require('socket.io-client');

console.log('🧪 Test complet de synchronisation...\n');

// Simuler deux clients connectés
const client1 = io('http://localhost:5000');
const client2 = io('http://localhost:5000');

const testRaceId = 'test-sync-123';

let client1Connected = false;
let client2Connected = false;

// Client 1 - Émetteur
client1.on('connect', () => {
  console.log('🔌 Client 1 connecté:', client1.id);
  client1Connected = true;
  
  // Rejoindre la course
  client1.emit('join-race', testRaceId);
  console.log('🏁 Client 1 rejoint la course:', testRaceId);
  
  // Attendre que les deux clients soient connectés
  if (client1Connected && client2Connected) {
    startTest();
  }
});

// Client 2 - Récepteur
client2.on('connect', () => {
  console.log('🔌 Client 2 connecté:', client2.id);
  client2Connected = true;
  
  // Rejoindre la course
  client2.emit('join-race', testRaceId);
  console.log('🏁 Client 2 rejoint la course:', testRaceId);
  
  // Attendre que les deux clients soient connectés
  if (client1Connected && client2Connected) {
    startTest();
  }
});

function startTest() {
  console.log('\n🚀 Démarrage du test de synchronisation...\n');
  
  // Test 1: Démarrage de course
  setTimeout(() => {
    console.log('📋 Test 1: Démarrage de course...');
    client1.emit('race-started', {
      raceId: testRaceId,
      startTime: Date.now(),
      currentStintStart: Date.now()
    });
  }, 1000);
  
  // Test 2: Démarrage de relais
  setTimeout(() => {
    console.log('📋 Test 2: Démarrage de relais...');
    client1.emit('stint-started', {
      raceId: testRaceId,
      driverName: 'Test Driver',
      driverId: 'test-driver-123',
      timestamp: Date.now()
    });
  }, 2000);
  
  // Test 3: Émission de l'état complet
  setTimeout(() => {
    console.log('📋 Test 3: Émission de l\'état complet...');
    client1.emit('emit-race-state', {
      raceId: testRaceId,
      raceStarted: true,
      isRunning: true,
      stintRunning: true,
      currentDriverIndex: 1,
      currentLapStart: Date.now(),
      raceStartTime: Date.now(),
      timestamp: Date.now()
    });
  }, 3000);
  
  // Test 4: Fin de relais
  setTimeout(() => {
    console.log('📋 Test 4: Fin de relais...');
    client1.emit('stint-ended', {
      raceId: testRaceId,
      driverName: 'Test Driver',
      lapId: 'test-lap-123',
      lapTime: 120000,
      timestamp: Date.now()
    });
  }, 4000);
  
  // Test 5: Changement de pilote
  setTimeout(() => {
    console.log('📋 Test 5: Changement de pilote...');
    client1.emit('driver-changed', {
      raceId: testRaceId,
      driverName: 'New Driver',
      driverId: 'new-driver-456',
      timestamp: Date.now()
    });
  }, 5000);
}

// Client 2 - Écouter tous les événements
client2.on('race-started', (data) => {
  console.log('✅ Client 2 reçoit: race-started');
  console.log('   - Race ID:', data.raceId);
  console.log('   - Start Time:', data.startTime);
});

client2.on('stint-started', (data) => {
  console.log('✅ Client 2 reçoit: stint-started');
  console.log('   - Race ID:', data.raceId);
  console.log('   - Driver Name:', data.driverName);
  console.log('   - Driver ID:', data.driverId);
});

client2.on('race-state-updated', (data) => {
  console.log('✅ Client 2 reçoit: race-state-updated');
  console.log('   - Race ID:', data.raceId);
  console.log('   - Stint Running:', data.stintRunning);
  console.log('   - Current Driver Index:', data.currentDriverIndex);
});

client2.on('stint-ended', (data) => {
  console.log('✅ Client 2 reçoit: stint-ended');
  console.log('   - Race ID:', data.raceId);
  console.log('   - Driver Name:', data.driverName);
  console.log('   - Lap Time:', data.lapTime);
});

client2.on('driver-changed', (data) => {
  console.log('✅ Client 2 reçoit: driver-changed');
  console.log('   - Race ID:', data.raceId);
  console.log('   - Driver Name:', data.driverName);
  console.log('   - Driver ID:', data.driverId);
});

// Écouter les événements de salle
client2.on('user-joined-race', (data) => {
  console.log('✅ Client 2 reçoit: user-joined-race');
  console.log('   - Race ID:', data.raceId);
  console.log('   - User ID:', data.userId);
});

// Nettoyage
setTimeout(() => {
  console.log('\n🧹 Nettoyage...');
  client1.disconnect();
  client2.disconnect();
  console.log('✅ Test terminé');
  process.exit(0);
}, 7000);
