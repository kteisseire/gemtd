import { GRID_SIZE, SPAWN_POINT, GOAL_POINT, CHECKPOINTS } from '../config/constants';
import { getEnemyPosition } from '../services/combatSystem';

// Dessiner le chemin
export const drawPath = (ctx, currentPath, zoom) => {
  if (!currentPath) return;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  currentPath.forEach((point, i) => {
    const x = point.x * GRID_SIZE + GRID_SIZE / 2;
    const y = point.y * GRID_SIZE + GRID_SIZE / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#8b7355';
  ctx.lineWidth = (GRID_SIZE * 0.5) / zoom;
  ctx.stroke();
};

// Dessiner le portail (spawn)
export const drawSpawnPortal = (ctx, portailImage, zoom) => {
  const portalSize = GRID_SIZE * 4;
  const portalX = SPAWN_POINT.x * GRID_SIZE;
  const portalY = SPAWN_POINT.y * GRID_SIZE;

  ctx.shadowColor = 'rgba(139, 0, 0, 0.8)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  if (portailImage) {
    ctx.drawImage(portailImage, portalX, portalY, portalSize, portalSize);
  } else {
    const spawnCenterX = (SPAWN_POINT.x + 2) * GRID_SIZE;
    const spawnCenterY = (SPAWN_POINT.y + 2) * GRID_SIZE;

    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(portalX, portalY, portalSize, portalSize);

    ctx.fillStyle = 'rgba(139, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(spawnCenterX, spawnCenterY, portalSize / 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#8b0000';
    ctx.lineWidth = 4 / zoom;
    ctx.strokeRect(portalX, portalY, portalSize, portalSize);

    ctx.fillStyle = '#ff0000';
    ctx.font = `bold ${Math.max(32, 48 / zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👹', spawnCenterX, spawnCenterY);
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
};

// Dessiner l'arrivee (goal)
export const drawGoal = (ctx, arriveeImage, zoom) => {
  const goalSize = GRID_SIZE * 4;
  const goalX = GOAL_POINT.x * GRID_SIZE;
  const goalY = GOAL_POINT.y * GRID_SIZE;

  ctx.shadowColor = 'rgba(107, 142, 35, 0.8)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  if (arriveeImage) {
    ctx.drawImage(arriveeImage, goalX, goalY, goalSize, goalSize);
  } else {
    const houseCenterX = (GOAL_POINT.x + 2) * GRID_SIZE;
    const houseCenterY = (GOAL_POINT.y + 2) * GRID_SIZE;

    ctx.fillStyle = '#d4a574';
    ctx.fillRect(houseCenterX - goalSize / 3, houseCenterY - 5, goalSize / 1.5, goalSize / 2.5);

    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.moveTo(houseCenterX, houseCenterY - goalSize / 2.5);
    ctx.lineTo(houseCenterX - goalSize / 2.3, houseCenterY - 5);
    ctx.lineTo(houseCenterX + goalSize / 2.3, houseCenterY - 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#8b7355';
    ctx.fillRect(houseCenterX + goalSize / 6, houseCenterY - goalSize / 2, 8, 18);

    ctx.fillStyle = '#654321';
    ctx.fillRect(houseCenterX - 10, houseCenterY + 5, 20, 28);

    ctx.fillStyle = '#228b22';
    ctx.font = `bold ${Math.max(24, 32 / zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏡', houseCenterX, houseCenterY + goalSize / 2.8);

    ctx.strokeStyle = '#6b8e23';
    ctx.lineWidth = 3 / zoom;
    ctx.setLineDash([8 / zoom, 4 / zoom]);
    ctx.strokeRect(goalX, goalY, goalSize, goalSize);
    ctx.setLineDash([]);
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

  CHECKPOINTS.forEach((checkpoint, index) => {
    const checkpointSize = GRID_SIZE * 2;
    const checkpointX = checkpoint.x * GRID_SIZE;
    const checkpointY = checkpoint.y * GRID_SIZE;
    const checkpointImage = checkpointImages[checkpoint.name];

    ctx.shadowColor = haloColors[index];
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    if (checkpointImage) {
      ctx.drawImage(checkpointImage, checkpointX, checkpointY, checkpointSize, checkpointSize);
    } else {
      const cx = (checkpoint.x + 1) * GRID_SIZE;
      const cy = (checkpoint.y + 1) * GRID_SIZE;

      const colors = ['#4a5568', '#7c2d12', '#854d0e', '#1e3a5f', '#1e1b4b'];
      ctx.fillStyle = colors[index];
      ctx.fillRect(checkpointX, checkpointY, checkpointSize, checkpointSize);

      ctx.font = `${Math.max(28, 36 / zoom)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emojis[index], cx, cy);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3 / zoom;
      ctx.strokeRect(checkpointX, checkpointY, checkpointSize, checkpointSize);
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  });
};

// Dessiner les tours
export const drawTowers = (ctx, towers, deps) => {
  const { hoveredTower, selectedTowerToDelete, gameState, checkFusionPossible, zoom } = deps;
  const fusionPulse = Math.sin(Date.now() / 600) * 0.5 + 0.5;

  towers.forEach(tower => {
    if (gameState === 'preparation' && checkFusionPossible && checkFusionPossible(tower)) {
      ctx.globalAlpha = 0.5 + fusionPulse * 0.3;
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = (3 + fusionPulse * 2) / zoom;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 24 + fusionPulse * 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 0.3 + fusionPulse * 0.2;
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(tower.x - 14, tower.y - 14, 28, 28);
      ctx.globalAlpha = 1;
    }

    if (hoveredTower === tower.id && tower.type !== 'BASE') {
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = tower.color;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (selectedTowerToDelete === tower.id) {
      // Couleur selon si fusion possible: cyan si fusion, rouge si suppression seule
      const hasFusion = checkFusionPossible && checkFusionPossible(tower);
      ctx.strokeStyle = hasFusion ? '#06b6d4' : '#ef4444';
      ctx.lineWidth = 4 / zoom;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = tower.color;
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${Math.max(14, 16 / zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tower.icon, tower.x, tower.y);
  });
};

// Dessiner les tours temporaires
export const drawTempTowers = (ctx, tempTowers, deps) => {
  const { hoveredTower, selectedTempTower, zoom } = deps;

  tempTowers.forEach(tower => {
    if (hoveredTower === tower.id && tower.type !== 'BASE') {
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = tower.color;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (tower.id === selectedTempTower) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4 / zoom;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.8;
    ctx.fillStyle = tower.color;
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `${Math.max(14, 16 / zoom)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tower.icon, tower.x, tower.y);
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

  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(hoveredCell.x * GRID_SIZE, hoveredCell.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
  ctx.globalAlpha = 1;
};
