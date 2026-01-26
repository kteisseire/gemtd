# Tower Defense Game

Un jeu de Tower Defense développé avec React, Canvas 2D et Node.js/SQLite.

## 🎮 Fonctionnalités

- **Système de gemmes** : Différentes gemmes avec effets spéciaux (poison, gel, feu, magie, critique, etc.)
- **Fusion de gemmes** : Combinez des gemmes pour créer des tours plus puissantes
- **Types d'ennemis** : Ennemis variés avec résistances élémentaires configurables
- **Système de vagues** : Progression par vagues avec difficulté croissante
- **Leaderboard** : Classement des meilleurs scores
- **Interface d'administration** : Gestion complète des gemmes, ennemis, recettes et résistances
- **11 effets de gemmes** : POISON, FREEZE, BURN, STUN, SLOW, MAGIC, CRIT, FAST, RAPID, AOE, CHAIN

## 🚀 Installation locale

### Prérequis

- Node.js 20.19+ ou 22.12+
- npm

### Installation

```bash
# Cloner le repository
git clone <votre-repo>
cd tower-defense

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
```

L'application sera accessible sur :
- Frontend : http://localhost:5176
- API : http://localhost:3001

## 📦 Scripts disponibles

```bash
# Développement (avec hot reload)
npm run dev

# Build de production
npm run build

# Démarrer le serveur en production
npm start

# Lancer uniquement le serveur API
npm run server

# Outil de balancement (configuration des gemmes)
npm run balance
```

## 🌐 Déploiement

Ce projet est configuré pour être déployé sur **Render.com**.

Consultez le guide complet dans [DEPLOY.md](DEPLOY.md).

### Déploiement rapide

1. Poussez votre code sur GitHub/GitLab
2. Créez un nouveau Web Service sur Render.com
3. Connectez votre repository
4. Render détecte automatiquement la configuration via `render.yaml`
5. Déployez ! 🎉

## 🎯 Comment jouer

1. **Placer des tours** : Cliquez sur une gemme dans la barre d'outils, puis sur une case vide de la grille
2. **Fusionner des gemmes** : Glissez-déposez une gemme sur une autre gemme compatible
3. **Vendre une tour** : Clic droit sur une tour, puis "Vendre"
4. **Lancer les vagues** : Cliquez sur "Lancer vague" pour démarrer
5. **Objectif** : Survivez le plus longtemps possible et protégez votre base !

## 🛠️ Architecture technique

- **Frontend** : React 19 + Canvas 2D + Vite
- **Backend** : Node.js + Express
- **Base de données** : SQLite (better-sqlite3)
- **Styling** : TailwindCSS + CSS custom
- **State management** : React Hooks

### Structure du projet

```
tower-defense/
├── src/
│   ├── components/     # Composants React
│   ├── config/         # Configuration (constantes, effets)
│   ├── hooks/          # Custom hooks (game loop, handlers)
│   ├── renderers/      # Rendu canvas (jeu, admin, UI)
│   ├── services/       # API calls et logique métier
│   └── TowerDefense.jsx # Composant principal
├── server/
│   ├── database.js     # Configuration SQLite
│   ├── initData.js     # Données initiales
│   └── index.js        # Serveur Express
└── public/             # Assets statiques
```

## 🎨 Système d'effets

### Effets temporaires (debuffs)
- **POISON** : 10 DPS pendant 3 secondes
- **FREEZE** : Ralentit de 80% pendant 2 secondes
- **BURN** : 15 DPS pendant 2 secondes
- **STUN** : Immobilise pendant 1.5 secondes
- **SLOW** : Ralentit de 40% pendant 3 secondes

### Effets instantanés/permanents
- **MAGIC** : Ignore 50% des résistances élémentaires
- **CRIT** : 25% de chance de critique (×2.5 dégâts)
- **FAST** : +20% de vitesse d'attaque
- **RAPID** : Tire 3 projectiles avec angle de dispersion
- **AOE** : Dégâts de zone (50px radius, 50% dégâts)
- **CHAIN** : Les dégâts rebondissent sur 3 ennemis (-30% par rebond)

## 🔧 Administration

Accédez au mode admin depuis le menu principal. Vous pouvez :

- **Gemmes** : Créer, modifier, supprimer des types de gemmes
- **Recettes** : Configurer les combinaisons de fusion
- **Ennemis** : Gérer les types d'ennemis et leurs statistiques
- **Résistances** : Matrice de résistances ennemis × gemmes
- **Vagues** : Configurer la composition des vagues

## 📝 Licence

Ce projet est un projet personnel éducatif.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.
