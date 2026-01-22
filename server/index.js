import express from 'express';
import cors from 'cors';
import db from './database.js';
import './initData.js'; // Initialise les données au démarrage

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
    const { name, color, damage, speed, range, effect, icon } = req.body;

    const result = db.prepare(`
      UPDATE gems
      SET name = ?, color = ?, damage = ?, speed = ?, range = ?, effect = ?, icon = ?
      WHERE id = ?
    `).run(name, color, damage, speed, range, effect, icon, req.params.id);

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
    const { id, name, color, damage, speed, range, effect, icon, is_droppable, is_base } = req.body;

    db.prepare(`
      INSERT INTO gems (id, name, color, damage, speed, range, effect, icon, is_droppable, is_base)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, color, damage, speed, range, effect, icon, is_droppable || 0, is_base || 0);

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

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📊 API disponible sur http://localhost:${PORT}/api/gems`);
});
