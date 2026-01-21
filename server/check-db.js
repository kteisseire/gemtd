import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'game.db'));

// Lister toutes les tables
console.log('📋 Tables existantes:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
tables.forEach(t => console.log(`  - ${t.name}`));

// Vérifier si la table leaderboard existe
const leaderboardExists = tables.some(t => t.name === 'leaderboard');

if (leaderboardExists) {
  console.log('\n✅ Table leaderboard existe');

  // Afficher sa structure
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='leaderboard'").get();
  console.log('\n📊 Structure:');
  console.log(schema.sql);

  // Compter les entrées
  const count = db.prepare("SELECT COUNT(*) as count FROM leaderboard").get();
  console.log(`\n📈 Nombre d'entrées: ${count.count}`);

  // Afficher les 5 premiers scores
  if (count.count > 0) {
    const scores = db.prepare("SELECT * FROM leaderboard ORDER BY score DESC LIMIT 5").all();
    console.log('\n🏆 Top 5:');
    scores.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.pseudo} - ${s.score} pts (Wave ${s.wave})`);
    });
  }
} else {
  console.log('\n❌ Table leaderboard n\'existe pas!');
  console.log('🔧 Création de la table...');

  // Créer la table
  db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pseudo TEXT NOT NULL,
      score INTEGER NOT NULL,
      wave INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Créer l'index
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC)
  `);

  console.log('✅ Table leaderboard créée avec succès!');
}

db.close();
