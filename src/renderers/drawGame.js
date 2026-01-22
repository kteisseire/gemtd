import { GRID_SIZE, SPAWN_POINT, GOAL_POINT, CHECKPOINTS, ISO_TILE_WIDTH } from '../config/constants';
import { getEnemyPosition } from '../services/combatSystem';
import { gridToIso, drawIsoTile3D, drawIsoTile } from './canvasUtils';

// Dessiner le chemin
export const drawPath = (ctx, currentPath, zoom) => {
  if (!currentPath) return;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  currentPath.forEach((point, i) => {
    const { isoX, isoY } = gridToIso(point.x + 0.5, point.y + 0.5);
    if (i === 0) ctx.moveTo(isoX, isoY);
    else ctx.lineTo(isoX, isoY);
  });
  ctx.strokeStyle = '#8b7355';
  ctx.lineWidth = (GRID_SIZE * 0.5) / zoom;
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

// Dessiner les tours
export const drawTowers = (ctx, towers, deps) => {
  const { hoveredTower, selectedTowerToDelete, gameState, checkFusionPossible, zoom, gemImages } = deps;
  const fusionPulse = Math.sin(Date.now() / 600) * 0.5 + 0.5;

  towers.forEach(tower => {
    // Convertir la position de la tour en isométrique
    const { isoX, isoY } = gridToIso(tower.gridX + 0.5, tower.gridY + 0.5);

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
      ctx.beginPath();
      ctx.arc(isoX, isoY, tower.range, 0, Math.PI * 2);
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

    // Dessiner l'image de la gemme si disponible, sinon fallback sur emoji
    const gemImage = gemImages && gemImages[tower.type];
    if (gemImage) {
      const gemSize = 48; // Taille de l'image de gemme
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
  });
};

// Dessiner les tours temporaires
export const drawTempTowers = (ctx, tempTowers, deps) => {
  const { hoveredTower, selectedTempTower, zoom, gemImages } = deps;

  tempTowers.forEach(tower => {
    // Convertir la position de la tour en isométrique
    const { isoX, isoY } = gridToIso(tower.gridX + 0.5, tower.gridY + 0.5);

    if (hoveredTower === tower.id && tower.type !== 'BASE') {
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = tower.color;
      ctx.beginPath();
      ctx.arc(isoX, isoY, tower.range, 0, Math.PI * 2);
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

    ctx.globalAlpha = 0.8;

    // Dessiner l'image de la gemme si disponible, sinon fallback sur emoji
    const gemImage = gemImages && gemImages[tower.type];
    if (gemImage) {
      const gemSize = 48; // Taille de l'image de gemme
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
export const drawEnemies = (ctx, enemies, currentPath, zoom) => {
  enemies.forEach(enemy => {
    const pos = getEnemyPosition(enemy, currentPath);
    if (!pos) return;

    const healthPercent = enemy.health / enemy.maxHealth;
    const barWidth = 30;
    const barHeight = 4;

    ctx.fillStyle = '#374151';
    ctx.fillRect(pos.x - barWidth / 2, pos.y - 25, barWidth, barHeight);
    ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(pos.x - barWidth / 2, pos.y - 25, barWidth * healthPercent, barHeight);

    ctx.font = `${Math.max(18, 24 / zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(enemy.emoji, pos.x, pos.y);
  });
};

// Dessiner les projectiles
export const drawProjectiles = (ctx, projectiles) => {
  projectiles.forEach(proj => {
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
};

// Dessiner la preview de placement
export const drawPlacementPreview = (ctx, hoveredCell, deps) => {
  const { gameState, placementCount, towers, tempTowers } = deps;

  if (gameState !== 'preparation' || !hoveredCell || placementCount >= 5) return;

  const existingTower = [...towers, ...tempTowers].find(
    t => t.gridX === hoveredCell.x && t.gridY === hoveredCell.y
  );
  if (existingTower) return;

  // Dessiner la tuile de preview en isométrique avec transparence
  drawIsoTile3D(ctx, hoveredCell.x, hoveredCell.y, '#22c55e', 0.3);
};
