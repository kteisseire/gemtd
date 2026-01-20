# Changelog - Gem Tower Defense

## Version actuelle

### Fonctionnalités principales

#### Menu contextuel amélioré
- **Menu contextuel universel** : Fonctionne pour les gemmes temporaires ET les tours permanentes
- Design moderne avec carte flottante et bordures arrondies
- Position intelligente : s'ajuste automatiquement pour rester visible à l'écran

**Pour les gemmes temporaires (blanches)** :
  - 🟢 **Lancer la vague** : Conserve la gemme sélectionnée et démarre la vague
  - 🔴 **Supprimer** : Retire la gemme et libère un emplacement

**Pour les tours permanentes (colorées)** :
  - 🔴 **Supprimer** : Supprime définitivement la tour
  - Header indique "(Permanent)" pour différencier

- **Fermeture automatique** :
  - En cliquant en dehors du menu
  - Après avoir sélectionné une action
  - Au démarrage d'une vague

#### Gestion intelligente des tooltips
- Le tooltip de description des gemmes est **automatiquement masqué** quand le menu contextuel est ouvert
- Évite la superposition et garantit une lisibilité optimale
- Le tooltip réapparaît dès que le menu se ferme

#### Base de données SQLite
- Stockage des statistiques des gemmes dans une base de données
- API REST complète pour gérer les gemmes
- Outil interactif d'équilibrage (`npm run balance`)
- Rechargement à chaud : les modifications sont appliquées en rechargeant le jeu (F5)

#### Menu principal
- Écran d'accueil avec le titre du jeu
- Système de pseudo personnalisable
- Affichage du meilleur score et dernier score
- Sauvegarde automatique dans localStorage
- Effets visuels : gemmes flottantes animées en arrière-plan

### Améliorations de l'interface

- **Tooltips informatifs** sur tous les boutons de la barre d'outils
- **Effets de hover** sur les boutons du menu et du jeu
- **Feedback visuel** lors de la sélection des gemmes
- **Messages d'erreur** clairs (chemin bloqué, etc.)

### Système de jeu

- **5 gemmes maximum** par tour de préparation
- **Choix stratégique** : une seule gemme peut être conservée entre les rounds
- **Suppression flexible** : possibilité de supprimer n'importe quelle gemme temporaire
- **Tours permanentes** : suppression via sélection + bouton dans la barre d'outils
- **11 types de gemmes** différentes avec effets uniques

### Contrôles

- **Navigation caméra** : drag & drop, zoom avec molette
- **6 niveaux de zoom** disponibles
- **3 vitesses de jeu** (x1, x2, x3)
- **Pause** disponible pendant les vagues
- **Retour au menu** à tout moment

### Technique

- **Architecture moderne** : React + Vite + Tailwind CSS v4
- **Backend** : Node.js + Express + SQLite
- **Rendu** : Canvas 2D avec optimisations
- **Persistance** : localStorage pour les scores, SQLite pour les gemmes
- **Hot-reload** : Modifications visibles immédiatement

## À venir

Suggestions pour futures améliorations :
- Mode multijoueur
- Système de levels/chapitres
- Nouveaux types de gemmes
- Système d'achievements
- Classement en ligne
- Sons et musique
- Effets visuels de particules
- Mode difficile avec modificateurs

## Notes de développement

### Commandes utiles
```bash
# Démarrer le serveur backend
npm run server

# Démarrer le jeu
npm run dev

# Outil d'équilibrage des gemmes
npm run balance

# Build de production
npm run build
```

### Structure des fichiers
```
tower-defense/
├── src/
│   ├── TowerDefense.jsx    # Composant principal du jeu
│   ├── App.jsx             # Point d'entrée React
│   └── index.css           # Styles Tailwind
├── server/
│   ├── index.js            # Serveur Express + API
│   ├── database.js         # Configuration SQLite
│   ├── initData.js         # Données initiales des gemmes
│   └── balancing-tool.js   # Outil interactif d'équilibrage
├── CONTROLS.md             # Guide des contrôles
├── DATABASE.md             # Documentation de la base de données
└── CHANGELOG.md            # Ce fichier
```

## Contributeurs

- Claude Code (Assistant IA)
- Développeur principal : Kevin
