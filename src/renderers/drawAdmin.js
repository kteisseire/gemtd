import { CANVAS_WIDTH, CANVAS_HEIGHT, EFFECT_NAMES, EFFECT_DESCRIPTIONS } from '../config/constants';
import { drawStyledButton } from './drawButton';

// Dessiner la page d'admin
export const drawAdminPage = (ctx, adminPage, deps) => {
  const {
    gemTypes, fusionRecipes, hoveredMenuButton, editingGem, adminMessage
  } = deps;

  // Fond avec motif
  const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(0.5, '#1e293b');
  gradient.addColorStop(1, '#0f172a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Motif de grille subtil
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.1)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }

  // Header
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 70);
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 70);
  ctx.lineTo(CANVAS_WIDTH, 70);
  ctx.stroke();

  // Bouton retour
  drawStyledButton(ctx, 20, 15, 110, 40, '← Retour', hoveredMenuButton === 'admin-back', {
    fontSize: 'bold 14px Arial',
    variant: 'secondary'
  });

  // Titre
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚙️ Administration', CANVAS_WIDTH / 2, 35);

  // Sous-titre selon la page
  ctx.font = '14px Arial';
  ctx.fillStyle = '#64748b';
  if (adminPage === 'gems') ctx.fillText('Gestion des gemmes', CANVAS_WIDTH / 2, 55);
  else if (adminPage === 'enemies') ctx.fillText('Gestion des ennemis', CANVAS_WIDTH / 2, 55);
  else if (adminPage === 'resistances') ctx.fillText('Gestion des résistances', CANVAS_WIDTH / 2, 55);
  else if (adminPage === 'recipes') ctx.fillText('Recettes de fusion', CANVAS_WIDTH / 2, 55);
  else if (adminPage === 'edit-gem') ctx.fillText('Modification de gemme', CANVAS_WIDTH / 2, 55);
  else if (adminPage === 'edit-enemy') ctx.fillText('Modification d\'ennemi', CANVAS_WIDTH / 2, 55);

  if (adminPage === 'home') {
    drawAdminHome(ctx, hoveredMenuButton);
  } else if (adminPage === 'gems') {
    drawAdminGems(ctx, gemTypes, hoveredMenuButton);
  } else if (adminPage === 'enemies') {
    drawAdminEnemies(ctx, deps.enemyTypes, hoveredMenuButton);
  } else if (adminPage === 'resistances') {
    drawAdminResistances(ctx, deps.enemyTypes, gemTypes, hoveredMenuButton);
  } else if (adminPage === 'edit-gem' && editingGem) {
    drawAdminEditGem(ctx, editingGem, hoveredMenuButton);
  } else if (adminPage === 'edit-enemy' && deps.editingEnemy) {
    drawAdminEditEnemy(ctx, deps.editingEnemy, hoveredMenuButton, gemTypes, deps.editingField);
  } else if (adminPage === 'recipes') {
    drawAdminRecipes(ctx, fusionRecipes, gemTypes, hoveredMenuButton);
  }

  // Message admin (toast)
  if (adminMessage) {
    const msgWidth = 400;
    const msgX = (CANVAS_WIDTH - msgWidth) / 2;
    const msgY = CANVAS_HEIGHT - 80;

    ctx.fillStyle = adminMessage.type === 'success' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)';
    ctx.beginPath();
    ctx.roundRect(msgX, msgY, msgWidth, 50, 10);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(adminMessage.text, CANVAS_WIDTH / 2, msgY + 25);
  }
};

// Page d'accueil admin
const drawAdminHome = (ctx, hoveredMenuButton) => {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2 - 60;

  // Cartes de menu
  const cards = [
    { id: 'admin-gems', icon: '💎', title: 'Gemmes', desc: 'Gérer les types de gemmes', color: '#3b82f6', y: centerY - 120 },
    { id: 'admin-enemies', icon: '👾', title: 'Ennemis', desc: 'Gérer les types d\'ennemis', color: '#ef4444', y: centerY - 20 },
    { id: 'admin-resistances', icon: '🛡️', title: 'Résistances', desc: 'Configurer les résistances', color: '#f59e0b', y: centerY + 80 },
    { id: 'admin-recipes', icon: '🔮', title: 'Recettes', desc: 'Configurer les fusions', color: '#a855f7', y: centerY + 180 }
  ];

  cards.forEach(card => {
    const isHovered = hoveredMenuButton === card.id;
    const cardWidth = 400;
    const cardHeight = 90;
    const cardX = centerX - cardWidth / 2;

    // Ombre
    if (isHovered) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.beginPath();
      ctx.roundRect(cardX - 5, card.y - 5, cardWidth + 10, cardHeight + 10, 15);
      ctx.fill();
    }

    // Carte
    ctx.fillStyle = isHovered ? 'rgba(51, 65, 85, 0.95)' : 'rgba(30, 41, 59, 0.9)';
    ctx.beginPath();
    ctx.roundRect(cardX, card.y, cardWidth, cardHeight, 12);
    ctx.fill();
    ctx.strokeStyle = isHovered ? card.color : '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Icône
    ctx.font = '40px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(card.icon, cardX + 25, card.y + 55);

    // Titre
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(card.title, cardX + 90, card.y + 40);

    // Description
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Arial';
    ctx.fillText(card.desc, cardX + 90, card.y + 65);

    // Flèche
    ctx.fillStyle = isHovered ? card.color : '#64748b';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('→', cardX + cardWidth - 20, card.y + 55);
  });
};

// Liste des gemmes
const drawAdminGems = (ctx, gemTypes, hoveredMenuButton) => {
  const startY = 140;

  // Bouton "Nouvelle gemme"
  drawStyledButton(ctx, CANVAS_WIDTH - 180, 80, 160, 40, '+ Nouvelle gemme',
    hoveredMenuButton === 'gem-create', { fontSize: 'bold 14px Arial', variant: 'success' });

  const gemKeys = Object.keys(gemTypes);
  const cardWidth = 280;
  const cardHeight = 70;
  const cols = 3;
  const gap = 20;
  const startX = (CANVAS_WIDTH - (cols * cardWidth + (cols - 1) * gap)) / 2;

  gemKeys.forEach((key, index) => {
    const gem = gemTypes[key];
    if (!gem) return;

    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = startX + col * (cardWidth + gap);
    const y = startY + row * (cardHeight + gap);

    if (y + cardHeight > CANVAS_HEIGHT - 50) return;

    const isHovered = hoveredMenuButton === `gem-edit-${key}`;

    // Carte gemme
    ctx.fillStyle = isHovered ? 'rgba(51, 65, 85, 0.95)' : 'rgba(30, 41, 59, 0.8)';
    ctx.beginPath();
    ctx.roundRect(x, y, cardWidth, cardHeight, 10);
    ctx.fill();

    // Bordure colorée à gauche
    ctx.fillStyle = gem.color || '#888';
    ctx.beginPath();
    ctx.roundRect(x, y, 6, cardHeight, [10, 0, 0, 10]);
    ctx.fill();

    if (isHovered) {
      ctx.strokeStyle = gem.color || '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Icône
    ctx.font = '28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(gem.icon || '?', x + 20, y + 40);

    // ID et nom
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(key, x + 55, y + 25);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Arial';
    ctx.fillText(gem.name || 'Sans nom', x + 55, y + 42);

    // Stats avec DPS
    const dps = gem.damage && gem.speed ? ((gem.damage * 1000) / gem.speed).toFixed(1) : '0';
    ctx.font = '10px Arial';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`⚔️${gem.damage} ⏱️${gem.speed} 📏${gem.range}`, x + 55, y + 58);

    // DPS en surbrillance
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`DPS: ${dps}`, x + 55, y + 68);

    // Badge type
    let badge = '';
    let badgeColor = '';
    if (gem.is_base) {
      badge = 'BASE';
      badgeColor = '#3b82f6';
    } else if (!gem.is_droppable) {
      badge = 'FUSION';
      badgeColor = '#eab308';
    } else {
      badge = 'DROP';
      badgeColor = '#22c55e';
    }

    ctx.fillStyle = badgeColor;
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(badge, x + cardWidth - 15, y + 18);

    // Bouton éditer
    drawStyledButton(ctx, x + cardWidth - 65, y + cardHeight - 30, 50, 22, 'Edit', isHovered, {
      fontSize: '10px Arial',
      variant: 'primary'
    });
  });

  // Tableau des effets (coin inférieur droit)
  const effectTableX = CANVAS_WIDTH - 420;
  const effectTableY = CANVAS_HEIGHT - 480;
  const effectTableWidth = 400;
  const effectTableHeaderHeight = 40;
  const effectRowHeight = 35;
  const effectCount = Object.keys(EFFECT_NAMES).length;
  const effectTableHeight = effectTableHeaderHeight + (effectCount * effectRowHeight);

  // Fond du tableau
  ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
  ctx.beginPath();
  ctx.roundRect(effectTableX, effectTableY, effectTableWidth, effectTableHeight, 12);
  ctx.fill();
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 2;
  ctx.stroke();

  // En-tête du tableau
  ctx.fillStyle = '#a855f7';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('✨ Effets des Gemmes', effectTableX + effectTableWidth / 2, effectTableY + 25);

  // Ligne de séparation
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(effectTableX + 15, effectTableY + effectTableHeaderHeight);
  ctx.lineTo(effectTableX + effectTableWidth - 15, effectTableY + effectTableHeaderHeight);
  ctx.stroke();

  // Lignes des effets
  let effectY = effectTableY + effectTableHeaderHeight + 5;
  Object.keys(EFFECT_NAMES).forEach((effectKey, index) => {
    const effectName = EFFECT_NAMES[effectKey];
    const effectDesc = EFFECT_DESCRIPTIONS[effectKey];

    // Fond alterné
    if (index % 2 === 0) {
      ctx.fillStyle = 'rgba(51, 65, 85, 0.3)';
      ctx.fillRect(effectTableX + 10, effectY, effectTableWidth - 20, effectRowHeight);
    }

    // Nom de l'effet (en gras)
    ctx.fillStyle = effectKey === 'none' ? '#64748b' : '#22c55e';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(effectName, effectTableX + 20, effectY + 14);

    // Description de l'effet
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Arial';
    ctx.fillText(effectDesc, effectTableX + 20, effectY + 28);

    effectY += effectRowHeight;
  });
};

// Page des recettes de fusion
// Page de gestion des résistances
const drawAdminResistances = (ctx, enemyTypes, gemTypes, hoveredMenuButton) => {
  const startY = 100;

  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Configurez les résistances de chaque ennemi aux différentes gemmes (+20% de résistance)', 50, startY - 10);

  // En-têtes
  const headerY = startY + 20;
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('ENNEMI', 60, headerY);
  ctx.fillText('BASE', 180, headerY);

  // Afficher les icônes des gemmes en en-tête
  const gemKeys = Object.keys(gemTypes).filter(k => k !== 'BASE');
  let gemX = 280;
  gemKeys.forEach(key => {
    const gem = gemTypes[key];
    ctx.font = '20px Arial';
    ctx.fillText(gem.icon, gemX, headerY);
    gemX += 50;
  });

  // Ligne séparatrice
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, headerY + 15);
  ctx.lineTo(CANVAS_WIDTH - 50, headerY + 15);
  ctx.stroke();

  let y = headerY + 45;
  const enemyKeys = Object.keys(enemyTypes);

  enemyKeys.forEach(enemyKey => {
    if (y > CANVAS_HEIGHT - 80) return;

    const enemy = enemyTypes[enemyKey];

    // Nom de l'ennemi
    ctx.font = '24px Arial';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(enemy.emoji, 60, y);
    ctx.font = 'bold 14px Arial';
    ctx.fillText(enemyKey, 95, y - 5);

    // Résistance globale (champ éditable)
    const globalResButtonId = `global-resistance-${enemyKey}`;
    const isGlobalResHovered = hoveredMenuButton === globalResButtonId;

    // Fond du bouton
    ctx.fillStyle = isGlobalResHovered ? 'rgba(245, 158, 11, 0.4)' : 'rgba(30, 41, 59, 0.7)';
    ctx.beginPath();
    ctx.roundRect(165, y - 25, 75, 42, 8);
    ctx.fill();

    // Bordure
    ctx.strokeStyle = isGlobalResHovered ? '#f59e0b' : '#475569';
    ctx.lineWidth = isGlobalResHovered ? 3 : 2;
    ctx.stroke();

    // Icône de crayon pour indiquer l'édition
    ctx.fillStyle = isGlobalResHovered ? '#f59e0b' : '#94a3b8';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('✏️', 233, y - 9);

    // Valeur en pourcentage
    ctx.fillStyle = isGlobalResHovered ? '#fbbf24' : '#f1f5f9';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    const globalResPercent = Math.round((enemy.global_resistance || 0.1) * 100);
    ctx.fillText(`${globalResPercent}%`, 202, y + 3);
    ctx.textAlign = 'left';

    // Cases de résistance pour chaque gemme
    gemX = 280;
    gemKeys.forEach(gemKey => {
      const hasResistance = enemy.resistances && enemy.resistances.includes(gemKey);
      const buttonId = `resistance-${enemyKey}-${gemKey}`;
      const isHovered = hoveredMenuButton === buttonId;

      // Case de résistance
      const boxSize = 35;
      ctx.fillStyle = hasResistance
        ? (isHovered ? 'rgba(239, 68, 68, 0.8)' : 'rgba(239, 68, 68, 0.6)')
        : (isHovered ? 'rgba(51, 65, 85, 0.6)' : 'rgba(30, 41, 59, 0.4)');
      ctx.beginPath();
      ctx.roundRect(gemX, y - 22, boxSize, boxSize, 6);
      ctx.fill();

      ctx.strokeStyle = isHovered ? '#ef4444' : '#475569';
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.stroke();

      // Icône de résistance
      if (hasResistance) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✓', gemX + boxSize/2, y - 2);
        ctx.textAlign = 'left';
      }

      gemX += 50;
    });

    y += 55;
  });
};

const drawAdminRecipes = (ctx, fusionRecipes, gemTypes, hoveredMenuButton) => {
  const startY = 90;

  // Bouton ajouter
  drawStyledButton(ctx, CANVAS_WIDTH - 160, 80, 140, 40, '+ Nouvelle',
    hoveredMenuButton === 'recipe-add', { fontSize: 'bold 14px Arial', variant: 'success' });

  // En-têtes
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('INGRÉDIENTS', 60, startY + 20);
  ctx.fillText('RÉSULTAT', 450, startY + 20);
  ctx.fillText('MIN', 650, startY + 20);
  ctx.fillText('ACTIONS', 750, startY + 20);

  // Ligne séparatrice
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, startY + 35);
  ctx.lineTo(CANVAS_WIDTH - 50, startY + 35);
  ctx.stroke();

  let y = startY + 55;

  if (fusionRecipes.length === 0) {
    // État vide
    ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
    ctx.beginPath();
    ctx.roundRect(100, y + 30, CANVAS_WIDTH - 200, 150, 10);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🔮', CANVAS_WIDTH / 2, y + 90);

    ctx.font = '18px Arial';
    ctx.fillText('Aucune recette configurée', CANVAS_WIDTH / 2, y + 130);

    ctx.font = '14px Arial';
    ctx.fillStyle = '#475569';
    ctx.fillText('Cliquez sur "+ Nouvelle" pour créer une recette de fusion', CANVAS_WIDTH / 2, y + 155);
  } else {
    fusionRecipes.forEach((recipe, index) => {
      if (y > CANVAS_HEIGHT - 80) return;

      const isHovered = hoveredMenuButton === `recipe-${index}` || hoveredMenuButton === `recipe-delete-${index}`;

      // Ligne
      ctx.fillStyle = isHovered ? 'rgba(51, 65, 85, 0.6)' : 'rgba(30, 41, 59, 0.4)';
      ctx.beginPath();
      ctx.roundRect(50, y - 5, CANVAS_WIDTH - 100, 50, 8);
      ctx.fill();

      // Gemmes requises
      ctx.textAlign = 'left';
      const requiredGems = recipe.required_gems.split(',');
      let gemX = 60;
      requiredGems.forEach(gemId => {
        const gem = gemTypes[gemId.trim()];
        if (gem) {
          // Cercle coloré
          ctx.fillStyle = gem.color || '#888';
          ctx.beginPath();
          ctx.arc(gemX + 12, y + 20, 15, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '16px Arial';
          ctx.fillText(gem.icon || '?', gemX + 4, y + 25);
          gemX += 38;
        }
      });

      // Flèche
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('→', 400, y + 25);

      // Résultat
      const resultGem = gemTypes[recipe.result_gem_id];
      if (resultGem) {
        ctx.fillStyle = resultGem.color || '#888';
        ctx.beginPath();
        ctx.arc(470, y + 20, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '20px Arial';
        ctx.fillText(resultGem.icon || '?', 460, y + 27);

        ctx.fillStyle = '#f1f5f9';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(recipe.result_gem_id, 500, y + 25);
      }

      // Minimum
      ctx.fillStyle = '#eab308';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(String(recipe.min_count), 665, y + 27);

      // Boutons Modifier et Supprimer
      drawStyledButton(ctx, 740, y + 5, 70, 30, '✏️',
        hoveredMenuButton === `recipe-edit-${index}`, { fontSize: '14px Arial', variant: 'primary' });

      drawStyledButton(ctx, 820, y + 5, 70, 30, '🗑️',
        hoveredMenuButton === `recipe-delete-${index}`, { fontSize: '14px Arial', variant: 'danger' });

      y += 60;
    });
  }
};

// Edition d'une gemme
const drawAdminEditGem = (ctx, editingGem, hoveredMenuButton) => {
  const panelWidth = 600;
  const panelX = (CANVAS_WIDTH - panelWidth) / 2;
  const startY = 90;

  // Panneau principal
  ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
  ctx.beginPath();
  ctx.roundRect(panelX, startY, panelWidth, CANVAS_HEIGHT - startY - 30, 15);
  ctx.fill();
  ctx.strokeStyle = editingGem.color || '#475569';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Preview de la gemme
  ctx.fillStyle = editingGem.color || '#888';
  ctx.beginPath();
  ctx.arc(panelX + 60, startY + 60, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = '32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(editingGem.icon || '💎', panelX + 60, startY + 70);

  // Titre
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(editingGem.name || 'Nouvelle gemme', panelX + 120, startY + 50);

  ctx.fillStyle = '#64748b';
  ctx.font = '14px Arial';
  const isNewGem = !editingGem.id || editingGem.id === 'NEW';
  ctx.fillText(isNewGem ? 'Nouvelle gemme' : `Modification`, panelX + 120, startY + 75);

  // Afficher le DPS calculé dans la preview
  const dps = editingGem.damage && editingGem.speed ? ((editingGem.damage * 1000) / editingGem.speed).toFixed(1) : '0';
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`DPS: ${dps}`, panelX + 120, startY + 95);

  // Champs
  const dpsValue = editingGem.damage && editingGem.speed ? ((editingGem.damage * 1000) / editingGem.speed).toFixed(1) : '0';
  const fields = [
    { label: 'ID', value: editingGem.id || '', key: 'id', icon: '🔑' },
    { label: 'Nom', value: editingGem.name, key: 'name', icon: '📝' },
    { label: 'Couleur', value: editingGem.color, key: 'color', icon: '🎨' },
    { label: 'Image', value: editingGem.image || '/images/gemviolette.png', key: 'image', icon: '🖼️' },
    { label: 'Dégâts', value: editingGem.damage, key: 'damage', icon: '⚔️' },
    { label: 'Vitesse (ms)', value: editingGem.speed, key: 'speed', icon: '⏱️' },
    { label: 'Portée', value: editingGem.range, key: 'range', icon: '📏' },
    { label: 'DPS (calculé)', value: dpsValue, key: 'dps', icon: '💥', readOnly: true },
    { label: 'Effet', value: editingGem.effect, key: 'effect', icon: '✨' },
    { label: 'Icône', value: editingGem.icon, key: 'icon', icon: '🎭' },
    { label: 'Droppable', value: editingGem.is_droppable ? 'Oui' : 'Non', key: 'is_droppable', icon: '🎲' },
    { label: 'Gemme Base', value: editingGem.is_base ? 'Oui' : 'Non', key: 'is_base', icon: '⭐' }
  ];

  let y = startY + 120;
  const fieldWidth = panelWidth - 60;
  const fieldHeight = 42;

  fields.forEach((field) => {
    const isHovered = !field.readOnly && hoveredMenuButton === `field-${field.key}`;
    const fieldX = panelX + 30;

    // Fond du champ (grisé si lecture seule)
    if (field.readOnly) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.1)'; // Vert léger pour DPS
    } else {
      ctx.fillStyle = isHovered ? 'rgba(59, 130, 246, 0.2)' : 'rgba(51, 65, 85, 0.5)';
    }
    ctx.beginPath();
    ctx.roundRect(fieldX, y, fieldWidth, fieldHeight, 8);
    ctx.fill();

    if (isHovered) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (field.readOnly) {
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Icône
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(field.icon, fieldX + 15, y + 27);

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Arial';
    ctx.fillText(field.label, fieldX + 45, y + 18);

    // Valeur (en vert si c'est le DPS)
    if (field.key === 'dps') {
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 16px Arial';
    } else {
      ctx.fillStyle = field.key === 'color' ? field.value : '#f1f5f9';
      ctx.font = 'bold 14px Arial';
    }
    ctx.fillText(String(field.value), fieldX + 45, y + 34);

    // Indicateur couleur
    if (field.key === 'color') {
      ctx.fillStyle = field.value;
      ctx.beginPath();
      ctx.roundRect(fieldX + fieldWidth - 50, y + 8, 35, 26, 5);
      ctx.fill();
    }

    // Indicateur toggle pour booléens
    if (field.key === 'is_droppable' || field.key === 'is_base') {
      const toggleX = fieldX + fieldWidth - 60;
      const toggleOn = field.value === 'Oui';

      ctx.fillStyle = toggleOn ? '#22c55e' : '#475569';
      ctx.beginPath();
      ctx.roundRect(toggleX, y + 10, 45, 22, 11);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(toggleOn ? toggleX + 34 : toggleX + 11, y + 21, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    y += fieldHeight + 8;
  });

  // Boutons Sauvegarder et Supprimer
  const isNewGemButton = !editingGem.id || editingGem.id === 'NEW' || editingGem.id === '';

  if (!isNewGemButton) {
    // Bouton supprimer (uniquement si c'est une gemme existante)
    drawStyledButton(ctx, panelX + 30, y + 15, 160, 45, '🗑️ Supprimer',
      hoveredMenuButton === 'admin-delete-gem', { fontSize: 'bold 16px Arial', variant: 'danger' });
  }

  // Bouton sauvegarder
  const saveX = isNewGemButton ? panelX + panelWidth / 2 - 80 : panelX + panelWidth - 190;
  drawStyledButton(ctx, saveX, y + 15, 160, 45, '💾 Sauvegarder',
    hoveredMenuButton === 'admin-save', { fontSize: 'bold 16px Arial', variant: 'success' });
};

// Obtenir les boutons admin
export const getAdminButtons = (adminPage, gemTypes, editingGem, fusionRecipes = [], enemyTypes = {}, editingEnemy = null, editingField = null) => {
  const buttons = [
    { id: 'admin-back', x: 20, y: 15, width: 110, height: 40, action: 'back' }
  ];

  if (adminPage === 'home') {
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2 - 60;
    buttons.push({ id: 'admin-gems', x: centerX - 200, y: centerY - 120, width: 400, height: 90, action: 'gems' });
    buttons.push({ id: 'admin-enemies', x: centerX - 200, y: centerY - 20, width: 400, height: 90, action: 'enemies' });
    buttons.push({ id: 'admin-resistances', x: centerX - 200, y: centerY + 80, width: 400, height: 90, action: 'resistances' });
    buttons.push({ id: 'admin-recipes', x: centerX - 200, y: centerY + 180, width: 400, height: 90, action: 'recipes' });
  } else if (adminPage === 'gems') {
    // Bouton "Nouvelle gemme"
    buttons.push({ id: 'gem-create', x: CANVAS_WIDTH - 180, y: 80, width: 160, height: 40, action: 'create-gem' });

    const startY = 140;
    const gemKeys = Object.keys(gemTypes);
    const cardWidth = 280;
    const cardHeight = 70;
    const cols = 3;
    const gap = 20;
    const startX = (CANVAS_WIDTH - (cols * cardWidth + (cols - 1) * gap)) / 2;

    gemKeys.forEach((key, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardWidth + gap);
      const y = startY + row * (cardHeight + gap);

      if (y + cardHeight > CANVAS_HEIGHT - 50) return;

      buttons.push({
        id: `gem-edit-${key}`,
        x: x,
        y: y,
        width: cardWidth,
        height: cardHeight,
        action: 'edit-gem',
        gemId: key
      });
    });
  } else if (adminPage === 'enemies') {
    // Bouton "Nouvel ennemi"
    buttons.push({ id: 'enemy-create', x: CANVAS_WIDTH - 180, y: 80, width: 160, height: 40, action: 'create-enemy' });

    const startY = 140;
    const enemyKeys = Object.keys(enemyTypes);
    const cardWidth = 350;
    const cardHeight = 90;
    const cols = 2;
    const gap = 30;
    const startX = (CANVAS_WIDTH - (cols * cardWidth + (cols - 1) * gap)) / 2;

    enemyKeys.forEach((key, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardWidth + gap);
      const y = startY + row * (cardHeight + gap);

      if (y + cardHeight > CANVAS_HEIGHT - 50) return;

      buttons.push({
        id: `enemy-edit-${key}`,
        x: x,
        y: y,
        width: cardWidth,
        height: cardHeight,
        action: 'edit-enemy',
        enemyId: key
      });
    });
  } else if (adminPage === 'edit-enemy' && editingEnemy) {
    const panelWidth = 600;
    const panelX = (CANVAS_WIDTH - panelWidth) / 2;
    const startY = 140;

    // Champs de saisie
    const isNewEnemy = !editingEnemy.id || editingEnemy.id.trim() === '';
    const fields = [
      { field: 'id', y: 150, readOnly: !isNewEnemy },
      { field: 'name', y: 210 },
      { field: 'emoji', y: 270 },
      { field: 'hp', y: 330 },
      { field: 'speed', y: 390 },
      { field: 'global_resistance', y: 450 }
    ];

    fields.forEach(f => {
      if (!f.readOnly) {
        buttons.push({
          id: `enemy-field-${f.field}`,
          x: panelX + 40,
          y: startY + f.y + 5,
          width: panelWidth - 80,
          height: 40,
          action: 'enemy-field',
          fieldKey: f.field
        });
      }
    });

    // Boutons résistances (toggle dropdowns)
    const resistY = startY + 510;
    buttons.push({
      id: 'enemy-resistance1',
      x: panelX + 40,
      y: resistY + 5,
      width: 240,
      height: 40,
      action: 'toggle-resistance1'
    });

    buttons.push({
      id: 'enemy-resistance2',
      x: panelX + 320,
      y: resistY + 5,
      width: 240,
      height: 40,
      action: 'toggle-resistance2'
    });

    // Si dropdown résistance 1 est ouvert
    if (editingField === 'resistance1-dropdown') {
      const gemKeys = ['none', ...Object.keys(gemTypes).filter(k => k !== 'BASE')];
      let dropY = resistY + 50;
      gemKeys.forEach(key => {
        buttons.push({
          id: `res1-${key}`,
          x: panelX + 40,
          y: dropY,
          width: 240,
          height: 35,
          action: 'select-resistance1',
          gemId: key
        });
        dropY += 35;
      });
    }

    // Si dropdown résistance 2 est ouvert
    if (editingField === 'resistance2-dropdown') {
      const gemKeys = ['none', ...Object.keys(gemTypes).filter(k => k !== 'BASE')];
      let dropY = resistY + 50;
      gemKeys.forEach(key => {
        buttons.push({
          id: `res2-${key}`,
          x: panelX + 320,
          y: dropY,
          width: 240,
          height: 35,
          action: 'select-resistance2',
          gemId: key
        });
        dropY += 35;
      });
    }

    // Boutons en bas
    const buttonsY = startY + 660;

    // Bouton Enregistrer
    buttons.push({
      id: 'admin-save-enemy',
      x: panelX + panelWidth - 180,
      y: buttonsY,
      width: 160,
      height: 50,
      action: 'save-enemy'
    });

    // Bouton Supprimer (seulement si c'est une modification)
    if (!isNewEnemy) {
      buttons.push({
        id: 'admin-delete-enemy',
        x: panelX + 20,
        y: buttonsY,
        width: 160,
        height: 50,
        action: 'delete-enemy'
      });
    }
  } else if (adminPage === 'resistances') {
    // Boutons pour chaque case de résistance
    const startY = 120;
    const headerY = startY + 20;
    let y = headerY + 45;
    const enemyKeys = Object.keys(enemyTypes);
    const gemKeys = Object.keys(gemTypes).filter(k => k !== 'BASE');

    enemyKeys.forEach(enemyKey => {
      if (y > CANVAS_HEIGHT - 80) return;

      // Bouton résistance globale
      buttons.push({
        id: `global-resistance-${enemyKey}`,
        x: 165,
        y: y - 25,
        width: 75,
        height: 42,
        action: 'edit-global-resistance',
        enemyId: enemyKey
      });

      let gemX = 280;
      gemKeys.forEach(gemKey => {
        const boxSize = 35;
        buttons.push({
          id: `resistance-${enemyKey}-${gemKey}`,
          x: gemX,
          y: y - 22,
          width: boxSize,
          height: boxSize,
          action: 'toggle-resistance',
          enemyId: enemyKey,
          gemId: gemKey
        });
        gemX += 50;
      });

      y += 55;
    });
  } else if (adminPage === 'recipes') {
    buttons.push({ id: 'recipe-add', x: CANVAS_WIDTH - 160, y: 80, width: 140, height: 40, action: 'add-recipe' });

    let y = 145;
    fusionRecipes.forEach((recipe, index) => {
      if (y > CANVAS_HEIGHT - 80) return;

      // Bouton modifier
      buttons.push({
        id: `recipe-edit-${index}`,
        x: 740,
        y: y + 5,
        width: 70,
        height: 30,
        action: 'edit-recipe',
        recipeIndex: index,
        recipe: recipe
      });

      // Bouton supprimer
      buttons.push({
        id: `recipe-delete-${index}`,
        x: 820,
        y: y + 5,
        width: 70,
        height: 30,
        action: 'delete-recipe',
        recipeIndex: index,
        recipeId: recipe.id
      });
      y += 60;
    });
  } else if (adminPage === 'edit-gem' && editingGem) {
    const panelWidth = 600;
    const panelX = (CANVAS_WIDTH - panelWidth) / 2;
    const startY = 90;
    const fieldWidth = panelWidth - 60;
    const fieldHeight = 42;

    const fields = ['id', 'name', 'color', 'image', 'damage', 'speed', 'range', 'effect', 'icon', 'is_droppable', 'is_base'];
    let y = startY + 120;

    fields.forEach(key => {
      buttons.push({
        id: `field-${key}`,
        x: panelX + 30,
        y: y,
        width: fieldWidth,
        height: fieldHeight,
        action: 'edit-field',
        fieldKey: key
      });
      y += fieldHeight + 8;
    });

    const isNewGemButton = !editingGem.id || editingGem.id === 'NEW' || editingGem.id === '';

    if (!isNewGemButton) {
      // Bouton supprimer (uniquement si c'est une gemme existante)
      buttons.push({
        id: 'admin-delete-gem',
        x: panelX + 30,
        y: y + 15,
        width: 160,
        height: 45,
        action: 'delete-gem'
      });
    }

    // Bouton sauvegarder
    const saveX = isNewGemButton ? panelX + panelWidth / 2 - 80 : panelX + panelWidth - 190;
    buttons.push({
      id: 'admin-save',
      x: saveX,
      y: y + 15,
      width: 160,
      height: 45,
      action: 'save'
    });
  }

  return buttons;
};

// Liste des ennemis
const drawAdminEnemies = (ctx, enemyTypes, hoveredMenuButton) => {
  const startY = 140;

  // Bouton "Nouvel ennemi"
  drawStyledButton(ctx, CANVAS_WIDTH - 180, 80, 160, 40, '+ Nouvel ennemi',
    hoveredMenuButton === 'enemy-create', { fontSize: 'bold 14px Arial', variant: 'success' });

  if (!enemyTypes || Object.keys(enemyTypes).length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Aucun ennemi configuré', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    return;
  }

  const enemyKeys = Object.keys(enemyTypes);
  const cardWidth = 350;
  const cardHeight = 90;
  const cols = 2;
  const gap = 30;
  const startX = (CANVAS_WIDTH - (cols * cardWidth + (cols - 1) * gap)) / 2;

  enemyKeys.forEach((key, index) => {
    const enemy = enemyTypes[key];
    if (!enemy) return;

    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = startX + col * (cardWidth + gap);
    const y = startY + row * (cardHeight + gap);

    if (y + cardHeight > CANVAS_HEIGHT - 50) return;

    const isHovered = hoveredMenuButton === `enemy-edit-${key}`;

    // Carte ennemi
    ctx.fillStyle = isHovered ? 'rgba(51, 65, 85, 0.95)' : 'rgba(30, 41, 59, 0.8)';
    ctx.beginPath();
    ctx.roundRect(x, y, cardWidth, cardHeight, 10);
    ctx.fill();

    if (isHovered) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Emoji
    ctx.font = '36px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(enemy.emoji || '👾', x + 20, y + 50);

    // Nom
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 20px Arial';
    ctx.fillText(enemy.name || key, x + 80, y + 30);

    // Statistiques
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Arial';
    ctx.fillText(`HP: ${enemy.hp} | Vitesse: ${enemy.speed}`, x + 80, y + 55);

    // Résistances
    ctx.fillText(`Résistances: ${enemy.resistance1 || '?'}, ${enemy.resistance2 || '?'}`, x + 80, y + 75);
  });
};

// Éditeur d'ennemi
const drawAdminEditEnemy = (ctx, editingEnemy, hoveredMenuButton, gemTypes, editingField) => {
  const panelWidth = 600;
  const panelX = (CANVAS_WIDTH - panelWidth) / 2;
  const startY = 140;

  // Panneau principal
  ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
  ctx.beginPath();
  ctx.roundRect(panelX, startY, panelWidth, 620, 15);
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Emoji de l'ennemi
  ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
  ctx.beginPath();
  ctx.arc(panelX + 60, startY + 60, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = '32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(editingEnemy.emoji || '👾', panelX + 60, startY + 70);

  // Titre
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(editingEnemy.name || 'Nouvel ennemi', panelX + 120, startY + 50);

  ctx.fillStyle = '#64748b';
  ctx.font = '14px Arial';
  const isNewEnemy = !editingEnemy.id || editingEnemy.id === 'NEW';
  ctx.fillText(isNewEnemy ? 'Nouvel ennemi' : `Modification`, panelX + 120, startY + 75);

  // Champs du formulaire
  const fields = [
    { label: 'ID', value: editingEnemy.id || '', y: 150, field: 'id', readOnly: !isNewEnemy },
    { label: 'Nom', value: editingEnemy.name || '', y: 210, field: 'name' },
    { label: 'Emoji', value: editingEnemy.emoji || '👾', y: 270, field: 'emoji' },
    { label: 'HP', value: String(editingEnemy.hp || 100), y: 330, field: 'hp' },
    { label: 'Vitesse', value: String(editingEnemy.speed || 0.5), y: 390, field: 'speed' },
    { label: 'Résistance globale (%)', value: String((editingEnemy.global_resistance || 0.1) * 100), y: 450, field: 'global_resistance' }
  ];

  fields.forEach(f => {
    const fieldY = startY + f.y;
    const isHovered = hoveredMenuButton === `enemy-field-${f.field}`;

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(f.label, panelX + 40, fieldY - 5);

    // Champ
    ctx.fillStyle = isHovered ? 'rgba(51, 65, 85, 1)' : 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath();
    ctx.roundRect(panelX + 40, fieldY + 5, panelWidth - 80, 40, 8);
    ctx.fill();

    if (f.readOnly) {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = isHovered ? '#ef4444' : '#475569';
      ctx.lineWidth = isHovered ? 2 : 1;
    }
    ctx.stroke();

    // Valeur
    ctx.fillStyle = f.readOnly ? '#64748b' : '#f1f5f9';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(f.value || (f.readOnly ? '(généré auto)' : ''), panelX + 55, fieldY + 30);
  });

  // Résistances élémentaires (avec sélecteur de gemmes)
  const resistY = startY + 510;
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Résistances élémentaires (+20% chacune)', panelX + 40, resistY - 5);

  const gemKeys = Object.keys(gemTypes).filter(k => k !== 'BASE');
  const res1Hovered = hoveredMenuButton === 'enemy-resistance1';
  const res2Hovered = hoveredMenuButton === 'enemy-resistance2';

  // Résistance 1
  ctx.fillStyle = res1Hovered ? 'rgba(51, 65, 85, 1)' : 'rgba(15, 23, 42, 0.8)';
  ctx.beginPath();
  ctx.roundRect(panelX + 40, resistY + 5, 240, 40, 8);
  ctx.fill();
  ctx.strokeStyle = res1Hovered ? '#ef4444' : '#475569';
  ctx.lineWidth = res1Hovered ? 2 : 1;
  ctx.stroke();

  const gem1 = gemTypes[editingEnemy.resistance1];
  ctx.fillStyle = '#f1f5f9';
  ctx.font = '16px Arial';
  ctx.fillText(gem1 ? `${gem1.icon} ${editingEnemy.resistance1}` : 'Sélectionner...', panelX + 55, resistY + 30);

  // Résistance 2
  ctx.fillStyle = res2Hovered ? 'rgba(51, 65, 85, 1)' : 'rgba(15, 23, 42, 0.8)';
  ctx.beginPath();
  ctx.roundRect(panelX + 320, resistY + 5, 240, 40, 8);
  ctx.fill();
  ctx.strokeStyle = res2Hovered ? '#ef4444' : '#475569';
  ctx.lineWidth = res2Hovered ? 2 : 1;
  ctx.stroke();

  const gem2 = gemTypes[editingEnemy.resistance2];
  ctx.fillStyle = '#f1f5f9';
  ctx.font = '16px Arial';
  ctx.fillText(gem2 ? `${gem2.icon} ${editingEnemy.resistance2}` : 'Sélectionner...', panelX + 335, resistY + 30);

  // Dropdown résistance 1
  if (editingField === 'resistance1-dropdown') {
    const dropdownX = panelX + 40;
    const dropdownY = resistY + 50;
    const dropdownWidth = 240;
    const allGemKeys = ['none', ...Object.keys(gemTypes).filter(k => k !== 'BASE')];
    const itemHeight = 35;
    const dropdownHeight = allGemKeys.length * itemHeight;

    // Fond du dropdown
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.beginPath();
    ctx.roundRect(dropdownX, dropdownY, dropdownWidth, dropdownHeight, 8);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Items
    allGemKeys.forEach((key, index) => {
      const itemY = dropdownY + index * itemHeight;
      const isHovered = hoveredMenuButton === `res1-${key}`;

      if (isHovered) {
        ctx.fillStyle = 'rgba(51, 65, 85, 1)';
        ctx.fillRect(dropdownX, itemY, dropdownWidth, itemHeight);
      }

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '14px Arial';
      const displayText = key === 'none' ? 'Aucune' : (gemTypes[key] ? `${gemTypes[key].icon} ${key}` : key);
      ctx.fillText(displayText, dropdownX + 10, itemY + 22);
    });
  }

  // Dropdown résistance 2
  if (editingField === 'resistance2-dropdown') {
    const dropdownX = panelX + 320;
    const dropdownY = resistY + 50;
    const dropdownWidth = 240;
    const allGemKeys = ['none', ...Object.keys(gemTypes).filter(k => k !== 'BASE')];
    const itemHeight = 35;
    const dropdownHeight = allGemKeys.length * itemHeight;

    // Fond du dropdown
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.beginPath();
    ctx.roundRect(dropdownX, dropdownY, dropdownWidth, dropdownHeight, 8);
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Items
    allGemKeys.forEach((key, index) => {
      const itemY = dropdownY + index * itemHeight;
      const isHovered = hoveredMenuButton === `res2-${key}`;

      if (isHovered) {
        ctx.fillStyle = 'rgba(51, 65, 85, 1)';
        ctx.fillRect(dropdownX, itemY, dropdownWidth, itemHeight);
      }

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '14px Arial';
      const displayText = key === 'none' ? 'Aucune' : (gemTypes[key] ? `${gemTypes[key].icon} ${key}` : key);
      ctx.fillText(displayText, dropdownX + 10, itemY + 22);
    });
  }

  // Boutons en bas
  const buttonsY = startY + 660;
  const saveButtonHovered = hoveredMenuButton === 'admin-save-enemy';
  const deleteButtonHovered = hoveredMenuButton === 'admin-delete-enemy';

  // Bouton Enregistrer
  drawStyledButton(
    ctx,
    panelX + panelWidth - 180,
    buttonsY,
    160,
    50,
    'Enregistrer',
    saveButtonHovered,
    { fontSize: 'bold 16px Arial', variant: 'primary' }
  );

  // Bouton Supprimer (seulement si c'est une modification)
  if (!isNewEnemy) {
    drawStyledButton(
      ctx,
      panelX + 20,
      buttonsY,
      160,
      50,
      'Supprimer',
      deleteButtonHovered,
      { fontSize: 'bold 16px Arial', variant: 'danger' }
    );
  }
};
