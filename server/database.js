import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'game.db'));

// Créer la table des gemmes
db.exec(`
  CREATE TABLE IF NOT EXISTS gems (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    damage INTEGER NOT NULL,
    speed INTEGER NOT NULL,
    range INTEGER NOT NULL,
    effect TEXT NOT NULL,
    icon TEXT NOT NULL,
    is_droppable INTEGER NOT NULL DEFAULT 0,
    is_base INTEGER NOT NULL DEFAULT 0
  )
`);

// Ajouter les colonnes si elles n'existent pas (pour migration)
try {
  db.exec(`ALTER TABLE gems ADD COLUMN is_droppable INTEGER NOT NULL DEFAULT 0`);
} catch (e) { /* colonne existe déjà */ }

try {
  db.exec(`ALTER TABLE gems ADD COLUMN is_base INTEGER NOT NULL DEFAULT 0`);
} catch (e) { /* colonne existe déjà */ }

// Créer la table des recettes de fusion
db.exec(`
  CREATE TABLE IF NOT EXISTS fusion_recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    result_gem_id TEXT NOT NULL,
    required_gems TEXT NOT NULL,
    min_count INTEGER NOT NULL DEFAULT 3,
    FOREIGN KEY (result_gem_id) REFERENCES gems(id)
  )
`);

// Créer la table du leaderboard
db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pseudo TEXT NOT NULL,
    score INTEGER NOT NULL,
    wave INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Créer un index pour optimiser les requêtes de tri par score
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC)
`);

export default db;
