# 🔄 Guide de refactoring

## ✅ Étape 1 accomplie: Extraction des modules

### Ce qui a été fait

#### 📦 Hooks personnalisés créés
- ✅ `src/hooks/useGameState.js` - État du jeu (lives, wave, score)
- ✅ `src/hooks/useTowers.js` - Gestion des tourelles
- ✅ `src/hooks/useAdmin.js` - Interface d'administration
- ✅ `src/hooks/useEnemies.js` - Ennemis et projectiles
- ✅ `src/hooks/useUI.js` - État de l'interface
- ✅ `src/hooks/index.js` - Export centralisé

#### 🧩 Composants React extraits
- ✅ `src/components/admin/FieldInputEditor.jsx` - Éditeur de champ
- ✅ `src/components/admin/EffectSelector.jsx` - Sélecteur d'effets
- ✅ `src/components/admin/EmojiSelector.jsx` - Sélecteur d'emoji
- ✅ `src/components/admin/index.js` - Export centralisé

#### 📚 Documentation
- ✅ `ARCHITECTURE.md` - Documentation complète de l'architecture

---

## 🎯 Prochaines étapes

### Étape 2: Intégrer dans TowerDefense.jsx

Pour réduire TowerDefense.jsx de ~1400 lignes à ~400 lignes:

#### 1. Remplacer les useState par les hooks

**Avant:**
```javascript
const [gameState, setGameState] = useState('menu');
const [lives, setLives] = useState(20);
const [wave, setWave] = useState(1);
const [score, setScore] = useState(0);
// ... 50+ lignes de states
```

**Après:**
```javascript
const gameState = useGameState();
const towers = useTowers();
const admin = useAdmin();
const enemies = useEnemies();
const ui = useUI();
```

#### 2. Remplacer les composants inline

**Avant:**
```javascript
{editingField && editingGem && (
  <div style={{...}}>
    {/* 80 lignes de JSX */}
  </div>
)}
```

**Après:**
```javascript
import { FieldInputEditor } from './components/admin';

<FieldInputEditor
  editingField={admin.editingField}
  fieldInputValue={admin.fieldInputValue}
  fieldInputPosition={admin.fieldInputPosition}
  onValueChange={admin.setFieldInputValue}
  onSave={handleFieldSave}
  onCancel={() => admin.setEditingField(null)}
/>
```

#### 3. Extraire les gestionnaires d'événements

Créer `src/handlers/adminHandlers.js`:
```javascript
export const createAdminHandlers = (deps) => {
  return {
    handleFieldEdit: (fieldKey, value) => { ... },
    handleGemSave: () => { ... },
    handleRecipeEdit: (recipeId) => { ... }
  };
};
```

---

## 📊 Impact attendu

### Avant refactoring
```
TowerDefense.jsx: ~1400 lignes
Tokens consommés par lecture: ~3500 tokens
Difficile à maintenir
```

### Après refactoring
```
TowerDefense.jsx: ~400 lignes
Tokens consommés par lecture: ~1000 tokens
Modules séparés: ~200 tokens chacun
Réduction totale: -70% de tokens
```

### Avantages
- ✅ **Lisibilité**: Code plus clair et organisé
- ✅ **Maintenabilité**: Chaque module a une responsabilité unique
- ✅ **Réutilisabilité**: Hooks et composants réutilisables
- ✅ **Performance**: Réduction des re-renders avec useMemo/useCallback
- ✅ **Efficacité IA**: Moins de tokens consommés pour comprendre le code

---

## 🚀 Comment utiliser les nouveaux modules

### Importer les hooks
```javascript
import { useGameState, useTowers, useAdmin } from './hooks';
```

### Importer les composants admin
```javascript
import { FieldInputEditor, EffectSelector, EmojiSelector } from './components/admin';
```

### Exemple d'utilisation
```javascript
function TowerDefense() {
  // Utiliser les hooks au lieu de multiples useState
  const gameState = useGameState();
  const towers = useTowers();
  const admin = useAdmin();

  // Utiliser les composants au lieu de JSX inline
  return (
    <>
      <canvas ref={canvasRef} />
      <FieldInputEditor {...admin} onSave={handleSave} />
      <EffectSelector {...admin} onEffectToggle={handleEffect} />
    </>
  );
}
```

---

## 📝 Notes importantes

- Les hooks existants (`useLocalStorage`, `useImages`, `useCamera`) sont déjà en place
- Les renderers (`drawGame`, `drawMenu`, etc.) restent inchangés
- Les services (`api`, `gameLogic`, `combatSystem`) restent inchangés
- Seul `TowerDefense.jsx` nécessite une refactorisation

---

## 🎓 Pour aller plus loin

Après l'intégration, considérer:

1. **TypeScript**: Ajouter des types pour meilleure autocomplétion
2. **Tests**: Tester les hooks et composants isolément
3. **Performance**: Profiler avec React DevTools
4. **State management**: Évaluer Redux/Zustand si nécessaire

---

## 🤝 Contribution

Lors de l'ajout de nouvelles fonctionnalités:

1. ✅ Utiliser les hooks existants plutôt que créer de nouveaux states
2. ✅ Créer un composant séparé si >50 lignes de JSX
3. ✅ Documenter les nouvelles fonctions/composants
4. ✅ Mettre à jour ARCHITECTURE.md si changement structurel
