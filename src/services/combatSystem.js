import { GRID_SIZE } from '../config/constants';

// Calculer la position d'un ennemi sur le chemin
export const getEnemyPosition = (enemy, currentPath) => {
  if (!currentPath || enemy.pathIndex < 0 || enemy.pathIndex >= currentPath.length) return null;
  const idx = Math.floor(enemy.pathIndex);
  const nextIdx = Math.min(currentPath.length - 1, idx + 1);
  const t = enemy.pathIndex - idx;
  const p1 = currentPath[idx];
  const p2 = currentPath[nextIdx];
  return {
    x: p1.x * GRID_SIZE + GRID_SIZE / 2 + (p2.x - p1.x) * GRID_SIZE * t,
    y: p1.y * GRID_SIZE + GRID_SIZE / 2 + (p2.y - p1.y) * GRID_SIZE * t
  };
};

// Mettre a jour le mouvement d'un ennemi
export const updateEnemyMovement = (enemy, adjustedDeltaTime, currentPath) => {
  if (enemy.health <= 0 || !currentPath) return null;

  let newPathIndex = enemy.pathIndex;
  const newEffects = { ...enemy.effects };

  if (newEffects.stun > 0) {
    newEffects.stun -= adjustedDeltaTime;
  } else {
    let movement = enemy.speed * adjustedDeltaTime;
    if (newEffects.slow > 0) {
      movement = (enemy.speed * 0.5) * adjustedDeltaTime;
      newEffects.slow -= adjustedDeltaTime;
    }
    newPathIndex = enemy.pathIndex + movement;
  }

  let newHealth = enemy.health;
  if (newEffects.poison > 0) {
    newHealth -= 3 * adjustedDeltaTime;
    newEffects.poison -= adjustedDeltaTime;
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
  const isResistant = enemy.resistances && enemy.resistances.includes(damageInfo.towerType);
  const actualDamage = isResistant ? damageInfo.damage * 0.5 : damageInfo.damage;
  const newHealth = enemy.health - actualDamage;

  const newEffects = { ...enemy.effects };
  const effects = damageInfo.effect.split(',');
  effects.forEach(eff => {
    if (eff === 'slow') newEffects.slow = 2;
    else if (eff === 'poison') newEffects.poison = 3;
    else if (eff === 'stun') newEffects.stun = 1;
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
