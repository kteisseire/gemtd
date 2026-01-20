import db from './database.js';

// Données initiales des gemmes (issues du code actuel)
// is_droppable: 1 = peut être obtenue aléatoirement lors du placement d'une tour
// is_base: 1 = c'est la gemme de base (socle vide)
const initialGems = [
  { id: 'BASE', name: 'Base', color: '#94a3b8', damage: 0, speed: 1500, range: 80, effect: 'none', icon: '⚪', is_droppable: 0, is_base: 1 },
  { id: 'RED', name: 'Feu', color: '#ef4444', damage: 20, speed: 1000, range: 100, effect: 'damage', icon: '🔥', is_droppable: 1, is_base: 0 },
  { id: 'BLUE', name: 'Glace', color: '#3b82f6', damage: 10, speed: 1200, range: 120, effect: 'slow', icon: '❄️', is_droppable: 1, is_base: 0 },
  { id: 'GREEN', name: 'Poison', color: '#22c55e', damage: 5, speed: 800, range: 90, effect: 'poison', icon: '☠️', is_droppable: 1, is_base: 0 },
  { id: 'YELLOW', name: 'Foudre', color: '#eab308', damage: 15, speed: 600, range: 110, effect: 'fast', icon: '⚡', is_droppable: 1, is_base: 0 },
  { id: 'PURPLE', name: 'Arcane', color: '#a855f7', damage: 25, speed: 1400, range: 130, effect: 'magic', icon: '🔮', is_droppable: 1, is_base: 0 },
  { id: 'ORANGE', name: 'Explosion', color: '#f97316', damage: 18, speed: 1800, range: 80, effect: 'aoe', icon: '💥', is_droppable: 1, is_base: 0 },
  { id: 'CYAN', name: 'Eau', color: '#06b6d4', damage: 8, speed: 400, range: 100, effect: 'rapid', icon: '💧', is_droppable: 1, is_base: 0 },
  { id: 'PINK', name: 'Lumière', color: '#ec4899', damage: 30, speed: 1500, range: 110, effect: 'crit', icon: '✨', is_droppable: 1, is_base: 0 },
  { id: 'GRAY', name: 'Pierre', color: '#6b7280', damage: 12, speed: 2000, range: 90, effect: 'stun', icon: '🗿', is_droppable: 1, is_base: 0 },
  { id: 'BLACK', name: 'Ombre', color: '#1f2937', damage: 16, speed: 1100, range: 120, effect: 'chain', icon: '🌑', is_droppable: 1, is_base: 0 },
  // Gemme de fusion (obtenue uniquement par fusion, pas droppable)
  { id: 'SILVER', name: 'Argent', color: '#c0c0c0', damage: 150, speed: 800, range: 150, effect: 'slow,crit,magic,fast', icon: '🪙', is_droppable: 0, is_base: 0 }
];

// Recettes de fusion
const fusionRecipes = [
  { result_gem_id: 'SILVER', required_gems: 'BLUE,PINK,PURPLE,YELLOW', min_count: 3 }
];

// Vérifier si les données existent déjà
const count = db.prepare('SELECT COUNT(*) as count FROM gems').get();

if (count.count === 0) {
  console.log('Initialisation de la base de données avec les gemmes...');

  const insert = db.prepare(`
    INSERT INTO gems (id, name, color, damage, speed, range, effect, icon, is_droppable, is_base)
    VALUES (@id, @name, @color, @damage, @speed, @range, @effect, @icon, @is_droppable, @is_base)
  `);

  const insertMany = db.transaction((gems) => {
    for (const gem of gems) {
      insert.run(gem);
    }
  });

  insertMany(initialGems);
  console.log(`${initialGems.length} gemmes insérées dans la base de données.`);

  // Insérer les recettes de fusion
  const insertRecipe = db.prepare(`
    INSERT INTO fusion_recipes (result_gem_id, required_gems, min_count)
    VALUES (@result_gem_id, @required_gems, @min_count)
  `);

  const insertRecipes = db.transaction((recipes) => {
    for (const recipe of recipes) {
      insertRecipe.run(recipe);
    }
  });

  insertRecipes(fusionRecipes);
  console.log(`${fusionRecipes.length} recette(s) de fusion insérée(s).`);
} else {
  console.log(`Base de données déjà initialisée (${count.count} gemmes présentes).`);

  // Vérifier si la gemme SILVER existe, sinon l'insérer
  const silverGem = db.prepare('SELECT * FROM gems WHERE id = ?').get('SILVER');
  if (!silverGem) {
    console.log('Insertion de la gemme SILVER...');
    const silverGemData = initialGems.find(g => g.id === 'SILVER');
    if (silverGemData) {
      const insert = db.prepare(`
        INSERT INTO gems (id, name, color, damage, speed, range, effect, icon, is_droppable, is_base)
        VALUES (@id, @name, @color, @damage, @speed, @range, @effect, @icon, @is_droppable, @is_base)
      `);
      insert.run(silverGemData);
      console.log('Gemme SILVER insérée.');
    }
  }

  // Vérifier et insérer les recettes manquantes
  const recipeCount = db.prepare('SELECT COUNT(*) as count FROM fusion_recipes').get();
  if (recipeCount.count === 0) {
    console.log('Insertion des recettes de fusion...');
    const insertRecipe = db.prepare(`
      INSERT INTO fusion_recipes (result_gem_id, required_gems, min_count)
      VALUES (@result_gem_id, @required_gems, @min_count)
    `);

    const insertRecipes = db.transaction((recipes) => {
      for (const recipe of recipes) {
        insertRecipe.run(recipe);
      }
    });

    insertRecipes(fusionRecipes);
    console.log(`${fusionRecipes.length} recette(s) de fusion insérée(s).`);
  }
}
