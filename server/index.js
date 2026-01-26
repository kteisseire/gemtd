import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './database.js';
import './initData.js'; // Initialise les données au démarrage

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques du build React en production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
}

// Routes API

// GET - Récupérer toutes les gemmes
app.get('/api/gems', (req, res) => {
  try {
    const gems = db.prepare('SELECT * FROM gems').all();

    // Transformer en objet comme dans le code original
    const gemsObject = {};
    gems.forEach(gem => {
      gemsObject[gem.id] = {
        name: gem.name,
        color: gem.color,
        image: gem.image || '/images/gemviolette.png',
        damage: gem.damage,
        speed: gem.speed,
        range: gem.range,
        effect: gem.effect,
        icon: gem.icon,
        is_droppable: gem.is_droppable === 1,
        is_base: gem.is_base === 1
      };
    });

    res.json(gemsObject);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des gemmes' });
  }
});

// GET - Récupérer une gemme spécifique
app.get('/api/gems/:id', (req, res) => {
  try {
    const gem = db.prepare('SELECT * FROM gems WHERE id = ?').get(req.params.id);

    if (!gem) {
      return res.status(404).json({ error: 'Gemme non trouvée' });
    }

    res.json(gem);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la gemme' });
  }
});

// PUT - Mettre à jour une gemme (pour l'équilibrage)
app.put('/api/gems/:id', (req, res) => {
  try {
    const { name, color, image, damage, speed, range, effect, icon } = req.body;

    const result = db.prepare(`
      UPDATE gems
      SET name = ?, color = ?, image = ?, damage = ?, speed = ?, range = ?, effect = ?, icon = ?
      WHERE id = ?
    `).run(name, color, image || '/images/gemviolette.png', damage, speed, range, effect, icon, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Gemme non trouvée' });
    }

    res.json({ message: 'Gemme mise à jour avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la gemme' });
  }
});

// POST - Créer une nouvelle gemme
app.post('/api/gems', (req, res) => {
  try {
    const { id, name, color, image, damage, speed, range, effect, icon, is_droppable, is_base } = req.body;

    db.prepare(`
      INSERT INTO gems (id, name, color, image, damage, speed, range, effect, icon, is_droppable, is_base)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, color, image || '/images/gemviolette.png', damage, speed, range, effect, icon, is_droppable || 0, is_base || 0);

    res.status(201).json({ message: 'Gemme créée avec succès' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: 'Une gemme avec cet ID existe déjà' });
    } else {
      console.error('Erreur création gemme:', error);
      res.status(500).json({ error: 'Erreur lors de la création de la gemme' });
    }
  }
});

// DELETE - Supprimer une gemme
app.delete('/api/gems/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM gems WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Gemme non trouvée' });
    }

    res.json({ message: 'Gemme supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la gemme' });
  }
});

// GET - Récupérer les recettes de fusion
app.get('/api/recipes', (req, res) => {
  try {
    const recipes = db.prepare('SELECT * FROM fusion_recipes').all();
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des recettes' });
  }
});

// POST - Créer une nouvelle recette de fusion
app.post('/api/recipes', (req, res) => {
  try {
    const { result_gem_id, required_gems, min_count } = req.body;

    if (!result_gem_id || !required_gems) {
      return res.status(400).json({ error: 'result_gem_id et required_gems sont requis' });
    }

    const result = db.prepare(`
      INSERT INTO fusion_recipes (result_gem_id, required_gems, min_count)
      VALUES (?, ?, ?)
    `).run(result_gem_id, required_gems, min_count || 3);

    // Récupérer la recette créée avec son ID
    const newRecipe = db.prepare('SELECT * FROM fusion_recipes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newRecipe);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: 'Contrainte SQL violée (gemme inexistante ou doublon)' });
    } else {
      res.status(500).json({ error: 'Erreur lors de la création de la recette' });
    }
  }
});

// PUT - Mettre à jour une recette de fusion
app.put('/api/recipes/:id', (req, res) => {
  try {
    const { result_gem_id, required_gems, min_count } = req.body;

    if (!result_gem_id || !required_gems) {
      return res.status(400).json({ error: 'result_gem_id et required_gems sont requis' });
    }

    const result = db.prepare(`
      UPDATE fusion_recipes
      SET result_gem_id = ?, required_gems = ?, min_count = ?
      WHERE id = ?
    `).run(result_gem_id, required_gems, min_count || 3, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Recette non trouvée' });
    }

    // Récupérer la recette mise à jour
    const updatedRecipe = db.prepare('SELECT * FROM fusion_recipes WHERE id = ?').get(req.params.id);
    res.json(updatedRecipe);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la recette' });
  }
});

// DELETE - Supprimer une recette de fusion
app.delete('/api/recipes/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM fusion_recipes WHERE id = ?').run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Recette non trouvée' });
    }

    res.json({ message: 'Recette supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la recette' });
  }
});

// GET - Récupérer le top 10 du leaderboard
app.get('/api/leaderboard', (req, res) => {
  try {
    const scores = db.prepare(`
      SELECT id, pseudo, score, wave, created_at
      FROM leaderboard
      ORDER BY score DESC
      LIMIT 10
    `).all();

    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du leaderboard' });
  }
});

// POST - Ajouter un score au leaderboard
app.post('/api/leaderboard', (req, res) => {
  try {
    const { pseudo, score, wave } = req.body;

    if (!pseudo || score === undefined || wave === undefined) {
      return res.status(400).json({ error: 'Pseudo, score et wave sont requis' });
    }

    const result = db.prepare(`
      INSERT INTO leaderboard (pseudo, score, wave)
      VALUES (?, ?, ?)
    `).run(pseudo, score, wave);

    const newScore = db.prepare('SELECT * FROM leaderboard WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(newScore);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout du score' });
  }
});

// GET - Récupérer tous les types d'ennemis
app.get('/api/enemies', (req, res) => {
  try {
    const enemies = db.prepare('SELECT * FROM enemy_types').all();
    const allResistances = db.prepare('SELECT * FROM enemy_resistances').all();

    // Transformer en objet indexé par ID
    const enemiesObject = {};
    enemies.forEach(enemy => {
      // Récupérer les résistances de cet ennemi
      const enemyResistances = allResistances.filter(r => r.enemy_type_id === enemy.id);
      const resistances = enemyResistances.map(r => r.gem_type_id);

      enemiesObject[enemy.id] = {
        name: enemy.name,
        hp: enemy.hp,
        speed: enemy.speed,
        resistance1: enemy.resistance1,
        resistance2: enemy.resistance2,
        emoji: enemy.emoji,
        global_resistance: enemy.global_resistance || 0.1,
        resistances: resistances  // Tableau de gem IDs
      };
    });

    res.json(enemiesObject);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des ennemis' });
  }
});

// GET - Récupérer toutes les vagues
app.get('/api/waves', (req, res) => {
  try {
    const waves = db.prepare(`
      SELECT w.wave_number, w.enemy_count, e.*
      FROM waves w
      JOIN enemy_types e ON w.enemy_type_id = e.id
      ORDER BY w.wave_number
    `).all();

    // Transformer en objet indexé par numéro de vague
    const wavesObject = {};
    waves.forEach(wave => {
      wavesObject[wave.wave_number] = {
        waveNumber: wave.wave_number,
        enemyCount: wave.enemy_count,
        enemyType: {
          id: wave.id,
          name: wave.name,
          hp: wave.hp,
          speed: wave.speed,
          resistance1: wave.resistance1,
          resistance2: wave.resistance2,
          emoji: wave.emoji,
          global_resistance: wave.global_resistance || 0.1
        }
      };
    });

    res.json(wavesObject);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des vagues' });
  }
});

// GET - Récupérer une vague spécifique
app.get('/api/waves/:wave_number', (req, res) => {
  try {
    const wave = db.prepare(`
      SELECT w.wave_number, w.enemy_count, e.*
      FROM waves w
      JOIN enemy_types e ON w.enemy_type_id = e.id
      WHERE w.wave_number = ?
    `).get(req.params.wave_number);

    if (!wave) {
      return res.status(404).json({ error: 'Vague non trouvée' });
    }

    res.json({
      waveNumber: wave.wave_number,
      enemyCount: wave.enemy_count,
      enemyType: {
        id: wave.id,
        name: wave.name,
        hp: wave.hp,
        speed: wave.speed,
        resistance1: wave.resistance1,
        resistance2: wave.resistance2,
        emoji: wave.emoji,
        global_resistance: wave.global_resistance || 0.1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la vague' });
  }
});

// POST - Créer un nouvel ennemi
app.post('/api/enemies', (req, res) => {
  try {
    const { id, name, hp, speed, resistance1, resistance2, emoji, global_resistance } = req.body;

    if (!id || !name || !hp || !speed || !emoji) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const insert = db.prepare(`
      INSERT INTO enemy_types (id, name, hp, speed, resistance1, resistance2, emoji, global_resistance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(id, name, hp, speed, resistance1 || null, resistance2 || null, emoji, global_resistance || 0.1);

    const newEnemy = db.prepare('SELECT * FROM enemy_types WHERE id = ?').get(id);
    res.status(201).json(newEnemy);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Un ennemi avec cet ID existe déjà' });
    } else {
      res.status(500).json({ error: 'Erreur lors de la création de l\'ennemi' });
    }
  }
});

// PUT - Modifier un ennemi existant
app.put('/api/enemies/:id', (req, res) => {
  try {
    const { name, hp, speed, resistance1, resistance2, emoji, global_resistance } = req.body;

    const update = db.prepare(`
      UPDATE enemy_types
      SET name = ?, hp = ?, speed = ?, resistance1 = ?, resistance2 = ?, emoji = ?, global_resistance = ?
      WHERE id = ?
    `);

    const result = update.run(name, hp, speed, resistance1 || null, resistance2 || null, emoji, global_resistance || 0.1, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Ennemi non trouvé' });
    }

    const updatedEnemy = db.prepare('SELECT * FROM enemy_types WHERE id = ?').get(req.params.id);
    res.json(updatedEnemy);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la modification de l\'ennemi' });
  }
});

// DELETE - Supprimer un ennemi
app.delete('/api/enemies/:id', (req, res) => {
  try {
    const deleteStmt = db.prepare('DELETE FROM enemy_types WHERE id = ?');
    const result = deleteStmt.run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Ennemi non trouvé' });
    }

    res.json({ success: true, message: 'Ennemi supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'ennemi' });
  }
});

// GET - Récupérer toutes les résistances
app.get('/api/resistances', (req, res) => {
  try {
    const resistances = db.prepare('SELECT * FROM enemy_resistances').all();
    res.json(resistances);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des résistances' });
  }
});

// GET - Récupérer les résistances d'un ennemi spécifique
app.get('/api/resistances/:enemy_id', (req, res) => {
  try {
    const resistances = db.prepare('SELECT * FROM enemy_resistances WHERE enemy_type_id = ?').all(req.params.enemy_id);
    res.json(resistances);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des résistances' });
  }
});

// POST - Ajouter ou modifier une résistance
app.post('/api/resistances', (req, res) => {
  try {
    const { enemy_type_id, gem_type_id, resistance_value } = req.body;

    if (!enemy_type_id || !gem_type_id || resistance_value === undefined) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const insert = db.prepare(`
      INSERT INTO enemy_resistances (enemy_type_id, gem_type_id, resistance_value)
      VALUES (?, ?, ?)
      ON CONFLICT(enemy_type_id, gem_type_id) DO UPDATE SET resistance_value = ?
    `);

    insert.run(enemy_type_id, gem_type_id, resistance_value, resistance_value);

    const newResistance = db.prepare(
      'SELECT * FROM enemy_resistances WHERE enemy_type_id = ? AND gem_type_id = ?'
    ).get(enemy_type_id, gem_type_id);

    res.status(201).json(newResistance);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout de la résistance' });
  }
});

// DELETE - Supprimer une résistance
app.delete('/api/resistances/:enemy_id/:gem_id', (req, res) => {
  try {
    const deleteStmt = db.prepare('DELETE FROM enemy_resistances WHERE enemy_type_id = ? AND gem_type_id = ?');
    const result = deleteStmt.run(req.params.enemy_id, req.params.gem_id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Résistance non trouvée' });
    }

    res.json({ success: true, message: 'Résistance supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression de la résistance' });
  }
});

// En production, servir l'application React pour toutes les autres routes
if (process.env.NODE_ENV === 'production') {
  app.get('/*', (req, res) => {
    res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
  });
}

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📊 API disponible sur http://localhost:${PORT}/api/gems`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
});
