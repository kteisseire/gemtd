import { COLS, ROWS, GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, TOOLBAR_HEIGHT } from '../config/constants';

// Creer le cache du fond d'herbe
export const createGrassCache = (grassImage, grassCanvasRef) => {
  if (grassCanvasRef.current) return;

  const grassCanvas = document.createElement('canvas');
  grassCanvas.width = COLS * GRID_SIZE;
  grassCanvas.height = ROWS * GRID_SIZE;
  const grassCtx = grassCanvas.getContext('2d');

  if (grassImage) {
    const pattern = grassCtx.createPattern(grassImage, 'repeat');
    if (pattern) {
      grassCtx.fillStyle = pattern;
      grassCtx.fillRect(0, 0, COLS * GRID_SIZE, ROWS * GRID_SIZE);
    }
  } else {
    // Fallback: rendu procedural
    const pseudoRandom = (x, y, seed) => {
      const value = Math.sin(x * 12.9898 + y * 78.233 + seed * 43758.5453) * 43758.5453;
      return value - Math.floor(value);
    };

    const grassColors = ['#4a7c3a', '#5a8c4a', '#3a6c2a', '#5a9c4a', '#4a8c3a'];

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const colorIndex = Math.floor(pseudoRandom(x, y, 1) * grassColors.length);
        grassCtx.fillStyle = grassColors[colorIndex];
        grassCtx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      }
    }
  }

  // Ajouter la grille au cache
  grassCtx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  grassCtx.lineWidth = 1.5;
  for (let i = 0; i <= COLS; i++) {
    grassCtx.beginPath();
    grassCtx.moveTo(i * GRID_SIZE, 0);
    grassCtx.lineTo(i * GRID_SIZE, ROWS * GRID_SIZE);
    grassCtx.stroke();
  }
  for (let i = 0; i <= ROWS; i++) {
    grassCtx.beginPath();
    grassCtx.moveTo(0, i * GRID_SIZE);
    grassCtx.lineTo(COLS * GRID_SIZE, i * GRID_SIZE);
    grassCtx.stroke();
  }

  grassCanvasRef.current = grassCanvas;
};

// Dessiner le fond d'herbe
export const drawGrassBackground = (ctx, camera, zoom, grassCanvasRef) => {
  if (!grassCanvasRef.current) return;
  ctx.save();
  ctx.translate(camera.x, camera.y + TOOLBAR_HEIGHT);
  ctx.scale(zoom, zoom);
  ctx.drawImage(grassCanvasRef.current, 0, 0);
  ctx.restore();
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
