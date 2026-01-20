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
  const { logoImage, hoveredMenuButton, pseudo, bestScore, lastScore, leaderboard = [] } = deps;

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

  // Leaderboard sur le côté gauche
  const leaderboardX = 40;
  const leaderboardY = 200;
  const leaderboardWidth = 300;
  const leaderboardTitleHeight = 50;
  const leaderboardRowHeight = 35;
  const leaderboardContentHeight = Math.min(leaderboard.length, 10) * leaderboardRowHeight;
  const leaderboardTotalHeight = leaderboardTitleHeight + leaderboardContentHeight;

  // Fond du leaderboard
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.beginPath();
  ctx.roundRect(leaderboardX, leaderboardY, leaderboardWidth, leaderboardTotalHeight, 12);
  ctx.fill();
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Titre du leaderboard
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🏆 Top 10', leaderboardX + leaderboardWidth / 2, leaderboardY + 30);

  // Liste des scores
  leaderboard.slice(0, 10).forEach((entry, index) => {
    const y = leaderboardY + leaderboardTitleHeight + index * leaderboardRowHeight + 20;

    // Rang
    const rankColor = index === 0 ? '#fbbf24' : index === 1 ? '#cbd5e1' : index === 2 ? '#fb923c' : '#94a3b8';
    ctx.fillStyle = rankColor;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`#${index + 1}`, leaderboardX + 15, y);

    // Pseudo
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '14px Arial';
    const maxPseudoLength = 12;
    const displayPseudo = entry.pseudo.length > maxPseudoLength
      ? entry.pseudo.substring(0, maxPseudoLength) + '...'
      : entry.pseudo;
    ctx.fillText(displayPseudo, leaderboardX + 55, y);

    // Score
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(entry.score.toString(), leaderboardX + leaderboardWidth - 60, y);

    // Wave
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Arial';
    ctx.fillText(`W${entry.wave}`, leaderboardX + leaderboardWidth - 15, y);
  });

  // Section Scores personnels (en bas à droite)
  const scoreBoxX = CANVAS_WIDTH - 340;
  const scoreBoxY = CANVAS_HEIGHT - 160;
  const scoreBoxWidth = 300;
  const scoreBoxHeight = 120;

  ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
  ctx.beginPath();
  ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxWidth, scoreBoxHeight, 10);
  ctx.fill();
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('📊 Vos Scores', scoreBoxX + scoreBoxWidth / 2, scoreBoxY + 25);

  ctx.fillStyle = '#fbbf24';
  ctx.font = '16px Arial';
  ctx.fillText(`🏆 Meilleur: ${bestScore}`, scoreBoxX + scoreBoxWidth / 2, scoreBoxY + 55);

  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`📝 Dernier: ${lastScore}`, scoreBoxX + scoreBoxWidth / 2, scoreBoxY + 85);

  // Message d'instruction en bas
  ctx.fillStyle = '#64748b';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Placez des tours, survivez aux vagues !', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
};
