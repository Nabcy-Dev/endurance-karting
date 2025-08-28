# 🔧 Dépannage de la Collaboration en Temps Réel

## 🚨 Problèmes Courants et Solutions

### 1. **Aucune synchronisation entre les onglets**

#### Symptômes :
- Les actions d'un onglet ne sont pas visibles dans l'autre
- Le widget de collaboration affiche "Déconnecté"
- Pas de notifications en temps réel

#### Solutions :
1. **Vérifiez que le serveur est démarré** :
   ```bash
   cd server
   npm start
   ```
   Vous devriez voir : `🔌 Socket.IO activé pour la collaboration en temps réel`

2. **Vérifiez la console du navigateur** :
   - Appuyez sur F12
   - Onglet Console
   - Cherchez les messages commençant par 🔌

3. **Redémarrez le client React** :
   ```bash
   npm start
   ```

### 2. **Le pilote sélectionné n'est pas synchronisé**

#### Symptômes :
- Un utilisateur sélectionne le Pilote C et lance un relais
- L'autre utilisateur voit le relais en cours mais pas avec le bon pilote
- L'index du pilote actuel n'est pas mis à jour

#### Solutions :
1. **Vérifiez que les deux onglets sont sur la même course** :
   - L'ID de course doit être identique
   - Vérifiez dans la console : `🏁 Rejoint la course: [race-id]`

2. **Forcez la synchronisation** :
   - Fermez et rouvrez le second onglet
   - Ou rechargez la page (F5)

3. **Vérifiez les logs du serveur** :
   - Dans le terminal du serveur, vous devriez voir :
   ```
   🔌 Client connecté: [socket-id]
   🏁 Client [socket-id] a rejoint la course [race-id]
   🔄 État de la course émis pour [race-id]
   ```

### 3. **Connexion Socket.IO échoue**

#### Symptômes :
- Erreur dans la console : "Socket.IO non connecté"
- Widget de collaboration affiche "Mode hors ligne"
- Pas de communication en temps réel

#### Solutions :
1. **Vérifiez les ports** :
   - Port 5000 : Serveur backend + Socket.IO
   - Port 3000 : Client React
   - Vérifiez qu'aucun autre service n'utilise ces ports

2. **Vérifiez le firewall** :
   - Autorisez Node.js dans le pare-feu Windows
   - Vérifiez les paramètres antivirus

3. **Testez la connexion** :
   ```bash
   node test-collaboration.js
   ```

### 4. **Notifications ne s'affichent pas**

#### Symptômes :
- Aucune notification en haut à droite
- Actions effectuées mais pas de feedback visuel

#### Solutions :
1. **Vérifiez que le composant est monté** :
   - Le composant `RealtimeNotifications` doit être présent dans le DOM
   - Vérifiez qu'il n'y a pas d'erreurs JavaScript

2. **Vérifiez les permissions de notification** :
   - Certains navigateurs bloquent les notifications
   - Vérifiez dans les paramètres du navigateur

3. **Forcez l'affichage** :
   - Effectuez une action (démarrage de relais)
   - Vérifiez la console pour les logs de notification

### 5. **Déconnexions fréquentes**

#### Symptômes :
- Connexion qui se coupe régulièrement
- Widget qui passe de "Connecté" à "Déconnecté"
- Synchronisation qui s'arrête

#### Solutions :
1. **Vérifiez la stabilité réseau** :
   - Connexion Internet stable
   - Pas de proxy ou VPN qui bloque WebSocket

2. **Augmentez les timeouts** :
   - Dans `socketService.js`, modifiez :
   ```javascript
   timeout: 30000, // 30 secondes au lieu de 10
   reconnectionAttempts: 10 // Plus de tentatives
   ```

3. **Vérifiez la mémoire** :
   - Fermez les onglets inutilisés
   - Redémarrez le navigateur si nécessaire

## 🔍 Diagnostic Avancé

### Logs du Serveur
```bash
# Démarrez le serveur en mode debug
cd server
DEBUG=socket.io:* npm start
```

### Logs du Client
```javascript
// Dans la console du navigateur
localStorage.setItem('debug', 'socket.io-client:*');
// Puis rechargez la page
```

### Test de Connectivité
```bash
# Test de connexion TCP
telnet localhost 5000

# Test de WebSocket
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" http://localhost:5000/socket.io/
```

## 📱 Test sur Différents Appareils

### Même Réseau Local
1. **Ordinateur 1** : `http://192.168.1.100:3000`
2. **Ordinateur 2** : `http://192.168.1.101:3000`
3. **Serveur** : `http://192.168.1.100:5000`

### Configuration CORS
Si vous testez sur des appareils différents, ajoutez l'IP dans `server/server.js` :
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://192.168.1.100:3000',
  'http://192.168.1.101:3000'
];
```

## 🚀 Redémarrage Complet

Si rien ne fonctionne, suivez cette procédure :

1. **Arrêtez tous les processus** :
   ```bash
   taskkill /f /im node.exe
   ```

2. **Nettoyez les modules** :
   ```bash
   rm -rf node_modules
   rm -rf server/node_modules
   npm install
   cd server && npm install
   ```

3. **Redémarrez dans l'ordre** :
   ```bash
   # Terminal 1 : Serveur
   cd server && npm start
   
   # Terminal 2 : Client
   npm start
   ```

4. **Testez la connexion** :
   ```bash
   node test-collaboration.js
   ```

## 📞 Support

### Informations à fournir :
- Version de Node.js : `node --version`
- Version de npm : `npm --version`
- Système d'exploitation
- Navigateur et version
- Logs d'erreur complets
- Étapes pour reproduire le problème

### Ressources utiles :
- [Documentation Socket.IO](https://socket.io/docs/)
- [Guide de débogage WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Dépannage CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

**💡 Conseil** : Commencez toujours par vérifier que le serveur est démarré et que les ports sont libres !
