# Guide de déploiement sur Render

## 🚀 Configuration pour Render

### Variables d'environnement à configurer dans Render

Dans votre dashboard Render, configurez ces variables d'environnement :

1. **NODE_ENV** = `production`
2. **MONGODB_URI** = `mongodb+srv://username:password@cluster.mongodb.net/karting-endurance`
3. **REACT_APP_API_URL** = `https://votre-app-name.onrender.com/api`
4. **REACT_APP_OPENWEATHER_API_KEY** = `votre_cle_openweathermap`

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
- `REACT_APP_API_URL` doit être l'URL de votre application Render
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
- ✅ L'API répond aux requêtes
- ✅ La base de données est connectée
- ✅ Le widget météo fonctionne (si configuré)
- ✅ Toutes les fonctionnalités sont opérationnelles

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs de build et de runtime dans Render
2. Consultez cette documentation
3. Vérifiez la configuration des variables d'environnement
4. Testez localement avec `npm run build` pour détecter les problèmes 