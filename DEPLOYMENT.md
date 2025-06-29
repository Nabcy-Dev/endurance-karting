# Guide de déploiement sur Render

## 🚀 Configuration pour Render

### Variables d'environnement à configurer dans Render

Dans votre dashboard Render, configurez ces variables d'environnement :

1. **NODE_ENV** = `production`
2. **MONGODB_URI** = `mongodb+srv://username:password@cluster.mongodb.net/karting-endurance`
3. **REACT_APP_OPENWEATHER_API_KEY** = `votre_cle_openweathermap`

### Commandes de build et start

**Build Command :**
```bash
npm install && npm run build
```

**Start Command :**
```bash
npm run server
```

## 🔧 Résolution des problèmes

### Erreur 502 Bad Gateway

Si vous rencontrez l'erreur 502 :
```
GET https://endurance-karting.onrender.com/api/test net::ERR_FAILED 502 (Bad Gateway)
```

**Solutions :**
1. **Vérifiez les logs Render** dans votre dashboard
2. **Assurez-vous que MongoDB est accessible** depuis Render
3. **Vérifiez les variables d'environnement** dans Render
4. **Redéployez l'application** manuellement

### Erreur CORS

Si vous rencontrez l'erreur CORS :
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution :** La configuration CORS a été mise à jour pour autoriser tous les domaines Render.

### Erreur React Refresh Babel

Si vous rencontrez l'erreur :
```
React Refresh Babel transform should only be enabled in development environment
```

**Solution :** Les fichiers de configuration ont été mis à jour pour résoudre ce problème :
- `.babelrc` : Configuration Babel avec environnement spécifique
- `craco.config.js` : Configuration webpack simplifiée
- `package.json` : Scripts corrigés pour Linux

### Variables d'environnement manquantes

Assurez-vous que toutes les variables d'environnement sont configurées dans Render :
- `NODE_ENV` doit être `production`
- `MONGODB_URI` doit pointer vers votre base de données MongoDB
- `REACT_APP_OPENWEATHER_API_KEY` doit être votre clé API OpenWeatherMap

### Problèmes de build

1. **Vérifiez les logs de build** dans Render
2. **Assurez-vous que toutes les dépendances sont installées**
3. **Vérifiez que la version de Node.js est compatible** (14+ recommandé)

## 📝 Étapes de déploiement

1. **Connectez votre repository GitHub** à Render
2. **Configurez les variables d'environnement** dans Render
3. **Déployez automatiquement** ou manuellement
4. **Vérifiez les logs** pour détecter les erreurs
5. **Testez l'application** une fois déployée

## 🔍 Vérification du déploiement

Après le déploiement, vérifiez que :
- ✅ L'application se charge correctement
- ✅ L'API répond aux requêtes (`/api/test`)
- ✅ La base de données est connectée
- ✅ Le widget météo fonctionne (si configuré)
- ✅ Toutes les fonctionnalités sont opérationnelles

## 🆘 Dépannage avancé

### Vérifier les logs Render

1. Allez dans votre dashboard Render
2. Sélectionnez votre service
3. Cliquez sur "Logs"
4. Vérifiez les erreurs dans les logs de build et de runtime

### Tester l'API manuellement

Testez votre API avec curl :
```bash
curl https://votre-app.onrender.com/api/test
```

### Vérifier la connexion MongoDB

Dans les logs Render, cherchez :
- `🟢 Connecté à MongoDB avec succès !`
- `❌ Erreur de connexion MongoDB`

### Redéployer manuellement

Si l'auto-déploiement ne fonctionne pas :
1. Allez dans votre dashboard Render
2. Sélectionnez votre service
3. Cliquez sur "Manual Deploy"
4. Sélectionnez "Deploy latest commit"

## 🔧 Configuration MongoDB Atlas

Si vous utilisez MongoDB Atlas :

1. **Créez un cluster** sur MongoDB Atlas
2. **Ajoutez votre IP** ou `0.0.0.0/0` pour autoriser toutes les IPs
3. **Créez un utilisateur** avec les permissions appropriées
4. **Copiez l'URI de connexion** et ajoutez-le dans Render

Format de l'URI :
```
mongodb+srv://username:password@cluster.mongodb.net/karting-endurance
```

## 🚨 Problèmes courants

### Application ne se charge pas
- Vérifiez que le build s'est terminé avec succès
- Vérifiez les logs de runtime
- Testez l'URL de l'API directement

### API ne répond pas
- Vérifiez que le serveur Express démarre correctement
- Vérifiez la connexion MongoDB
- Testez la route `/api/test`

### Erreurs de base de données
- Vérifiez l'URI MongoDB dans les variables d'environnement
- Vérifiez que MongoDB Atlas est accessible
- Vérifiez les permissions de l'utilisateur MongoDB

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs de build et de runtime dans Render
2. Consultez cette documentation
3. Vérifiez la configuration des variables d'environnement
4. Testez localement avec `npm run build` pour détecter les problèmes
5. Contactez le support Render si nécessaire 