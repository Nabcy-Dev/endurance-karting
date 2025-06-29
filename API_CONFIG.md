# Configuration des URLs API

## 🎯 Problème résolu

L'application tournait sur `endurance-karting-1.onrender.com` mais essayait d'accéder à l'API sur `endurance-karting.onrender.com`, causant une erreur 404.

## 🔧 Solution appliquée

### 1. **Configuration API corrigée**
- L'API utilise maintenant l'URL de production configurée : `https://endurance-karting.onrender.com/api`
- Plus de détection automatique basée sur `window.location.origin`

### 2. **Variables d'environnement**
```bash
# En production (Render)
REACT_APP_API_URL=https://endurance-karting.onrender.com/api

# En développement (local)
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. **Configuration CORS mise à jour**
Le serveur autorise maintenant :
- `https://endurance-karting-1.onrender.com` (frontend)
- `https://endurance-karting.onrender.com` (backend)
- Tous les domaines `.onrender.com`

## 🚀 URLs de déploiement

### Frontend (Application React)
- **URL principale** : `https://endurance-karting-1.onrender.com`
- **Rôle** : Interface utilisateur

### Backend (API Express)
- **URL principale** : `https://endurance-karting.onrender.com`
- **Rôle** : API REST, base de données

## 🔍 Vérification

Pour vérifier que tout fonctionne :

1. **Test de l'API** : `https://endurance-karting.onrender.com/api/test`
2. **Test de l'application** : `https://endurance-karting-1.onrender.com`

## 📝 Notes importantes

- Les deux services sont déployés séparément sur Render
- L'application frontend fait des appels API vers le backend
- La configuration CORS permet la communication entre les deux domaines
- Les variables d'environnement sont configurées dans le dashboard Render

## 🛠️ En cas de problème

1. **Vérifiez les variables d'environnement** dans Render
2. **Vérifiez les logs** des deux services
3. **Testez l'API directement** avec curl ou Postman
4. **Vérifiez la configuration CORS** dans les logs du serveur 