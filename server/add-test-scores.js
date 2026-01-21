import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'game.db'));

console.log('🎮 Ajout de scores de test...\n');

const testScores = [
  { pseudo: 'Alice', score: 15000, wave: 25 },
  { pseudo: 'Bob', score: 12500, wave: 22 },
  { pseudo: 'Charlie', score: 10000, wave: 18 },
  { pseudo: 'Diana', score: 8500, wave: 15 },
  { pseudo: 'Eve', score: 7000, wave: 12 },
  { pseudo: 'Frank', score: 5500, wave: 10 },
  { pseudo: 'Grace', score: 4000, wave: 8 },
  { pseudo: 'Henry', score: 2500, wave: 6 },
  { pseudo: 'Iris', score: 1500, wave: 4 },
  { pseudo: 'Jack', score: 500, wave: 2 }
];

const insert = db.prepare(`
  INSERT INTO leaderboard (pseudo, score, wave)
  VALUES (?, ?, ?)
`);

testScores.forEach(score => {
  insert.run(score.pseudo, score.score, score.wave);
  console.log(`✅ ${score.pseudo}: ${score.score} pts (Wave ${score.wave})`);
});

console.log('\n🏆 Top 10:');
const top10 = db.prepare(`
  SELECT pseudo, score, wave
  FROM leaderboard
  ORDER BY score DESC
  LIMIT 10
`).all();

top10.forEach((entry, index) => {
  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
  console.log(`${medal} #${index + 1} ${entry.pseudo} - ${entry.score} pts (Wave ${entry.wave})`);
});

db.close();
console.log('\n✨ Scores de test ajoutés avec succès!');
