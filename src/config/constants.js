// Configuration de la grille
export const GRID_SIZE = 40;
export const COLS = 38;
export const ROWS = 30;
export const TOOLBAR_HEIGHT = 50;
export const CANVAS_WIDTH = COLS * GRID_SIZE;
export const CANVAS_HEIGHT = ROWS * GRID_SIZE + TOOLBAR_HEIGHT;

// Point de spawn et objectif (spawn: 4x4, goal: 4x4)
export const SPAWN_POINT = { x: 0, y: 14 };
export const GOAL_POINT = { x: 21, y: 0 };

// Checkpoints (zones 2x2)
export const CHECKPOINTS = [
  { x: 10, y: 15, name: 'CP1' },
  { x: 10, y: 27, name: 'CP2' },
  { x: 35, y: 27, name: 'CP3' },
  { x: 35, y: 15, name: 'CP4' },
  { x: 22, y: 15, name: 'CP5' },
];

// Gemmes par defaut (utilisees si l'API n'est pas disponible)
export const DEFAULT_GEM_TYPES = {
  BASE: { name: 'Base', color: '#94a3b8', damage: 0, speed: 1500, range: 80, effect: 'none', icon: '⚪', is_droppable: false, is_base: true },
  RED: { name: 'Feu', color: '#ef4444', damage: 20, speed: 1000, range: 100, effect: 'damage', icon: '🔥', is_droppable: true, is_base: false },
  BLUE: { name: 'Glace', color: '#3b82f6', damage: 10, speed: 1200, range: 120, effect: 'slow', icon: '❄️', is_droppable: true, is_base: false },
  GREEN: { name: 'Poison', color: '#22c55e', damage: 5, speed: 800, range: 90, effect: 'poison', icon: '☠️', is_droppable: true, is_base: false },
  YELLOW: { name: 'Foudre', color: '#eab308', damage: 15, speed: 600, range: 110, effect: 'fast', icon: '⚡', is_droppable: true, is_base: false },
  PURPLE: { name: 'Arcane', color: '#a855f7', damage: 25, speed: 1400, range: 130, effect: 'magic', icon: '🔮', is_droppable: true, is_base: false },
  ORANGE: { name: 'Explosion', color: '#f97316', damage: 18, speed: 1800, range: 80, effect: 'aoe', icon: '💥', is_droppable: true, is_base: false },
  CYAN: { name: 'Eau', color: '#06b6d4', damage: 8, speed: 400, range: 100, effect: 'rapid', icon: '💧', is_droppable: true, is_base: false },
  PINK: { name: 'Lumiere', color: '#ec4899', damage: 30, speed: 1500, range: 110, effect: 'crit', icon: '✨', is_droppable: true, is_base: false },
  GRAY: { name: 'Pierre', color: '#6b7280', damage: 12, speed: 2000, range: 90, effect: 'stun', icon: '🗿', is_droppable: true, is_base: false },
  BLACK: { name: 'Ombre', color: '#1f2937', damage: 16, speed: 1100, range: 120, effect: 'chain', icon: '🌑', is_droppable: true, is_base: false },
};

// Niveaux de zoom
export const ZOOM_LEVELS = [
  Math.min(CANVAS_WIDTH / (COLS * GRID_SIZE), (CANVAS_HEIGHT - TOOLBAR_HEIGHT) / (ROWS * GRID_SIZE)),
  1600 / (30 * GRID_SIZE),
  1600 / (24 * GRID_SIZE),
  1600 / (18 * GRID_SIZE),
  1600 / (12 * GRID_SIZE),
  1600 / (6 * GRID_SIZE),
];

// Options de vitesse
export const SPEED_OPTIONS = [0.5, 1, 2, 3, 5, 10];

// Emojis des ennemis
export const ENEMY_EMOJIS = ['🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐷'];

// Noms des effets
export const EFFECT_NAMES = {
  'none': 'Aucun',
  'damage': 'Brulure',
  'slow': 'Ralentissement',
  'poison': 'Poison',
  'fast': 'Cadence+',
  'magic': 'Magique',
  'aoe': 'Zone',
  'rapid': 'Rafale',
  'crit': 'Critique',
  'stun': 'Etourdissement',
  'chain': 'Chaine'
};

// Detection des zones
export const isInSpawnZone = (x, y) => x >= 0 && x <= 3 && y >= 14 && y <= 17;
export const isInGoalZone = (x, y) => x >= 21 && x <= 24 && y >= 0 && y <= 3;
export const isInCheckpointZone = (x, y) => {
  return CHECKPOINTS.some(cp => x >= cp.x && x <= cp.x + 1 && y >= cp.y && y <= cp.y + 1);
};
