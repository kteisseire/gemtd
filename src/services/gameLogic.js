import { GRID_SIZE, ENEMY_EMOJIS, SPAWN_POINT, GOAL_POINT, isInSpawnZone, isInGoalZone, isInCheckpointZone } from '../config/constants';
import { findPath } from './pathfinding';
import { gridToIso } from '../renderers/canvasUtils';

// Creer les ennemis d'une nouvelle vague
export const createWaveEnemies = (wave, gemTypes, previousWaveHealth, enemyIdCounterRef) => {
  const enemyCount = Math.floor(10 + Math.random() * 11);
  const newEnemies = [];
  const waveEmoji = ENEMY_EMOJIS[Math.floor(Math.random() * ENEMY_EMOJIS.length)];
  const gemTypeKeys = Object.keys(gemTypes).filter(key => key !== 'BASE');
  const shuffled = [...gemTypeKeys].sort(() => Math.random() - 0.5);
  const resistance1 = shuffled[0];
  const resistance2 = shuffled[1];
  const speedMultiplier = 0.75 + Math.random() * 1.25;
  const baseSpeed = 0.4 + wave * 0.06;
  const waveSpeed = baseSpeed * speedMultiplier;
  const baseHealth = 60 + wave * 30;
  const healthMultiplier = 2.5 - speedMultiplier;
  let waveHealth = Math.floor(baseHealth * healthMultiplier);

  if (previousWaveHealth > 0 && waveHealth <= previousWaveHealth) {
    waveHealth = previousWaveHealth + Math.floor(20 + wave * 8);
  }

  for (let i = 0; i < enemyCount; i++) {
    newEnemies.push({
      id: enemyIdCounterRef.current++,
      pathIndex: -i * 2.5,
      health: waveHealth,
      maxHealth: waveHealth,
      speed: waveSpeed,
      speedMultiplier: speedMultiplier,
      reward: 10 + wave * 2,
      effects: {},
      emoji: waveEmoji,
      resistances: [resistance1, resistance2]
    });
  }

  return { enemies: newEnemies, newPreviousWaveHealth: waveHealth };
};

// Verifier si on peut placer une tour a cette position
export const canPlaceTower = (gridX, gridY, towers, tempTowers) => {
  if (isInSpawnZone(gridX, gridY) || isInGoalZone(gridX, gridY) || isInCheckpointZone(gridX, gridY)) {
    return false;
  }
  const existingTower = [...towers, ...tempTowers].find(t => t.gridX === gridX && t.gridY === gridY);
  return !existingTower;
};

// Creer une nouvelle tour avec une gemme aleatoire
export const createTower = (gridX, gridY, gemTypes) => {
  const droppableGems = Object.keys(gemTypes).filter(id => gemTypes[id].is_droppable);
  if (droppableGems.length === 0) return null;

  const randomGemType = droppableGems[Math.floor(Math.random() * droppableGems.length)];
  const gemType = gemTypes[randomGemType];

  // Convertir les coordonnées de grille en coordonnées isométriques
  const { isoX, isoY } = gridToIso(gridX + 0.5, gridY + 0.5);

  return {
    id: Date.now() + Math.random(),
    gridX, gridY,
    x: isoX,
    y: isoY,
    type: randomGemType,
    level: 1,
    isTemporary: true,
    ...gemType
  };
};

// Verifier si une fusion est possible pour une tour donnee
export const checkFusionPossible = (tower, fusionRecipes, towers) => {
  if (!tower || tower.type === 'BASE') return null;

  for (const recipe of fusionRecipes) {
    const requiredGems = recipe.required_gems.split(',');

    if (!requiredGems.includes(tower.type)) continue;

    const availableRecipeGems = towers.filter(t => requiredGems.includes(t.type));

    if (availableRecipeGems.length >= recipe.min_count) {
      return {
        recipe,
        availableGems: availableRecipeGems,
        resultGemId: recipe.result_gem_id
      };
    }
  }

  return null;
};

// Executer la fusion d'une gemme
export const performFusion = (selectedTower, fusionInfo, towers, gemTypes) => {
  const updatedTowers = [...towers];
  const selectedIndex = updatedTowers.findIndex(t => t.id === selectedTower.id);

  if (selectedIndex === -1) return towers;

  const fusedGemType = gemTypes[fusionInfo.resultGemId];

  updatedTowers[selectedIndex] = {
    id: selectedTower.id,
    gridX: selectedTower.gridX,
    gridY: selectedTower.gridY,
    x: selectedTower.x,
    y: selectedTower.y,
    type: fusionInfo.resultGemId,
    level: selectedTower.level,
    isTemporary: false,
    ...fusedGemType
  };

  const otherRecipeGems = fusionInfo.availableGems.filter(g => g.id !== selectedTower.id);
  const shuffled = [...otherRecipeGems].sort(() => Math.random() - 0.5);
  const gemsToConvert = shuffled.slice(0, 2);

  const baseGemType = gemTypes['BASE'];
  gemsToConvert.forEach(gem => {
    const idx = updatedTowers.findIndex(t => t.id === gem.id);
    if (idx !== -1) {
      updatedTowers[idx] = {
        id: updatedTowers[idx].id,
        gridX: updatedTowers[idx].gridX,
        gridY: updatedTowers[idx].gridY,
        x: updatedTowers[idx].x,
        y: updatedTowers[idx].y,
        type: 'BASE',
        level: updatedTowers[idx].level,
        isTemporary: false,
        ...baseGemType
      };
    }
  });

  return updatedTowers;
};

// Calculer le chemin en temps reel pendant le placement
export const calculateCurrentPath = (towers, tempTowers) => {
  const allTowers = [...towers, ...tempTowers];
  const obstacles = allTowers.map(t => ({ x: t.gridX, y: t.gridY }));
  const goalCenter = { x: GOAL_POINT.x + 2, y: GOAL_POINT.y + 2 };
  const spawnCenter = { x: SPAWN_POINT.x + 2, y: SPAWN_POINT.y + 2 };
  return findPath(spawnCenter, goalCenter, obstacles);
};

// Preparer le demarrage d'une vague
export const prepareWaveStart = (towers, tempTowers, selectedTempTower, gemTypes) => {
  const confirmedTowers = tempTowers.map(tower => {
    if (tower.id === selectedTempTower) {
      return tower;
    } else {
      return { ...tower, type: 'BASE', ...gemTypes.BASE };
    }
  });

  const allTowers = [...towers, ...confirmedTowers];
  const obstacles = allTowers.map(t => ({ x: t.gridX, y: t.gridY }));
  const goalCenter = { x: GOAL_POINT.x + 2, y: GOAL_POINT.y + 2 };
  const spawnCenter = { x: SPAWN_POINT.x + 2, y: SPAWN_POINT.y + 2 };
  const path = findPath(spawnCenter, goalCenter, obstacles);

  return { allTowers, path };
};
