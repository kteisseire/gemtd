import { gridToIso } from '../renderers/canvasUtils';
import { EFFECT_CONFIG } from '../config/constants';

// Calculer la position d'un ennemi sur le chemin (en coordonnées isométriques)
export const getEnemyPosition = (enemy, currentPath) => {
  if (!currentPath || enemy.pathIndex < 0 || enemy.pathIndex >= currentPath.length) return null;
  const idx = Math.floor(enemy.pathIndex);
  const nextIdx = Math.min(currentPath.length - 1, idx + 1);
  const t = enemy.pathIndex - idx;
  const p1 = currentPath[idx];
  const p2 = currentPath[nextIdx];

  // Position en coordonnées de grille (avec interpolation)
  const gridX = p1.x + 0.5 + (p2.x - p1.x) * t;
  const gridY = p1.y + 0.5 + (p2.y - p1.y) * t;

  // Convertir en coordonnées isométriques
  const { isoX, isoY } = gridToIso(gridX, gridY);
  return { x: isoX, y: isoY };
};

// Mettre a jour le mouvement d'un ennemi
export const updateEnemyMovement = (enemy, adjustedDeltaTime, currentPath) => {
  if (enemy.health <= 0 || !currentPath) return null;

  let newPathIndex = enemy.pathIndex;
  const newEffects = { ...enemy.effects };

  // STUN - Bloque le mouvement
  if (newEffects.stun > 0) {
    newEffects.stun -= adjustedDeltaTime;
  } else {
    let movement = enemy.speed * adjustedDeltaTime;
    // SLOW - Réduit la vitesse selon la config
    if (newEffects.slow > 0) {
      const slowConfig = EFFECT_CONFIG.slow;
      movement = (enemy.speed * (1 - slowConfig.speedReduction)) * adjustedDeltaTime;
      newEffects.slow -= adjustedDeltaTime;
    }
    newPathIndex = enemy.pathIndex + movement;
  }

  let newHealth = enemy.health;

  // POISON - Dégâts fixes par seconde
  if (newEffects.poison > 0) {
    const poisonConfig = EFFECT_CONFIG.poison;
    newHealth -= poisonConfig.dps * adjustedDeltaTime;
    newEffects.poison -= adjustedDeltaTime;
  }

  // DAMAGE (Brûlure) - Dégâts basés sur les dégâts initiaux
  if (newEffects.damage > 0) {
    const damagePerSecond = newEffects.damagePerTick || 0;
    newHealth -= damagePerSecond * adjustedDeltaTime;
    newEffects.damage -= adjustedDeltaTime;
  }

  // Verifier si l'ennemi a atteint la fin
  if (newPathIndex >= currentPath.length) {
    return { ...enemy, reachedEnd: true };
  }

  return {
    ...enemy,
    pathIndex: newPathIndex,
    health: newHealth,
    effects: newEffects
  };
};

// Mettre a jour un projectile et verifier la collision
export const updateProjectile = (proj, enemies, adjustedDeltaTime, currentPath) => {
  const targetEnemy = enemies.find(e => e.id === proj.targetId);

  if (!targetEnemy) {
    return { projectile: null, damage: null };
  }

  const enemyPos = getEnemyPosition(targetEnemy, currentPath);
  if (!enemyPos) {
    return { projectile: null, damage: null };
  }

  const dx = enemyPos.x - proj.x;
  const dy = enemyPos.y - proj.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Collision detectee
  if (dist < 15) {
    return {
      projectile: null,
      damage: {
        enemyId: proj.targetId,
        damage: proj.damage,
        effect: proj.effect,
        towerType: proj.towerType
      }
    };
  }

  // Avancer vers l'ennemi
  const speed = 250;
  const moveX = (dx / dist) * speed * adjustedDeltaTime;
  const moveY = (dy / dist) * speed * adjustedDeltaTime;

  return {
    projectile: { ...proj, x: proj.x + moveX, y: proj.y + moveY },
    damage: null
  };
};

// Appliquer les degats a un ennemi
export const applyDamageToEnemy = (enemy, damageInfo) => {
  const effects = damageInfo.effect.split(',');
  const hasMagic = effects.includes('magic');
  const hasCrit = effects.includes('crit');
  const isResistant = enemy.resistances && enemy.resistances.includes(damageInfo.towerType);

  // CRIT - Test de coup critique
  let isCriticalHit = false;
  if (hasCrit) {
    const critConfig = EFFECT_CONFIG.crit;
    isCriticalHit = Math.random() < critConfig.critChance;
  }

  // Si l'effet MAGIC est présent, réduire l'efficacité de la résistance
  let actualDamage = damageInfo.damage;

  // Appliquer le critique avant les résistances
  if (isCriticalHit) {
    const critConfig = EFFECT_CONFIG.crit;
    actualDamage *= critConfig.critMultiplier;
  }

  // Nouveau système de résistance:
  // - Résistance globale (défaut 10%)
  // - +20% si résistant à l'élément
  const globalResistance = enemy.global_resistance || 0.1;
  const elementalResistance = isResistant ? 0.2 : 0;
  let totalResistance = globalResistance + elementalResistance;

  // MAGIC réduit la résistance élémentaire uniquement
  if (hasMagic && isResistant) {
    const magicConfig = EFFECT_CONFIG.magic;
    totalResistance = globalResistance + (elementalResistance * (1 - magicConfig.resistancePenetration));
  }

  actualDamage = actualDamage * (1 - totalResistance);

  const newHealth = enemy.health - actualDamage;

  const newEffects = { ...enemy.effects };

  effects.forEach(eff => {
    const config = EFFECT_CONFIG[eff];
    if (!config) return;

    // SLOW - Ralentissement
    if (eff === 'slow' && config.duration) {
      newEffects.slow = config.duration;
    }
    // POISON - Dégâts fixes sur la durée
    else if (eff === 'poison' && config.duration) {
      newEffects.poison = config.duration;
    }
    // STUN - Étourdissement
    else if (eff === 'stun' && config.duration) {
      newEffects.stun = config.duration;
    }
    // DAMAGE (Brûlure) - Dégâts basés sur les dégâts de la gemme
    else if (eff === 'damage' && config.duration) {
      newEffects.damage = config.duration;
      // Stocker les dégâts par tick (30% des dégâts initiaux par seconde)
      newEffects.damagePerTick = damageInfo.damage * config.damageMultiplier;
    }
  });

  if (newHealth <= 0) {
    return { enemy: null, reward: enemy.reward * 10 };
  }

  return {
    enemy: { ...enemy, health: newHealth, effects: newEffects },
    reward: 0
  };
};

// Verifier si une tour peut tirer sur un ennemi
export const findTowerTarget = (tower, enemies, currentPath) => {
  if (tower.damage === 0) return null;

  let closestEnemy = null;
  let closestDist = Infinity;

  enemies.forEach(enemy => {
    const pos = getEnemyPosition(enemy, currentPath);
    if (!pos) return;

    const dist = Math.sqrt((pos.x - tower.x) ** 2 + (pos.y - tower.y) ** 2);

    if (dist <= tower.range && dist < closestDist) {
      closestDist = dist;
      closestEnemy = enemy;
    }
  });

  return closestEnemy;
};

// Creer un nouveau projectile
export const createProjectile = (tower, targetEnemy) => {
  return {
    id: Date.now() + Math.random(),
    x: tower.x,
    y: tower.y,
    targetId: targetEnemy.id,
    damage: tower.damage,
    effect: tower.effect,
    color: tower.color,
    towerType: tower.type
  };
};
