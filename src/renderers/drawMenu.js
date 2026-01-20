import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/constants';
import { drawStyledButton } from './drawButton';

// Obtenir les boutons du menu
export const getMenuButtons = (centerX, centerY, pseudo) => {
  const btnWidth = 280;
  const btnHeight = 50;
  const btnStartY = centerY - 50;

  return [
    {
      id: 'new-game',
      x: centerX - btnWidth / 2,
      y: btnStartY,
      width: btnWidth,
      height: btnHeight,
      text: 'Nouvelle Partie',
      color: '#22c55e',
      hoverColor: '#16a34a'
    },
    {
      id: 'pseudo',
      x: centerX - btnWidth / 2,
      y: btnStartY + 70,
      width: btnWidth,
      height: btnHeight,
      text: pseudo || 'Entrez votre pseudo...',
      color: '#3b82f6',
      hoverColor: '#2563eb',
      isInput: true
    },
    {
      id: 'admin',
      x: centerX - btnWidth / 2,
      y: btnStartY + 140,
      width: btnWidth,
      height: btnHeight,
      text: 'Administration',
      color: '#6b7280',
      hoverColor: '#4b5563',
      icon: '⚙️'
    }
  ];
};

// Dessiner le menu principal
export const drawMainMenu = (ctx, deps) => {
  const { logoImage, hoveredMenuButton, pseudo, bestScore, lastScore } = deps;

  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;

  // Logo du jeu
  if (logoImage) {
    const logoWidth = 600;
    const logoRatio = logoImage.height / logoImage.width;
    const logoHeight = logoWidth * logoRatio;
    const logoX = centerX - logoWidth / 2;
    const logoY = 20;
    ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
  } else {
    // Fallback
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 20;
    ctx.fillText('Gem Tower Defense', centerX, centerY - 180);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px Arial';
    ctx.fillText('Defendez votre base avec des gemmes magiques !', centerX, centerY - 130);
  }

  // Boutons du menu
  const menuButtons = getMenuButtons(centerX, centerY, pseudo);
  menuButtons.forEach(btn => {
    const isHovered = hoveredMenuButton === btn.id;
    const btnIcon = btn.isInput ? '👤' : (btn.icon || '▶️');
    const fontSize = btn.isInput ? 'bold 16px Arial' : 'bold 22px Arial';

    drawStyledButton(ctx, btn.x, btn.y, btn.width, btn.height, btn.text, isHovered, {
      icon: btnIcon,
      fontSize: fontSize
    });
  });

  // Section Scores
  const scoreBoxY = centerY - 50 + 210;
  const scoreBoxWidth = 280;
  const scoreBoxHeight = 120;

  ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
  ctx.beginPath();
  ctx.roundRect(centerX - scoreBoxWidth / 2, scoreBoxY, scoreBoxWidth, scoreBoxHeight, 10);
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('📊 Scores', centerX, scoreBoxY + 25);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '16px Arial';
  ctx.fillText(`🏆 Meilleur: ${bestScore}`, centerX, scoreBoxY + 55);

  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`📝 Dernier: ${lastScore}`, centerX, scoreBoxY + 85);

  ctx.fillStyle = '#64748b';
  ctx.font = '14px Arial';
  ctx.fillText('Placez des tours, survivez aux vagues !', centerX, CANVAS_HEIGHT - 40);
};
