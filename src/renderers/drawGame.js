import { GRID_SIZE, SPAWN_POINT, GOAL_POINT, CHECKPOINTS, ISO_TILE_WIDTH } from '../config/constants';
import { getEnemyPosition } from '../services/combatSystem';
import { gridToIso, drawIsoTile3D, drawIsoTile, drawIsoEllipse, drawIsoTileHighlight } from './canvasUtils';
import { PARTICLE_EFFECTS } from '../services/particleSystem';

// Dessiner le chemin
export const drawPath = (ctx, currentPath, zoom) => {
  if (!currentPath || currentPath.length === 0) return;

  const pathWidth = (GRID_SIZE * 0.6) / zoom;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Ombre portée du chemin
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  ctx.beginPath();
  currentPath.forEach((point, i) => {
    const { isoX, isoY } = gridToIso(point.x + 0.5, point.y + 0.5);
    if (i === 0) ctx.moveTo(isoX, isoY);
    else ctx.lineTo(isoX, isoY);
  });
  ctx.strokeStyle = '#6b5647';
  ctx.lineWidth = pathWidth;
  ctx.stroke();
  ctx.restore();

  // Bordure extérieure foncée
  ctx.beginPath();
  currentPath.forEach((point, i) => {
    const { isoX, isoY } = gridToIso(point.x + 0.5, point.y + 0.5);
    if (i === 0) ctx.moveTo(isoX, isoY);
    else ctx.lineTo(isoX, isoY);
  });
  ctx.strokeStyle = '#4a3a2a';
  ctx.lineWidth = pathWidth + 4 / zoom;
  ctx.stroke();

  // Chemin principal avec dégradé
  const firstPoint = currentPath[0];
  const lastPoint = currentPath[currentPath.length - 1];
  const { isoX: x1, isoY: y1 } = gridToIso(firstPoint.x + 0.5, firstPoint.y + 0.5);
  const { isoX: x2, isoY: y2 } = gridToIso(lastPoint.x + 0.5, lastPoint.y + 0.5);

  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, '#9b7d5f');
  gradient.addColorStop(0.5, '#a8856b');
  gradient.addColorStop(1, '#8b6f5a');

  ctx.beginPath();
  currentPath.forEach((point, i) => {
    const { isoX, isoY } = gridToIso(point.x + 0.5, point.y + 0.5);
    if (i === 0) ctx.moveTo(isoX, isoY);
    else ctx.lineTo(isoX, isoY);
  });
  ctx.strokeStyle = gradient;
  ctx.lineWidth = pathWidth;
  ctx.stroke();

  // Ligne centrale claire pour donner de la profondeur
  ctx.beginPath();
  currentPath.forEach((point, i) => {
    const { isoX, isoY } = gridToIso(point.x + 0.5, point.y + 0.5);
    if (i === 0) ctx.moveTo(isoX, isoY);
    else ctx.lineTo(isoX, isoY);
  });
  ctx.strokeStyle = 'rgba(200, 180, 160, 0.3)';
  ctx.lineWidth = pathWidth * 0.3;
  ctx.stroke();
};

// Dessiner le portail (spawn)
export const drawSpawnPortal = (ctx, portailImage, zoom) => {
  // Dessiner les 4x4 tuiles du portail en isométrique (2D plat pour éviter confusion)
  for (let dy = 0; dy < 4; dy++) {
    for (let dx = 0; dx < 4; dx++) {
      drawIsoTile(ctx, SPAWN_POINT.x + dx, SPAWN_POINT.y + dy, '#1a0a0a', 1);
    }
  }

  // Position centrale du portail en coordonnées isométriques (centre d'une zone 4x4)
  const { isoX: spawnCenterX, isoY: spawnCenterY } = gridToIso(SPAWN_POINT.x + 0.5, SPAWN_POINT.y + 0.5);

  ctx.shadowColor = 'rgba(139, 0, 0, 0.8)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  if (portailImage) {
    const portalSize = ISO_TILE_WIDTH * 4;
    ctx.drawImage(portailImage, spawnCenterX - portalSize / 2, spawnCenterY - portalSize / 2, portalSize, portalSize);
  } else {
    // Cercle rouge au centre
    ctx.fillStyle = 'rgba(139, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.arc(spawnCenterX, spawnCenterY, 50, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff0000';
    ctx.font = `bold ${Math.max(40, 60 / zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👹', spawnCenterX, spawnCenterY);
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
};

// Dessiner l'arrivee (goal)
export const drawGoal = (ctx, arriveeImage, zoom) => {
  // Dessiner les 4x4 tuiles du goal en isométrique (2D plat pour éviter confusion)
  for (let dy = 0; dy < 4; dy++) {
    for (let dx = 0; dx < 4; dx++) {
      drawIsoTile(ctx, GOAL_POINT.x + dx, GOAL_POINT.y + dy, '#6b8e23', 1);
    }
  }

  // Position centrale du goal en coordonnées isométriques (centre d'une zone 4x4)
  const { isoX: houseCenterX, isoY: houseCenterY } = gridToIso(GOAL_POINT.x + 0.5, GOAL_POINT.y + 0.5);

  ctx.shadowColor = 'rgba(107, 142, 35, 0.8)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  if (arriveeImage) {
    const goalSize = ISO_TILE_WIDTH * 4;
    ctx.drawImage(arriveeImage, houseCenterX - goalSize / 2, houseCenterY - goalSize / 2, goalSize, goalSize);
  } else {
    // Dessiner une maison simple en isométrique
    const houseWidth = 70;
    const houseHeight = 50;

    // Corps de la maison
    ctx.fillStyle = '#d4a574';
    ctx.fillRect(houseCenterX - houseWidth / 2, houseCenterY - houseHeight / 2, houseWidth, houseHeight);

    // Toit
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.moveTo(houseCenterX, houseCenterY - houseHeight);
    ctx.lineTo(houseCenterX - houseWidth / 2 - 15, houseCenterY - houseHeight / 2);
    ctx.lineTo(houseCenterX + houseWidth / 2 + 15, houseCenterY - houseHeight / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#228b22';
    ctx.font = `bold ${Math.max(32, 40 / zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏡', houseCenterX, houseCenterY);
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
};

// Dessiner les checkpoints
export const drawCheckpoints = (ctx, checkpointImages, zoom) => {
  const haloColors = [
    'rgba(156, 163, 175, 0.8)',
    'rgba(249, 115, 22, 0.9)',
    'rgba(180, 83, 9, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(139, 92, 246, 0.9)'
  ];

  const emojis = ['⚔️', '🔨', '🐴', '💧', '📖'];
  const colors = ['#4a5568', '#7c2d12', '#854d0e', '#1e3a5f', '#1e1b4b'];

  CHECKPOINTS.forEach((checkpoint, index) => {
    // Dessiner les 2x2 tuiles du checkpoint en isométrique (2D plat pour éviter confusion)
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        drawIsoTile(ctx, checkpoint.x + dx, checkpoint.y + dy, colors[index], 1);
      }
    }

    const checkpointImage = checkpointImages[checkpoint.name];
    // Centre d'une zone 2x2
    const { isoX: cx, isoY: cy } = gridToIso(checkpoint.x + 0.5, checkpoint.y + 0.5);

    ctx.shadowColor = haloColors[index];
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    if (checkpointImage) {
      const checkpointSize = ISO_TILE_WIDTH * 1.8;
      ctx.drawImage(checkpointImage, cx - checkpointSize / 2, cy - checkpointSize / 2, checkpointSize, checkpointSize);
    } else {
      ctx.font = `${Math.max(36, 44 / zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emojis[index], cx, cy);
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  });
};

// Fonction helper pour vérifier si une tour est derrière un checkpoint (cachée)
const isTowerBehindCheckpoint = (tower) => {
  const checkpoints = [
    { x: 10, y: 15 }, { x: 10, y: 27 }, { x: 35, y: 27 }, { x: 35, y: 15 }, { x: 22, y: 15 }
  ];

  for (const cp of checkpoints) {
    // Ne pas compter les tours à l'intérieur du checkpoint
    if (tower.gridX >= cp.x && tower.gridX < cp.x + 2 &&
        tower.gridY >= cp.y && tower.gridY < cp.y + 2) {
      return false;
    }

    // Checkpoint 2x2: de (cp.x, cp.y) à (cp.x+1, cp.y+1)
    // Les 3 cases haut-gauche (par rapport au coin supérieur gauche):
    // - (cp.x-1, cp.y-1) - diagonale haut-gauche
    // - (cp.x-1, cp.y)   - gauche
    // - (cp.x, cp.y-1)   - haut

    const topLeftPositions = [
      { x: cp.x - 1, y: cp.y - 1 }, // diagonale haut-gauche
      { x: cp.x - 1, y: cp.y },     // gauche
      { x: cp.x - 1, y: cp.y +1},     // gauche
      { x: cp.x, y: cp.y - 1 }      // haut
    ];

    // Les 3 cases haut-droite (par rapport au coin supérieur droit cp.x+1, cp.y):
    // - (cp.x+2, cp.y-1) - diagonale haut-droite
    // - (cp.x+2, cp.y)   - droite
    // - (cp.x+1, cp.y-1) - haut

    const topRightPositions = [
      { x: cp.x + 1, y: cp.y - 1 }  // haut
    ];

    // Vérifier si la tour est dans une des positions haut-gauche
    for (const pos of topLeftPositions) {
      if (tower.gridX === pos.x && tower.gridY === pos.y) {
        return true;
      }
    }

    // Vérifier si la tour est dans une des positions haut-droite
    for (const pos of topRightPositions) {
      if (tower.gridX === pos.x && tower.gridY === pos.y) {
        return true;
      }
    }
  }
  return false;
};

// Dessiner les tours
export const drawTowers = (ctx, towers, deps) => {
  const { hoveredTower, selectedTowerToDelete, gameState, checkFusionPossible, zoom, gemImages, checkpoints, behind } = deps;
  const fusionPulse = Math.sin(Date.now() / 600) * 0.5 + 0.5;

  towers.forEach(tower => {
    // Convertir la position de la tour en isométrique
    const { isoX, isoY } = gridToIso(tower.gridX + 0.5, tower.gridY + 0.5);

    // Filtrage pour le z-ordering
    if (checkpoints !== undefined) {
      const isBehind = isTowerBehindCheckpoint(tower);
      if (behind && !isBehind) return; // Ne dessiner que celles derrière
      if (!behind && isBehind) return; // Ne dessiner que celles devant
    }

    if (gameState === 'preparation' && checkFusionPossible && checkFusionPossible(tower)) {
      ctx.globalAlpha = 0.5 + fusionPulse * 0.3;
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = (3 + fusionPulse * 2) / zoom;
      ctx.beginPath();
      ctx.arc(isoX, isoY, 24 + fusionPulse * 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 0.3 + fusionPulse * 0.2;
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(isoX - 14, isoY - 14, 28, 28);
      ctx.globalAlpha = 1;
    }

    if (hoveredTower === tower.id && tower.type !== 'BASE') {
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = tower.color;
      drawIsoEllipse(ctx, isoX, isoY, tower.range);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (selectedTowerToDelete === tower.id) {
      // Couleur selon si fusion possible: cyan si fusion, rouge si suppression seule
      const hasFusion = checkFusionPossible && checkFusionPossible(tower);
      ctx.strokeStyle = hasFusion ? '#06b6d4' : '#ef4444';
      ctx.lineWidth = 4 / zoom;
      ctx.beginPath();
      ctx.arc(isoX, isoY, 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Vérifier si la gemme est derrière un checkpoint
    const isBehind = checkpoints !== undefined && isTowerBehindCheckpoint(tower);

    // Dessiner l'image de la gemme si disponible, sinon fallback sur emoji
    const gemImage = gemImages && gemImages[tower.type];
    if (gemImage) {
      // Gemmes fusionnées (is_droppable: false et is_base: false) sont 1.4x plus grandes
      const isFusedGem = !tower.is_droppable && !tower.is_base;
      const baseSize = 48;
      const gemSize = isFusedGem ? baseSize * 1.4 : baseSize;

      // Appliquer une légère transparence si derrière
      if (isBehind) ctx.globalAlpha = 0.85;
      ctx.drawImage(gemImage, isoX - gemSize / 2, isoY - gemSize / 2, gemSize, gemSize);
      if (isBehind) ctx.globalAlpha = 1;
    } else {
      // Fallback: dessiner un cercle coloré avec l'emoji
      ctx.fillStyle = tower.color;
      ctx.beginPath();
      ctx.arc(isoX, isoY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${Math.max(14, 16 / zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tower.icon, isoX, isoY);
    }
  });
};

// Dessiner les tours temporaires
export const drawTempTowers = (ctx, tempTowers, deps) => {
  const { hoveredTower, selectedTempTower, zoom, gemImages, checkpoints, behind } = deps;

  tempTowers.forEach(tower => {
    // Convertir la position de la tour en isométrique
    const { isoX, isoY } = gridToIso(tower.gridX + 0.5, tower.gridY + 0.5);

    // Filtrage pour le z-ordering
    if (checkpoints !== undefined) {
      const isBehind = isTowerBehindCheckpoint(tower);
      if (behind && !isBehind) return; // Ne dessiner que celles derrière
      if (!behind && isBehind) return; // Ne dessiner que celles devant
    }

    if (hoveredTower === tower.id && tower.type !== 'BASE') {
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = tower.color;
      drawIsoEllipse(ctx, isoX, isoY, tower.range);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (tower.id === selectedTempTower) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4 / zoom;
      ctx.beginPath();
      ctx.arc(isoX, isoY, 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Vérifier si la gemme est derrière un checkpoint
    const isBehind = checkpoints !== undefined && isTowerBehindCheckpoint(tower);

    ctx.globalAlpha = isBehind ? 0.7 : 0.8;

    // Dessiner l'image de la gemme si disponible, sinon fallback sur emoji
    const gemImage = gemImages && gemImages[tower.type];
    if (gemImage) {
      // Gemmes fusionnées (is_droppable: false et is_base: false) sont 1.4x plus grandes
      const isFusedGem = !tower.is_droppable && !tower.is_base;
      const baseSize = 48;
      const gemSize = isFusedGem ? baseSize * 1.4 : baseSize;
      ctx.drawImage(gemImage, isoX - gemSize / 2, isoY - gemSize / 2, gemSize, gemSize);
    } else {
      // Fallback: dessiner un cercle coloré avec l'emoji
      ctx.fillStyle = tower.color;
      ctx.beginPath();
      ctx.arc(isoX, isoY, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${Math.max(14, 16 / zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tower.icon, isoX, isoY);
    }

    ctx.globalAlpha = 1;
  });
};

// Dessiner les ennemis
export const drawEnemies = (ctx, enemies, currentPath, zoom, gemTypes) => {
  enemies.forEach(enemy => {
    const pos = getEnemyPosition(enemy, currentPath);
    if (!pos) return;

    const healthPercent = enemy.health / enemy.maxHealth;
    const barWidth = 40;
    const barHeight = 5;

    // Barre de vie avec bordure
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(pos.x - barWidth / 2, pos.y - 28, barWidth, barHeight);
    ctx.fillStyle = '#374151';
    ctx.fillRect(pos.x - barWidth / 2, pos.y - 28, barWidth, barHeight);
    ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(pos.x - barWidth / 2, pos.y - 28, barWidth * healthPercent, barHeight);

    // Texte HP (health / maxHealth)
    ctx.font = `bold ${Math.max(8, 10 / zoom)}px Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const hpText = `${Math.ceil(enemy.health)}/${enemy.maxHealth}`;
    ctx.strokeText(hpText, pos.x, pos.y - 35);
    ctx.fillText(hpText, pos.x, pos.y - 35);

    // Emoji de l'ennemi
    ctx.font = `${Math.max(18, 24 / zoom)}px Arial`;
    ctx.fillText(enemy.emoji, pos.x, pos.y);

    // Icônes de résistances sous l'ennemi
    if (enemy.resistances && enemy.resistances.length > 0 && gemTypes) {
      const iconSize = Math.max(10, 12 / zoom);
      const spacing = iconSize + 2;
      const totalWidth = enemy.resistances.length * spacing - 2;
      const startX = pos.x - totalWidth / 2;

      ctx.font = `${iconSize}px Arial`;
      enemy.resistances.forEach((resistance, index) => {
        const gemType = gemTypes[resistance];
        if (gemType && gemType.icon) {
          const x = startX + index * spacing;
          // Fond semi-transparent pour les icônes
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(x - iconSize / 2, pos.y + 12, iconSize, iconSize);
          // Icône de la résistance
          ctx.fillText(gemType.icon, x, pos.y + 12 + iconSize / 2);
        }
      });
    }
  });
};

// Dessiner les projectiles avec effets
export const drawProjectiles = (ctx, projectiles, particleSystem) => {
  projectiles.forEach(proj => {
    const effect = proj.effect?.split(',')[0] || 'default';
    const effectConfig = PARTICLE_EFFECTS[effect] || PARTICLE_EFFECTS.default;

    // Halo/Glow autour du projectile
    if (effectConfig.projectileGlow) {
      ctx.save();
      ctx.shadowColor = effectConfig.projectileGlow;
      ctx.shadowBlur = 15;
    }

    // Projectile principal
    ctx.fillStyle = effectConfig.projectileColor || proj.color || '#f59e0b';
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2);
    ctx.fill();

    if (effectConfig.projectileGlow) {
      ctx.restore();
    }

    // Créer une traînée de particules si le système est disponible
    if (particleSystem && effectConfig.trail?.enabled) {
      particleSystem.createTrail(proj, effect);
    }
  });
};

// Dessiner la preview de placement
export const drawPlacementPreview = (ctx, hoveredCell, deps) => {
  const { gameState, placementCount, towers, tempTowers, gemholderImage } = deps;

  if (gameState !== 'preparation' || !hoveredCell || placementCount >= 5) return;

  const existingTower = [...towers, ...tempTowers].find(
    t => t.gridX === hoveredCell.x && t.gridY === hoveredCell.y
  );
  if (existingTower) return;

  // Convertir la position en coordonnées isométriques
  const { isoX, isoY } = gridToIso(hoveredCell.x + 0.5, hoveredCell.y + 0.5);

  if (gemholderImage) {
    // Dessiner l'image gemholder
    const holderSize = ISO_TILE_WIDTH * 0.7; // Taille réduite pour proportions correctes
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.drawImage(
      gemholderImage,
      isoX - holderSize / 2,
      isoY - holderSize / 2,
      holderSize,
      holderSize
    );
    ctx.restore();
  } else {
    // Fallback: dessiner la tuile de preview en isométrique avec transparence
    drawIsoTile3D(ctx, hoveredCell.x, hoveredCell.y, '#22c55e', 0.3);
  }
};

// Dessiner les surbrillances des gemmes derrière les checkpoints
export const drawTowerHighlights = (ctx, towers, tempTowers) => {
  const allTowers = [...towers, ...tempTowers];

  allTowers.forEach(tower => {
    if (isTowerBehindCheckpoint(tower)) {
      drawIsoTileHighlight(ctx, tower.gridX, tower.gridY);
    }
  });
};
