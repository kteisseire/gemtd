// Dessine un bouton stylise avec degradees et effets
export const drawStyledButton = (ctx, x, y, width, height, text, isHovered = false, options = {}) => {
  const { icon = '', fontSize = 'bold 22px Arial', disabled = false, variant = 'primary', active = false } = options;

  // Variants: 'primary' (bleu), 'danger' (rouge), 'success' (vert)

  // Ombre portee (plus prononcee au hover)
  ctx.shadowColor = isHovered ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = isHovered ? 15 : 10;
  ctx.shadowOffsetY = isHovered ? 7 : 5;

  // Bordure exterieure doree epaisse
  const borderGradient = ctx.createLinearGradient(x, y, x, y + height);
  if (active) {
    // Bordure verte pour l'etat actif
    borderGradient.addColorStop(0, '#34d399');
    borderGradient.addColorStop(0.5, '#10b981');
    borderGradient.addColorStop(1, '#059669');
  } else if (disabled) {
    // Bordure grise pour disabled
    borderGradient.addColorStop(0, '#6b7280');
    borderGradient.addColorStop(0.5, '#4b5563');
    borderGradient.addColorStop(1, '#374151');
  } else {
    // Bordure doree normale
    borderGradient.addColorStop(0, '#fbbf24');
    borderGradient.addColorStop(0.5, '#f59e0b');
    borderGradient.addColorStop(1, '#b45309');
  }
  ctx.fillStyle = borderGradient;
  ctx.beginPath();
  ctx.roundRect(x - 3, y - 3, width + 6, height + 6, 10);
  ctx.fill();

  // Reinitialiser l'ombre
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Fond du bouton avec degrade selon le variant
  const bgGradient = ctx.createLinearGradient(x, y, x, y + height);

  if (disabled) {
    bgGradient.addColorStop(0, '#4b5563');
    bgGradient.addColorStop(1, '#1f2937');
  } else if (variant === 'danger') {
    // Rouge nuance pour actions negatives (plus proche du violet-rouge)
    if (isHovered) {
      bgGradient.addColorStop(0, '#9f1239'); // Rouge rose plus doux
      bgGradient.addColorStop(1, '#581c87'); // Violet fonce
    } else {
      bgGradient.addColorStop(0, '#be123c'); // Rose-rouge
      bgGradient.addColorStop(1, '#701a75'); // Violet-rouge fonce
    }
  } else if (variant === 'success') {
    // Vert nuance pour actions positives (plus proche du cyan-vert)
    if (isHovered) {
      bgGradient.addColorStop(0, '#0d9488'); // Cyan-vert
      bgGradient.addColorStop(1, '#134e4a'); // Vert sombre
    } else {
      bgGradient.addColorStop(0, '#14b8a6'); // Turquoise
      bgGradient.addColorStop(1, '#115e59'); // Cyan fonce
    }
  } else {
    // Bleu par defaut (primary)
    if (active) {
      // Plus lumineux quand actif
      bgGradient.addColorStop(0, '#2563eb');
      bgGradient.addColorStop(1, '#1e40af');
    } else if (isHovered) {
      bgGradient.addColorStop(0, '#1e3a8a');
      bgGradient.addColorStop(1, '#0c1e4a');
    } else {
      bgGradient.addColorStop(0, '#1e40af');
      bgGradient.addColorStop(1, '#1e293b');
    }
  }
  ctx.fillStyle = bgGradient;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 7);
  ctx.fill();

  // Bordure interieure brillante
  if (active) {
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.9)'; // Cyan-vert pour actif (plus doux)
    ctx.lineWidth = 3;
  } else if (disabled) {
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
    ctx.lineWidth = 2;
  } else {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.lineWidth = 2;
  }
  ctx.stroke();

  // Reflet lumineux en haut (plus intense au hover)
  if (!disabled) {
    const highlightGradient = ctx.createLinearGradient(x, y, x, y + height / 3);
    const intensity = isHovered ? 0.4 : 0.3;
    highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height / 3, 7);
    ctx.fill();
  }

  // Texte avec effet dore
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 2;

  const textGradient = ctx.createLinearGradient(x, y, x, y + height);
  if (disabled) {
    textGradient.addColorStop(0, '#9ca3af');
    textGradient.addColorStop(1, '#6b7280');
  } else if (active) {
    // Texte plus lumineux quand actif
    textGradient.addColorStop(0, '#ffffff');
    textGradient.addColorStop(0.5, '#fef3c7');
    textGradient.addColorStop(1, '#fbbf24');
  } else {
    textGradient.addColorStop(0, '#fef3c7');
    textGradient.addColorStop(0.5, '#fbbf24');
    textGradient.addColorStop(1, '#f59e0b');
  }
  ctx.fillStyle = textGradient;
  ctx.font = fontSize;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon ? `${icon} ${text}` : text, x + width / 2, y + height / 2);

  // Reinitialiser l'ombre
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
};
