# Configuration des Effets des Gemmes

Ce document explique comment modifier les paramètres des effets des gemmes dans le jeu.

## 📍 Fichier de Configuration

**Fichier principal:** `src/config/constants.js`
**Constante:** `EFFECT_CONFIG`

## 🔧 Effets Implémentés ✅

Tous les effets sont maintenant complètement implémentés et fonctionnels!

### 1. **SLOW** (Ralentissement) ❄️
```javascript
'slow': {
  duration: 2,           // Durée en secondes
  speedReduction: 0.5    // Réduit la vitesse de 50% (0.5 = 50%)
}
```
- **Fichiers concernés:**
  - `src/services/combatSystem.js` (ligne ~30-35)
  - `src/hooks/useGameLoop.js` (ligne ~125)

### 2. **POISON** (Poison) ☠️
```javascript
'poison': {
  duration: 3,           // Durée en secondes
  dps: 3                 // Dégâts par seconde (valeur fixe)
}
```
- **Fichiers concernés:**
  - `src/services/combatSystem.js` (ligne ~40-43)
  - `src/hooks/useGameLoop.js` (ligne ~126)

### 3. **STUN** (Étourdissement) 🗿
```javascript
'stun': {
  duration: 1,           // Durée en secondes
}
```
- **Fichiers concernés:**
  - `src/services/combatSystem.js` (ligne ~28-29)
  - `src/hooks/useGameLoop.js` (ligne ~127)

### 4. **DAMAGE** (Brûlure) 🔥
```javascript
'damage': {
  duration: 4,           // Durée en secondes
  damageMultiplier: 0.3  // 30% des dégâts initiaux par seconde
}
```
- **Exemple:** Une gemme qui fait 20 dégâts infligera `20 × 0.3 = 6 DPS` pendant 4 secondes
- **Total:** 6 DPS × 4s = 24 dégâts supplémentaires
- **Fichiers concernés:**
  - `src/services/combatSystem.js` (ligne ~46-51)
  - `src/hooks/useGameLoop.js` (ligne ~128-130)

### 5. **FAST** (Cadence+) ⚡
```javascript
'fast': {
  duration: 0,           // Permanent
  speedBonus: 0.2        // +20% de vitesse d'attaque
}
```
- **Fichiers concernés:**
  - `src/hooks/useGameLoop.js` (ligne ~182-187)
- **Fonctionnement:** Réduit le temps entre chaque tir de 20%

### 6. **MAGIC** (Magique) 🔮
```javascript
'magic': {
  duration: 0,           // Instantané
  resistancePenetration: 0.5  // Ignore 50% de la résistance
}
```
- **Fichiers concernés:**
  - `src/services/combatSystem.js` (ligne ~115-125)
  - `src/hooks/useGameLoop.js` (ligne ~142-154)
- **Fonctionnement:** Réduit l'efficacité de la résistance des ennemis de 50%

### 7. **AOE** (Zone) 💥
```javascript
'aoe': {
  duration: 0,           // Instantané
  radius: 50,            // Rayon d'effet en pixels
  damageMultiplier: 0.5  // 50% des dégâts aux ennemis secondaires
}
```
- **Fichiers concernés:**
  - `src/hooks/useGameLoop.js` (ligne ~124-143)
- **Fonctionnement:** Inflige 50% des dégâts à tous les ennemis dans un rayon de 50 pixels

### 8. **RAPID** (Rafale) 💧
```javascript
'rapid': {
  duration: 0,           // Instantané
  projectileCount: 3,    // Nombre de projectiles
  spreadAngle: 15        // Angle d'écart entre projectiles (degrés)
}
```
- **Fichiers concernés:**
  - `src/hooks/useGameLoop.js` (ligne ~193-206, 110-122)
- **Fonctionnement:** Tire 3 projectiles avec un angle de 15° entre chacun

### 9. **CRIT** (Critique) ✨
```javascript
'crit': {
  duration: 0,           // Instantané
  critChance: 0.25,      // 25% de chance de critique
  critMultiplier: 2.5    // x2.5 dégâts en critique
}
```
- **Fichiers concernés:**
  - `src/services/combatSystem.js` (ligne ~117-127)
  - `src/hooks/useGameLoop.js` (ligne ~133-141)
- **Fonctionnement:** 25% de chance d'infliger 2.5x les dégâts

### 10. **CHAIN** (Chaîne) 🌑
```javascript
'chain': {
  duration: 0,           // Instantané
  maxChains: 3,          // Nombre max de rebonds
  chainRange: 80,        // Portée du rebond en pixels
  damageReduction: 0.3   // -30% de dégâts par rebond
}
```
- **Fichiers concernés:**
  - `src/hooks/useGameLoop.js` (ligne ~145-179)
- **Fonctionnement:** Les dégâts se propagent jusqu'à 3 ennemis supplémentaires avec -30% par rebond

## 📝 Comment Modifier un Effet

### Exemple 1: Augmenter la durée du ralentissement
```javascript
// Dans src/config/constants.js
'slow': {
  duration: 3,           // ← Changer de 2 à 3 secondes
  speedReduction: 0.5
}
```

### Exemple 2: Rendre le poison plus puissant
```javascript
// Dans src/config/constants.js
'poison': {
  duration: 5,           // ← Plus longtemps
  dps: 5                 // ← Plus de dégâts
}
```

### Exemple 3: Ajuster la brûlure
```javascript
// Dans src/config/constants.js
'damage': {
  duration: 6,           // ← Brûle plus longtemps
  damageMultiplier: 0.5  // ← 50% au lieu de 30% (plus fort)
}
```

## 🎯 Impact des Modifications

### Ralentissement (slow)
- **duration ↑** → Les ennemis restent ralentis plus longtemps
- **speedReduction ↑** → Les ennemis bougent encore plus lentement (max 1.0 = 100% de ralentissement)

### Poison (poison)
- **duration ↑** → L'empoisonnement dure plus longtemps
- **dps ↑** → Plus de dégâts par seconde

### Brûlure (damage)
- **duration ↑** → La brûlure dure plus longtemps
- **damageMultiplier ↑** → Dégâts sur la durée plus élevés
  - 0.1 = 10% des dégâts/s (faible)
  - 0.3 = 30% des dégâts/s (moyen)
  - 0.5 = 50% des dégâts/s (fort)
  - 1.0 = 100% des dégâts/s (très fort)

### Étourdissement (stun)
- **duration ↑** → Les ennemis restent immobilisés plus longtemps

### Cadence+ (fast)
- **speedBonus ↑** → Augmente encore plus la cadence de tir (max 1.0 = 100% de bonus)

### Magique (magic)
- **resistancePenetration ↑** → Ignore davantage de résistance (0.5 = 50%, 1.0 = 100%)

### Zone (aoe)
- **radius ↑** → Zone d'effet plus grande
- **damageMultiplier ↑** → Dégâts de zone plus élevés

### Rafale (rapid)
- **projectileCount ↑** → Plus de projectiles par tir
- **spreadAngle ↑** → Angle de dispersion plus large

### Critique (crit)
- **critChance ↑** → Plus de chance de faire des coups critiques (max 1.0 = 100%)
- **critMultiplier ↑** → Coups critiques plus puissants

### Chaîne (chain)
- **maxChains ↑** → Plus de rebonds possibles
- **chainRange ↑** → Portée de rebond plus grande
- **damageReduction ↓** → Moins de perte de dégâts par rebond

## ⚠️ Notes Importantes

1. **Redémarrer le serveur** après modification de `constants.js`
2. **Les modifications sont instantanées** pour les nouvelles gemmes placées
3. **Les tours existantes** gardent leurs anciens paramètres jusqu'à être replacées
4. **Équilibrage:** Tester avec différentes valeurs pour trouver le bon équilibre

## 🔍 Fichiers à Modifier pour Implémenter un Nouvel Effet

1. **`src/config/constants.js`** - Ajouter la configuration
2. **`src/services/combatSystem.js`** - Ajouter la logique d'application
3. **`src/hooks/useGameLoop.js`** - Ajouter le traitement continu (si nécessaire)
