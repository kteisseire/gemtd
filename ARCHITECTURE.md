# 🏗️ Architecture du projet Gem Tower Defense

## 📋 Vue d'ensemble

Application de Tower Defense développée en React avec Canvas pour le rendu graphique et une API backend Node.js/Express avec SQLite.

---

## 📁 Structure des dossiers

```
tower-defense/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   └── admin/          # Composants de l'interface admin
│   │       ├── FieldInputEditor.jsx   # Éditeur de champ inline
│   │       ├── EffectSelector.jsx     # Sélecteur d'effets multi-choix
│   │       └── EmojiSelector.jsx      # Sélecteur d'emoji
│   │
│   ├── hooks/              # Hooks React personnalisés
│   │   ├── useGameState.js     # État global du jeu (vies, wave, score)
│   │   ├── useTowers.js        # Gestion des tourelles
│   │   ├── useAdmin.js         # Interface d'administration
│   │   ├── useEnemies.js       # Ennemis et projectiles
│   │   ├── useUI.js            # État de l'interface (hover, menu)
│   │   ├── useLocalStorage.js  # Persistance locale (pseudo, scores)
│   │   ├── useImages.js        # Chargement des images
│   │   └── useCamera.js        # Gestion caméra et zoom
│   │
│   ├── renderers/          # Fonctions de rendu Canvas
│   │   ├── drawGame.js         # Rendu du jeu (tours, ennemis)
│   │   ├── drawMenu.js         # Menu principal + leaderboard
│   │   ├── drawAdmin.js        # Interface d'administration
│   │   ├── drawOverlays.js     # Tooltips et overlays
│   │   ├── drawToolbar.js      # Barre d'outils en jeu
│   │   └── drawButton.js       # Boutons stylisés
│   │
│   ├── services/           # Logique métier
│   │   ├── api.js              # Appels API (gems, recipes, leaderboard)
│   │   ├── gameLogic.js        # Logique de jeu (placement, vagues)
│   │   └── combatSystem.js     # Système de combat (ciblage, tirs)
│   │
│   ├── config/             # Configuration
│   │   └── constants.js        # Constantes du jeu
│   │
│   ├── TowerDefense.jsx    # Composant principal (à refactorer ~1400 lignes → ~400)
│   └── main.jsx            # Point d'entrée React
│
├── server/                 # Backend Node.js
│   ├── database.js            # Configuration SQLite
│   ├── index.js               # API Express
│   ├── initData.js            # Données initiales
│   ├── check-db.js            # Outil debug BDD
│   └── add-test-scores.js     # Scores de test
│
└── public/                # Assets statiques
    └── images/            # Images du jeu
```

---

## 🔄 Flux de données

### 1. Initialisation
```
main.jsx → TowerDefense.jsx → useEffect()
    ↓
fetchGems(), fetchRecipes(), fetchLeaderboard()
    ↓
API (localhost:3001) → SQLite (game.db)
```

### 2. Boucle de jeu (game loop)
```
gameState === 'wave' → requestAnimationFrame
    ↓
updateEnemies() → checkCollisions() → updateProjectiles()
    ↓
attackEnemies() → createProjectiles()
    ↓
drawGame() → Canvas rendering
```

### 3. Actions utilisateur
```
handleCanvasClick() → detectTarget()
    ↓
Menu: startNewGame()
Preparation: placeTower() / openContextMenu()
Wave: pause/resume
Admin: editGem() / createRecipe()
    ↓
Update state → Re-render
```

---

## 🎮 États principaux

### GameState
```javascript
'menu'        // Menu principal
'preparation' // Placement des gemmes
'wave'        // Vague en cours
'paused'      // Jeu en pause
'gameOver'    // Fin de partie
```

### Données clés
```javascript
// Jeu
lives: number         // Vies restantes (défaut: 20)
wave: number          // Vague actuelle
score: number         // Score total
placementCount: number // Gemmes placées (max: 5)

// Tourelles
towers: Tower[]       // Gemmes permanentes (post-vague)
tempTowers: Tower[]   // Gemmes temporaires (en préparation)

// Ennemis
enemies: Enemy[]      // Ennemis actifs
projectiles: Projectile[] // Projectiles en vol

// Admin
gemTypes: Object      // Types de gemmes {ID: GemData}
fusionRecipes: Recipe[] // Recettes de fusion
```

---

## 🔌 API Backend

### Endpoints

#### Gemmes
- `GET /api/gems` - Liste toutes les gemmes
- `GET /api/gems/:id` - Une gemme spécifique
- `POST /api/gems` - Créer une gemme
- `PUT /api/gems/:id` - Modifier une gemme
- `DELETE /api/gems/:id` - Supprimer une gemme

#### Recettes
- `GET /api/recipes` - Liste toutes les recettes
- `POST /api/recipes` - Créer une recette
- `PUT /api/recipes/:id` - Modifier une recette
- `DELETE /api/recipes/:id` - Supprimer une recette

#### Leaderboard
- `GET /api/leaderboard` - Top 10 scores
- `POST /api/leaderboard` - Soumettre un score

---

## 🎨 Système de rendu

### Canvas Layout
```
┌─────────────────────────────────────┐
│ Toolbar (50px)                       │ drawToolbar()
├─────────────────────────────────────┤
│                                      │
│                                      │
│     Game World (Canvas)              │ drawGame()
│     - Grid: 24 cols × 16 rows        │
│     - Cell size: 50px                │
│                                      │
│                                      │
├─────────────────────────────────────┤
│ Overlays (tooltips, menus)           │ drawOverlays()
└─────────────────────────────────────┘
```

### Couches de rendu (ordre)
1. **Background** - Herbe + grille
2. **Path** - Chemin des ennemis
3. **Portals** - Spawn, checkpoints, goal
4. **Towers** - Gemmes placées
5. **Enemies** - Ennemis en mouvement
6. **Projectiles** - Tirs
7. **Overlays** - UI, tooltips, menus

---

## 🗄️ Base de données (SQLite)

### Tables

#### `gems`
```sql
id TEXT PRIMARY KEY          -- Ex: "EMERALD", "RUBY"
name TEXT                    -- "Émeraude", "Rubis"
color TEXT                   -- Couleur hex: "#10b981"
damage INTEGER               -- Dégâts de base
speed INTEGER                -- Vitesse d'attaque (ms)
range INTEGER                -- Portée
effect TEXT                  -- Effets (comma-separated)
icon TEXT                    -- Emoji: "💎"
is_droppable INTEGER (0/1)   -- Drop aléatoire
is_base INTEGER (0/1)        -- Gemme de base
```

#### `fusion_recipes`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
result_gem_id TEXT           -- Gemme résultante
required_gems TEXT           -- Ingrédients (comma-separated)
min_count INTEGER            -- Nombre minimum requis
```

#### `leaderboard`
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
pseudo TEXT                  -- Nom du joueur
score INTEGER                -- Score obtenu
wave INTEGER                 -- Vague atteinte
created_at DATETIME          -- Date de soumission
```

---

## 🔧 Hooks personnalisés

### `useGameState()`
Gère l'état global du jeu
```javascript
const {
  gameState, lives, wave, score,
  setGameState, resetGame, goToMenu
} = useGameState();
```

### `useTowers()`
Gère les tourelles
```javascript
const {
  towers, tempTowers,
  setTowers, deleteTower, clearTempTowers
} = useTowers();
```

### `useAdmin()`
Gère l'interface admin
```javascript
const {
  adminPage, editingGem,
  showColorPicker, showRecipeEditor,
  setAdminPage, setEditingGem
} = useAdmin();
```

---

## 🎯 Points d'optimisation

### Problèmes identifiés
1. **TowerDefense.jsx trop volumineux** (~1400 lignes)
   - ✅ Hooks extraits
   - ✅ Composants admin séparés
   - ⏳ Gestionnaires d'événements à extraire
   - ⏳ Logique de fusion à déplacer

2. **Re-renders inutiles**
   - Utiliser `useMemo` pour calculs coûteux
   - `useCallback` pour fonctions passées en props

3. **Performances Canvas**
   - Grass cache déjà implémenté ✅
   - Considérer offscreen canvas pour layers statiques

---

## 📝 Conventions de code

### Nommage
- **Composants**: PascalCase (`FieldInputEditor`)
- **Hooks**: camelCase avec prefix `use` (`useGameState`)
- **Fonctions**: camelCase (`drawTower`, `checkCollision`)
- **Constantes**: UPPER_SNAKE_CASE (`GRID_SIZE`)

### Fichiers
- Un composant = un fichier
- Exports nommés pour hooks/utils
- Export default pour composants principaux

---

## 🚀 Pour démarrer

```bash
# Backend (terminal 1)
cd server
npm install
node index.js

# Frontend (terminal 2)
npm install
npm run dev
```

Ou utiliser `START.bat` qui lance les deux.

---

## 📚 Ressources

- React: https://react.dev
- Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- Better-SQLite3: https://github.com/WiseLibs/better-sqlite3
- Emoji Picker React: https://www.npmjs.com/package/emoji-picker-react
