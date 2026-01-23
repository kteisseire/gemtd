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

try {
  db.exec(`ALTER TABLE gems ADD COLUMN image TEXT NOT NULL DEFAULT '/images/gemviolette.png'`);
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

// Créer la table des types d'ennemis
db.exec(`
  CREATE TABLE IF NOT EXISTS enemy_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hp INTEGER NOT NULL,
    speed REAL NOT NULL,
    resistance1 TEXT,
    resistance2 TEXT,
    emoji TEXT NOT NULL
  )
`);

// Créer la table des vagues
db.exec(`
  CREATE TABLE IF NOT EXISTS waves (
    wave_number INTEGER PRIMARY KEY,
    enemy_type_id TEXT NOT NULL,
    enemy_count INTEGER NOT NULL,
    FOREIGN KEY (enemy_type_id) REFERENCES enemy_types(id)
  )
`);

// Initialiser les types d'ennemis par défaut si la table est vide
const enemyCount = db.prepare('SELECT COUNT(*) as count FROM enemy_types').get();
if (enemyCount.count === 0) {
  const insertEnemy = db.prepare(`
    INSERT INTO enemy_types (id, name, hp, speed, resistance1, resistance2, emoji)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertEnemy.run('GOBLIN', 'Goblin', 100, 0.5, 'RED', 'YELLOW', '👺');
  insertEnemy.run('ORC', 'Orc', 180, 0.4, 'GREEN', 'ORANGE', '👹');
  insertEnemy.run('TROLL', 'Troll', 300, 0.35, 'BLUE', 'PURPLE', '👾');
  insertEnemy.run('DEMON', 'Démon', 450, 0.5, 'PURPLE', 'PINK', '😈');
  insertEnemy.run('DRAGON', 'Dragon', 700, 0.45, 'RED', 'BLACK', '🐉');
}

// Initialiser les 5 premières vagues si la table est vide
const waveCount = db.prepare('SELECT COUNT(*) as count FROM waves').get();
if (waveCount.count === 0) {
  const insertWave = db.prepare(`
    INSERT INTO waves (wave_number, enemy_type_id, enemy_count)
    VALUES (?, ?, ?)
  `);

  insertWave.run(1, 'GOBLIN', 10);
  insertWave.run(2, 'GOBLIN', 15);
  insertWave.run(3, 'ORC', 12);
  insertWave.run(4, 'ORC', 18);
  insertWave.run(5, 'TROLL', 10);
}

export default db;
