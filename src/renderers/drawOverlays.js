import { CANVAS_WIDTH, CANVAS_HEIGHT, EFFECT_NAMES } from '../config/constants';

// Dessiner le message d'erreur
export const drawErrorOverlay = (ctx, errorMessage) => {
  if (!errorMessage) return;

  ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(errorMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
};

// Dessiner l'ecran de game over
export const drawGameOverOverlay = (ctx, score, wave) => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

  ctx.fillStyle = '#f1f5f9';
  ctx.font = '24px Arial';
  ctx.fillText(`Score: ${score} | Vague: ${wave}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
};

// Dessiner le tooltip de tour
export const drawTowerTooltip = (ctx, deps) => {
  const { hoveredTower, towers, tempTowers, mousePos, gemTypes, fusionRecipes = [] } = deps;
  if (!hoveredTower) return;

  const tower = [...towers, ...tempTowers].find(t => t.id === hoveredTower);
  if (!tower) return;

  // Trouver les recettes où cette gemme est utilisée
  const relevantRecipes = fusionRecipes.filter(recipe => {
    const requiredGems = recipe.required_gems.split(',').map(g => g.trim());
    return requiredGems.includes(tower.type);
  });

  const tooltipWidth = 200;
  const baseHeight = 105;
  const recipeHeight = relevantRecipes.length > 0 ? 20 + relevantRecipes.length * 22 : 0;
  const tooltipHeight = baseHeight + recipeHeight;

  let tooltipX = mousePos.x + 15;
  let tooltipY = mousePos.y + 15;

  if (tooltipX + tooltipWidth > CANVAS_WIDTH) tooltipX = mousePos.x - tooltipWidth - 10;
  if (tooltipY + tooltipHeight > CANVAS_HEIGHT) tooltipY = mousePos.y - tooltipHeight - 10;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.beginPath();
  ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
  ctx.fill();

  ctx.strokeStyle = tower.color;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = tower.color;
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`${tower.icon} ${tower.name}`, tooltipX + 10, tooltipY + 10);

  ctx.fillStyle = '#f1f5f9';
  ctx.font = '13px Arial';
  ctx.fillText(`Degats: ${tower.damage}`, tooltipX + 10, tooltipY + 35);
  ctx.fillText(`Portee: ${tower.range}`, tooltipX + 10, tooltipY + 52);
  ctx.fillText(`Vitesse: ${tower.speed}ms`, tooltipX + 10, tooltipY + 69);

  const effectName = EFFECT_NAMES[tower.effect] || tower.effect;
  ctx.fillText(`Effet: ${effectName}`, tooltipX + 10, tooltipY + 86);

  // Afficher les recettes de fusion
  if (relevantRecipes.length > 0) {
    let y = tooltipY + 108;

    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('🔮 Fusions:', tooltipX + 10, y);
    y += 18;

    ctx.font = '11px Arial';
    relevantRecipes.forEach(recipe => {
      const requiredGems = recipe.required_gems.split(',').map(g => g.trim());
      const resultGem = gemTypes[recipe.result_gem_id];

      // Afficher les icônes des gemmes requises
      let recipeText = '';
      requiredGems.forEach((gemId, idx) => {
        const gem = gemTypes[gemId];
        if (gem) {
          recipeText += gem.icon;
          if (idx < requiredGems.length - 1) recipeText += '+';
        }
      });

      recipeText += ` → ${resultGem?.icon || '?'} ${recipe.result_gem_id}`;

      ctx.fillStyle = '#c4b5fd';
      ctx.fillText(recipeText, tooltipX + 15, y);
      y += 20;
    });
  }
};

// Dessiner le tooltip de bouton de toolbar
export const drawToolbarTooltip = (ctx, deps) => {
  const { hoveredButton, mousePos, toolbarButtons } = deps;
  if (!hoveredButton || !toolbarButtons) return;

  const button = toolbarButtons.find(b => b.id === hoveredButton);
  if (!button || !button.tooltip) return;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.font = '12px Arial';
  const textWidth = ctx.measureText(button.tooltip).width;
  const tooltipWidth = textWidth + 20;
  const tooltipHeight = 28;
  let tooltipX = mousePos.x - tooltipWidth / 2;
  let tooltipY = mousePos.y + 20;

  if (tooltipX < 5) tooltipX = 5;
  if (tooltipX + tooltipWidth > CANVAS_WIDTH - 5) tooltipX = CANVAS_WIDTH - tooltipWidth - 5;

  ctx.beginPath();
  ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 5);
  ctx.fill();

  ctx.fillStyle = '#f1f5f9';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(button.tooltip, tooltipX + tooltipWidth / 2, tooltipY + tooltipHeight / 2);
};
