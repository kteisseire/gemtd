// Script direct pour ajouter GOLD - À exécuter quand le serveur API est ARRÊTÉ
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Script d\'ajout direct de la gemme GOLD');
console.log('⚠️  ATTENTION: Ce script doit être exécuté quand le serveur API est ARRÊTÉ\n');

try {
  // Ouvrir la base de données
  const db = new Database(join(__dirname, 'game.db'));

  // Vérifier si GOLD existe déjà
  const existingGold = db.prepare('SELECT * FROM gems WHERE id = ?').get('GOLD');

  if (existingGold) {
    console.log('✅ La gemme GOLD existe déjà dans la base de données');
  } else {
    // Insérer la gemme GOLD
    console.log('📝 Insertion de la gemme GOLD...');
    db.prepare(`
      INSERT INTO gems (id, name, color, damage, speed, range, effect, icon, is_droppable, is_base)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('GOLD', 'Or', '#ffd700', 200, 500, 180, 'all', '💰', 0, 0);
    console.log('✅ Gemme GOLD ajoutée avec succès');
  }

  // Vérifier si la recette GOLD existe déjà
  const existingRecipe = db.prepare('SELECT * FROM fusion_recipes WHERE result_gem_id = ?').get('GOLD');

  if (existingRecipe) {
    console.log('✅ La recette de fusion GOLD existe déjà');
  } else {
    // Insérer la recette de fusion
    console.log('📝 Insertion de la recette de fusion GOLD...');
    db.prepare(`
      INSERT INTO fusion_recipes (result_gem_id, required_gems, min_count)
      VALUES (?, ?, ?)
    `).run('GOLD', 'SILVER,RED,ORANGE', 3);
    console.log('✅ Recette de fusion GOLD ajoutée avec succès');
  }

  // Afficher les données insérées
  console.log('\n📊 Données de la gemme GOLD:');
  const gold = db.prepare('SELECT * FROM gems WHERE id = ?').get('GOLD');
  console.log(gold);

  console.log('\n📊 Recette de fusion GOLD:');
  const recipe = db.prepare('SELECT * FROM fusion_recipes WHERE result_gem_id = ?').get('GOLD');
  console.log(recipe);

  db.close();

  console.log('\n✨ Terminé! Vous pouvez maintenant redémarrer le serveur API.');

} catch (error) {
  console.error('❌ Erreur:', error.message);
  if (error.code === 'SQLITE_BUSY') {
    console.log('\n⚠️  La base de données est verrouillée.');
    console.log('   Arrêtez tous les serveurs Node.js et réessayez.');
  }
  process.exit(1);
}
