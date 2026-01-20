import { CANVAS_WIDTH, TOOLBAR_HEIGHT, SPEED_OPTIONS, ZOOM_LEVELS } from '../config/constants';
import { drawStyledButton } from './drawButton';

// Generer les boutons de la barre d'outils
export const getToolbarButtons = (deps) => {
  const {
    gameState, lives, wave, score, placementCount,
    camera, gameSpeed, tempTowers, selectedTempTower,
    selectedTowerToDelete, towers, enemies,
    goToMenu, setGameState, setGameSpeed, zoomIn, zoomOut, resetCamera,
    setSelectedTempTower, deleteTower, startWave, resetGame
  } = deps;

  const buttons = [];
  let x = 10;

  // Bouton Menu
  buttons.push({ id: 'menu', x, width: 40, emoji: '🏠', type: 'action', action: goToMenu, tooltip: 'Menu principal' });
  x += 50;

  if (gameState === 'menu') return buttons;

  // Stats
  buttons.push({ id: 'lives', x, width: 60, emoji: '❤️', value: lives, type: 'stat', tooltip: 'Vies restantes' });
  x += 70;
  buttons.push({ id: 'wave', x, width: 60, emoji: '🌊', value: wave, type: 'stat', tooltip: 'Vague actuelle' });
  x += 70;
  buttons.push({ id: 'score', x, width: 80, emoji: '⭐', value: score, type: 'stat', tooltip: 'Score total' });
  x += 90;
  buttons.push({ id: 'gems', x, width: 50, emoji: '💎', value: `${placementCount}/5`, type: 'stat', tooltip: 'Gemmes placees' });
  x += 60;

  x += 20;

  // Controles de jeu
  if (gameState === 'wave') {
    buttons.push({ id: 'pause', x, width: 40, emoji: '⏸️', type: 'action', action: () => setGameState('paused'), tooltip: 'Pause' });
    x += 50;
  } else if (gameState === 'paused') {
    buttons.push({ id: 'play', x, width: 40, emoji: '▶️', type: 'action', action: () => setGameState('wave'), tooltip: 'Reprendre' });
    x += 50;
  }

  x += 20;

  // Vitesse
  buttons.push({ id: 'speed-label', x, width: 30, emoji: '🏃', type: 'label', tooltip: 'Vitesse' });
  x += 35;
  SPEED_OPTIONS.forEach((speed) => {
    buttons.push({
      id: `speed-${speed}`, x, width: 35,
      emoji: `${speed}x`, type: 'speed',
      action: () => setGameSpeed(speed),
      active: gameSpeed === speed,
      tooltip: `Vitesse ${speed}x`
    });
    x += 40;
  });

  x += 20;

  // Zoom
  buttons.push({ id: 'zoom-out', x, width: 40, emoji: '➖', type: 'action', action: zoomOut, disabled: camera.zoomLevel <= 0, tooltip: 'Dezoomer' });
  x += 45;
  buttons.push({ id: 'zoom-level', x, width: 40, emoji: `${camera.zoomLevel + 1}/6`, type: 'label', tooltip: 'Niveau de zoom' });
  x += 45;
  buttons.push({ id: 'zoom-in', x, width: 40, emoji: '➕', type: 'action', action: zoomIn, disabled: camera.zoomLevel >= ZOOM_LEVELS.length - 1, tooltip: 'Zoomer' });
  x += 45;
  buttons.push({ id: 'zoom-reset', x, width: 40, emoji: '🔄', type: 'action', action: resetCamera, tooltip: 'Reinitialiser' });
  x += 50;

  x += 20;

  // Gemmes temporaires
  if (gameState === 'preparation' && tempTowers.length > 0) {
    tempTowers.forEach((tower) => {
      buttons.push({
        id: `gem-${tower.id}`, x, width: 35,
        emoji: tower.icon, type: 'gem',
        action: () => setSelectedTempTower(tower.id),
        active: selectedTempTower === tower.id,
        color: tower.color,
        tooltip: `Selectionner ${tower.name}`
      });
      x += 40;
    });
  }

  // Suppression
  if (gameState === 'preparation' && selectedTowerToDelete && towers.some(t => t.id === selectedTowerToDelete)) {
    x += 10;
    buttons.push({ id: 'delete', x, width: 40, emoji: '🗑️', type: 'action', action: deleteTower, tooltip: 'Supprimer', variant: 'danger' });
  }

  // Ennemis restants
  if (gameState === 'wave') {
    x += 10;
    buttons.push({ id: 'enemies', x, width: 60, emoji: '👾', value: enemies.length, type: 'stat', tooltip: 'Ennemis restants' });
  }

  // Boutons a droite
  buttons.push({
    id: 'reset', x: CANVAS_WIDTH - 100, width: 90,
    text: 'Relancer', type: 'text-action',
    action: resetGame, tooltip: 'Recommencer', variant: 'danger'
  });

  if (gameState === 'preparation') {
    const canStart = tempTowers.length === 0 || selectedTempTower !== null;
    buttons.push({
      id: 'start', x: CANVAS_WIDTH - 220, width: 110,
      text: 'Lancer la vague', type: 'text-action',
      action: canStart ? startWave : null,
      disabled: !canStart,
      tooltip: canStart ? 'Demarrer' : 'Selectionnez une gemme',
      variant: 'success'
    });
  }

  return buttons;
};

// Dessiner la barre d'outils
export const drawToolbar = (ctx, buttons, hoveredButton) => {
  // Fond de la toolbar
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 0, CANVAS_WIDTH, TOOLBAR_HEIGHT);

  // Ligne de separation
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, TOOLBAR_HEIGHT);
  ctx.lineTo(CANVAS_WIDTH, TOOLBAR_HEIGHT);
  ctx.stroke();

  // Dessiner les boutons
  buttons.forEach(btn => {
    const isHovered = hoveredButton === btn.id;

    if (btn.type === 'text-action') {
      drawStyledButton(ctx, btn.x, 8, btn.width, 34, btn.text, isHovered && !btn.disabled, {
        icon: '', fontSize: 'bold 13px Arial',
        disabled: btn.disabled, variant: btn.variant || 'primary'
      });
      return;
    }

    if (btn.type === 'action' || btn.type === 'speed' || btn.type === 'gem') {
      const displayText = btn.value !== undefined ? `${btn.emoji}${btn.value}` : btn.emoji || '';
      const fontSize = btn.type === 'speed' ? 'bold 12px Arial' : '16px Arial';

      drawStyledButton(ctx, btn.x, 8, btn.width, 34, displayText, isHovered && !btn.disabled, {
        icon: '', fontSize: fontSize,
        disabled: btn.disabled, active: btn.active || false,
        variant: btn.variant || 'primary'
      });
      return;
    }

    if (btn.type === 'label' || btn.type === 'stat') {
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const displayText = btn.value !== undefined ? `${btn.emoji}${btn.value}` : btn.emoji || '';
      ctx.fillText(displayText, btn.x + btn.width / 2, 25);
    }
  });
};
