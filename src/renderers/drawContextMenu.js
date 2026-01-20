import { drawStyledButton } from './drawButton';

// Dessiner le menu contextuel
export const drawContextMenu = (ctx, contextMenu, deps) => {
  if (!contextMenu) return;

  const { checkFusionPossible, hoveredButton } = deps;
  const { tower, x, y } = contextMenu;
  const fusionInfo = checkFusionPossible ? checkFusionPossible(tower) : null;

  const menuWidth = 200;
  const buttonHeight = 35;
  const padding = 10;
  const spacing = 5;

  let menuHeight = padding * 2 + buttonHeight; // Supprimer
  if (fusionInfo) menuHeight += buttonHeight + spacing; // Fusionner
  menuHeight += buttonHeight + spacing; // Lancer la vague

  // Fond du menu
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.beginPath();
  ctx.roundRect(x, y, menuWidth, menuHeight, 8);
  ctx.fill();

  ctx.strokeStyle = tower.color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Titre
  ctx.fillStyle = tower.color;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let buttonY = y + padding;

  // Bouton Fusionner (si possible)
  if (fusionInfo) {
    const fusionBtnId = 'context-fusion';
    const isHovered = hoveredButton === fusionBtnId;
    drawStyledButton(ctx, x + padding, buttonY, menuWidth - padding * 2, buttonHeight,
      `Fusionner -> ${fusionInfo.resultGemId}`, isHovered, {
        icon: '🔮',
        fontSize: 'bold 12px Arial',
        variant: 'primary'
      });
    buttonY += buttonHeight + spacing;
  }

  // Bouton Lancer la vague
  const startBtnId = 'context-start';
  const isStartHovered = hoveredButton === startBtnId;
  drawStyledButton(ctx, x + padding, buttonY, menuWidth - padding * 2, buttonHeight,
    'Lancer la vague', isStartHovered, {
      icon: '▶️',
      fontSize: 'bold 12px Arial',
      variant: 'success'
    });
  buttonY += buttonHeight + spacing;

  // Bouton Supprimer
  const deleteBtnId = 'context-delete';
  const isDeleteHovered = hoveredButton === deleteBtnId;
  drawStyledButton(ctx, x + padding, buttonY, menuWidth - padding * 2, buttonHeight,
    'Supprimer', isDeleteHovered, {
      icon: '🗑️',
      fontSize: 'bold 12px Arial',
      variant: 'danger'
    });
};

// Obtenir les zones cliquables du menu contextuel
export const getContextMenuButtons = (contextMenu, checkFusionPossible) => {
  if (!contextMenu) return [];

  const { tower, x, y } = contextMenu;
  const fusionInfo = checkFusionPossible ? checkFusionPossible(tower) : null;

  const menuWidth = 200;
  const buttonHeight = 35;
  const padding = 10;
  const spacing = 5;
  const buttonWidth = menuWidth - padding * 2;

  const buttons = [];
  let buttonY = y + padding;

  if (fusionInfo) {
    buttons.push({
      id: 'context-fusion',
      x: x + padding,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      action: 'fusion',
      fusionInfo
    });
    buttonY += buttonHeight + spacing;
  }

  buttons.push({
    id: 'context-start',
    x: x + padding,
    y: buttonY,
    width: buttonWidth,
    height: buttonHeight,
    action: 'start'
  });
  buttonY += buttonHeight + spacing;

  buttons.push({
    id: 'context-delete',
    x: x + padding,
    y: buttonY,
    width: buttonWidth,
    height: buttonHeight,
    action: 'delete'
  });

  return buttons;
};
