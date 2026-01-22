import { COLS, ROWS, CANVAS_WIDTH, CANVAS_HEIGHT, TOOLBAR_HEIGHT, ISO_TILE_WIDTH, ISO_TILE_HEIGHT, ISO_TILE_DEPTH, ISO_OFFSET_X, ISO_OFFSET_Y, isInSpawnZone, isInGoalZone, isInCheckpointZone } from '../config/constants';

// Creer le cache du fond d'herbe (en isométrique)
export const createGrassCache = (grassImage, grassCanvasRef) => {
  if (grassCanvasRef.current) return;

  // Calculer les dimensions de la grille isométrique
  const isoWidth = (COLS + ROWS - 2) * (ISO_TILE_WIDTH / 2);
  const isoHeight = (COLS + ROWS - 2) * (ISO_TILE_HEIGHT / 2);

  // Créer un canvas plus grand que la grille pour couvrir toute la zone
  const grassCanvas = document.createElement('canvas');
  grassCanvas.width = isoWidth * 1.5;  // 50% plus large
  grassCanvas.height = isoHeight * 1.5; // 50% plus haut
  const grassCtx = grassCanvas.getContext('2d');

  // Remplir tout le canvas avec la texture d'herbe
  if (grassImage) {
    const pattern = grassCtx.createPattern(grassImage, 'repeat');
    if (pattern) {
      grassCtx.fillStyle = pattern;
      grassCtx.fillRect(0, 0, grassCanvas.width, grassCanvas.height);
    }
  } else {
    // Fallback: couleur unie verte
    grassCtx.fillStyle = '#4a7c3a';
    grassCtx.fillRect(0, 0, grassCanvas.width, grassCanvas.height);
  }

  grassCanvasRef.current = grassCanvas;
};

// Dessiner le fond d'herbe
export const drawGrassBackground = (ctx, grassCanvasRef) => {
  if (!grassCanvasRef.current) return;

  // Calculer les dimensions de la grille isométrique
  const isoWidth = (COLS + ROWS - 2) * (ISO_TILE_WIDTH / 2);
  const isoHeight = (COLS + ROWS - 2) * (ISO_TILE_HEIGHT / 2);

  // Calculer le décalage pour centrer le fond par rapport à la grille
  const grassWidth = grassCanvasRef.current.width;
  const grassHeight = grassCanvasRef.current.height;
  const offsetX = -(grassWidth - isoWidth) / 2;
  const offsetY = -(grassHeight - isoHeight) / 2 - TOOLBAR_HEIGHT;

  // Dessiner le fond d'herbe qui suit la transformation de caméra
  ctx.drawImage(
    grassCanvasRef.current,
    offsetX,
    offsetY,
    grassWidth,
    grassHeight
  );
};

// Effacer le canvas
export const clearCanvas = (ctx) => {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
};

// Appliquer la transformation camera
export const applyCameraTransform = (ctx, camera, zoom) => {
  ctx.save();
  ctx.translate(camera.x, camera.y + TOOLBAR_HEIGHT);
  ctx.scale(zoom, zoom);
};

// Restaurer le contexte
export const restoreCameraTransform = (ctx) => {
  ctx.restore();
};

// Convertir les coordonnées de grille en coordonnées isométriques
export const gridToIso = (gridX, gridY) => {
  // Offset pour que le point (0, ROWS-1) soit à x=0
  const offsetX = (ROWS - 1) * (ISO_TILE_WIDTH / 2);

  const isoX = (gridX - gridY) * (ISO_TILE_WIDTH / 2) + offsetX + ISO_OFFSET_X;
  const isoY = (gridX + gridY) * (ISO_TILE_HEIGHT / 2) + ISO_OFFSET_Y;
  return { isoX, isoY };
};

// Convertir les coordonnées isométriques en coordonnées de grille
export const isoToGrid = (isoX, isoY) => {
  // Annuler les offsets appliqués dans gridToIso
  const offsetX = (ROWS - 1) * (ISO_TILE_WIDTH / 2);
  const adjustedIsoX = isoX - offsetX - ISO_OFFSET_X;
  const adjustedIsoY = isoY - ISO_OFFSET_Y;

  const gridX = (adjustedIsoX / (ISO_TILE_WIDTH / 2) + adjustedIsoY / (ISO_TILE_HEIGHT / 2)) / 2;
  const gridY = (adjustedIsoY / (ISO_TILE_HEIGHT / 2) - adjustedIsoX / (ISO_TILE_WIDTH / 2)) / 2;
  return { gridX: Math.floor(gridX), gridY: Math.floor(gridY) };
};

// Dessiner une tuile isométrique
export const drawIsoTile = (ctx, gridX, gridY, color, alpha = 1) => {
  const { isoX, isoY } = gridToIso(gridX, gridY);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;

  // Dessiner le losange de la tuile
  ctx.beginPath();
  ctx.moveTo(isoX, isoY);
  ctx.lineTo(isoX + ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2);
  ctx.lineTo(isoX, isoY + ISO_TILE_HEIGHT);
  ctx.lineTo(isoX - ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fill();

  // Contour de la tuile
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
};

// Dessiner une tuile isométrique avec effet de profondeur (3D)
export const drawIsoTile3D = (ctx, gridX, gridY, color, alpha = 1) => {
  const { isoX, isoY } = gridToIso(gridX, gridY);

  ctx.save();
  ctx.globalAlpha = alpha;

  // Face supérieure (losange)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(isoX, isoY);
  ctx.lineTo(isoX + ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2);
  ctx.lineTo(isoX, isoY + ISO_TILE_HEIGHT);
  ctx.lineTo(isoX - ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Face droite (effet 3D)
  const darkerColor = shadeColor(color, -20);
  ctx.fillStyle = darkerColor;
  ctx.beginPath();
  ctx.moveTo(isoX + ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2);
  ctx.lineTo(isoX, isoY + ISO_TILE_HEIGHT);
  ctx.lineTo(isoX, isoY + ISO_TILE_HEIGHT + ISO_TILE_DEPTH);
  ctx.lineTo(isoX + ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2 + ISO_TILE_DEPTH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Face gauche (effet 3D, encore plus sombre)
  const darkestColor = shadeColor(color, -40);
  ctx.fillStyle = darkestColor;
  ctx.beginPath();
  ctx.moveTo(isoX - ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2);
  ctx.lineTo(isoX, isoY + ISO_TILE_HEIGHT);
  ctx.lineTo(isoX, isoY + ISO_TILE_HEIGHT + ISO_TILE_DEPTH);
  ctx.lineTo(isoX - ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2 + ISO_TILE_DEPTH);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
};

// Fonction utilitaire pour assombrir/éclaircir une couleur
const shadeColor = (color, percent) => {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.max(0, Math.min(255, R + (R * percent) / 100));
  G = Math.max(0, Math.min(255, G + (G * percent) / 100));
  B = Math.max(0, Math.min(255, B + (B * percent) / 100));

  const RR = R.toString(16).padStart(2, '0');
  const GG = G.toString(16).padStart(2, '0');
  const BB = B.toString(16).padStart(2, '0');

  return `#${RR}${GG}${BB}`;
};

// Dessiner la grille isométrique
export const drawIsoGrid = (ctx) => {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 1.5;

  // Dessiner toutes les tuiles de la grille
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      // Ne pas dessiner la grille sur les zones interdites
      if (isInSpawnZone(x, y) || isInGoalZone(x, y) || isInCheckpointZone(x, y)) {
        continue;
      }

      const { isoX, isoY } = gridToIso(x, y);

      // Dessiner le losange de la tuile
      ctx.beginPath();
      ctx.moveTo(isoX, isoY);
      ctx.lineTo(isoX + ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2);
      ctx.lineTo(isoX, isoY + ISO_TILE_HEIGHT);
      ctx.lineTo(isoX - ISO_TILE_WIDTH / 2, isoY + ISO_TILE_HEIGHT / 2);
      ctx.closePath();
      ctx.stroke();
    }
  }
};
