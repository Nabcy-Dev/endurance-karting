# Configuration de l'API Météo OpenWeatherMap

## 🚀 Comment configurer l'API météo

### 1. Obtenir une clé API gratuite

1. **Allez sur [OpenWeatherMap](https://openweathermap.org/)**
2. **Cliquez sur "Sign Up"** pour créer un compte gratuit
3. **Confirmez votre email** (vérifiez vos spams)
4. **Connectez-vous** à votre compte
5. **Allez dans "My API Keys"** (dans le menu utilisateur)
6. **Générez une nouvelle clé API** ou utilisez celle par défaut

### 2. Configurer l'application

1. **Créez un fichier `.env`** à la racine du projet (même niveau que `package.json`)
2. **Ajoutez votre clé API** dans le fichier :

```env
# Configuration MongoDB
MONGODB_URI=mongodb+srv://noeaboucaya1612:dbA-50ace@karting-endurance.a0surj1.mongodb.net/

# Configuration serveur
PORT=5000
NODE_ENV=development

# Configuration API frontend
REACT_APP_API_URL=http://localhost:5000/api

# Configuration API météo OpenWeatherMap
REACT_APP_OPENWEATHER_API_KEY=votre_cle_api_ici
```

3. **Remplacez `votre_cle_api_ici`** par votre vraie clé API
4. **Redémarrez l'application** :

```bash
npm run dev
```

### 3. Tester la configuration

1. **Allez dans l'onglet "Paramètres"**
2. **Entrez une ville** (ex: "Paris", "Lyon", "Marseille")
3. **Vérifiez que le widget météo s'affiche** dans le panneau latéral

## 🌤️ Nouvelles fonctionnalités météo ultra-détaillées

### Prévisions heure par heure ultra-précises
Le widget météo offre maintenant des prévisions extrêmement détaillées avec des informations météorologiques très précises :

#### 📊 **Onglet "Actuel" - Informations en temps réel**
- **Météo actuelle** : Température, ressenti, conditions météorologiques
- **Pression atmosphérique** : En hectopascals (hPa) pour la précision
- **Visibilité** : Distance de visibilité en kilomètres
- **Indice UV** : Niveau d'exposition aux rayons ultraviolets
- **Qualité de l'air** : Estimation basée sur la pression et l'humidité
- **Prévisions prochaines 6 heures** : Aperçu rapide avec vent et probabilité de pluie

#### ⏰ **Onglet "Heures" - Prévisions ultra-détaillées**
- **Prévisions sur 24 heures** : Chaque heure avec précision décimale
- **Températures précises** : Avec une décimale (ex: 22.3°C)
- **Ressenti thermique** : Température ressentie avec une décimale
- **Humidité relative** : Pourcentage d'humidité pour chaque heure
- **Vitesse du vent** : En km/h avec une décimale
- **Direction du vent** : Cardinale (N, NE, E, SE, S, SO, O, NO)
- **Probabilité de précipitations** : Pourcentage exact de risque de pluie
- **Couverture nuageuse** : Pourcentage de couverture nuageuse
- **Visibilité** : Distance de visibilité en kilomètres
- **Pression atmosphérique** : En hectopascals
- **Indice de confort** : Échelle de 0 à 5 avec émojis (😊 à 😰)
- **Conditions spécifiques au karting** : Tags colorés pour chaque condition
- **Niveau de risque** : Évaluation du risque pour la pratique du karting

#### 📅 **Onglet "Jours" - Vue d'ensemble hebdomadaire**
- **Prévisions sur 7 jours** : Vue complète de la semaine
- **Températures min/max** : Avec précision décimale
- **Température moyenne** : Moyenne quotidienne précise
- **Humidité moyenne** : Pourcentage moyen quotidien
- **Vitesse du vent moyenne** : En km/h avec décimale
- **Pression moyenne** : Pression atmosphérique quotidienne
- **Probabilité de pluie** : Risque moyen de précipitations
- **Conditions de la journée** : Heures d'ensoleillement, de pluie, vent maximum

### 🏁 **Informations spécialisées pour le karting**

#### **Conditions météorologiques spécifiques**
- **Type de précipitations** : Pluie, neige, bruine, orage, brouillard
- **Intensité du vent** : Faible, modéré, fort
- **Niveau d'humidité** : Sec, humide, très humide
- **Risque de précipitations** : Faible, modéré, élevé

#### **Évaluation des risques**
- **Niveau de risque** : Minimal, Faible, Modéré, Élevé
- **Couleurs d'alerte** : Vert, Jaune, Orange, Rouge
- **Facteurs de risque** : Météo, vent, précipitations

#### **Indices de confort**
- **Échelle de confort** : 0 à 5 étoiles
- **Émojis indicatifs** : 😊 Très confortable à 😰 Très inconfortable
- **Facteurs** : Température, humidité, vitesse du vent

### 🔄 **Mise à jour automatique**
- **Actualisation toutes les 30 minutes** : Données toujours à jour
- **Synchronisation en temps réel** : Pas besoin de recharger la page
- **Gestion des erreurs** : Messages informatifs en cas de problème

### ⚠️ **Alertes météo**
- **Notifications automatiques** : Alertes officielles météo
- **Informations importantes** : Événements météo significatifs
- **Descriptions détaillées** : Explications des alertes

## 🔧 Dépannage

### Erreur "Clé API non configurée"
- Vérifiez que le fichier `.env` existe à la racine du projet
- Vérifiez que la variable `REACT_APP_OPENWEATHER_API_KEY` est correctement définie
- Redémarrez l'application après modification du fichier `.env`

### Erreur "Clé API invalide"
- Vérifiez que votre clé API est correcte
- Attendez quelques minutes après la création de la clé (activation différée)
- Vérifiez que votre compte OpenWeatherMap est activé

### Erreur "Ville non trouvée"
- Vérifiez l'orthographe de la ville
- Essayez avec le nom en anglais (ex: "London" au lieu de "Londres")
- Utilisez le nom officiel de la ville

### Erreur "Limite de requêtes dépassée"
- L'API gratuite a une limite de 1000 requêtes par jour
- Attendez quelques minutes avant de réessayer
- Considérez passer à un plan payant pour plus de requêtes

## 📊 Fonctionnalités disponibles

### ✅ **Météo en temps réel**
- Température avec ressenti
- Conditions météorologiques détaillées
- Humidité relative
- Vitesse et direction du vent
- Pression atmosphérique
- Visibilité

### ✅ **Prévisions heure par heure (24h)**
- Températures avec précision décimale
- Humidité pour chaque heure
- Vitesse du vent en km/h
- Direction du vent cardinale
- Probabilité de précipitations
- Couverture nuageuse
- Indice de confort
- Conditions spécifiques au karting
- Niveau de risque

### ✅ **Prévisions sur 7 jours**
- Températures min/max/moyennes
- Humidité moyenne quotidienne
- Vitesse du vent moyenne
- Pression atmosphérique
- Probabilité de pluie
- Conditions générales de la journée

### ✅ **Informations spécialisées**
- Indice UV approximatif
- Qualité de l'air estimée
- Indice de confort thermique
- Évaluation des risques pour le karting
- Conditions météo spécifiques

### ✅ **Interface utilisateur**
- Design moderne et intuitif
- Onglets organisés
- Informations visuelles (icônes, couleurs)
- Responsive design
- Gestion d'erreurs informative

### ✅ **Mise à jour automatique**
- Actualisation toutes les 30 minutes
- Synchronisation en temps réel
- Pas de rechargement nécessaire

## 🏁 Utilisation pour le karting

### Planification des courses
- **Vérifiez les conditions** avant de commencer une course
- **Anticipez les changements** météo pendant la session
- **Adaptez la stratégie** selon les prévisions de pluie/vent
- **Évaluez les risques** selon le niveau d'alerte

### Sécurité
- **Alertes météo** : Soyez informé des conditions dangereuses
- **Visibilité** : Vérifiez la visibilité pour la conduite
- **Vent** : Surveillez la vitesse du vent pour la stabilité
- **Niveau de risque** : Adaptez votre conduite selon l'évaluation

### Performance
- **Température** : Optimisez les performances selon la température
- **Humidité** : Adaptez la conduite selon l'humidité
- **Pression** : Surveillez la pression atmosphérique
- **Confort** : Évaluez les conditions de confort pour les pilotes

### Conditions spécifiques
- **Pluie** : Adaptez la stratégie selon l'intensité
- **Vent** : Ajustez la conduite selon la force du vent
- **Brouillard** : Réduisez la vitesse si nécessaire
- **Orage** : Évitez la pratique en cas d'orage

## 🔒 Sécurité

- La clé API est stockée côté client (dans le fichier `.env`)
- Ne partagez jamais votre clé API publiquement
- L'API gratuite est suffisante pour un usage personnel/professionnel

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez cette documentation
2. Consultez la [documentation OpenWeatherMap](https://openweathermap.org/api)
3. Contactez votre administrateur système

## 🆕 Nouvelles fonctionnalités v2.0

### Précision améliorée
- **Températures avec décimale** : Plus de précision (22.3°C au lieu de 22°C)
- **Vitesse du vent avec décimale** : Précision accrue (15.7 km/h)
- **Probabilités exactes** : Pourcentages précis de précipitations

### Informations enrichies
- **Direction du vent cardinale** : N, NE, E, SE, S, SO, O, NO
- **Couverture nuageuse** : Pourcentage de nuages
- **Visibilité** : Distance en kilomètres
- **Indice UV** : Niveau d'exposition solaire
- **Qualité de l'air** : Estimation basée sur les paramètres

### Spécialisation karting
- **Conditions spécifiques** : Tags colorés pour chaque condition
- **Évaluation des risques** : Niveaux avec codes couleur
- **Indice de confort** : Échelle visuelle avec émojis
- **Recommandations** : Adaptées à la pratique du karting 