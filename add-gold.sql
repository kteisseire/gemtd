-- Script SQL pour ajouter la gemme GOLD et sa recette de fusion
-- À exécuter avec DB Browser for SQLite ou sqlite3

-- 1. Ajouter la gemme GOLD
INSERT INTO gems (id, name, color, damage, speed, range, effect, icon, is_droppable, is_base)
VALUES ('GOLD', 'Or', '#ffd700', 200, 500, 180, 'all', '💰', 0, 0);

-- 2. Ajouter la recette de fusion pour GOLD
-- (Fusion de SILVER + RED + ORANGE, minimum 3 gemmes)
INSERT INTO fusion_recipes (result_gem_id, required_gems, min_count)
VALUES ('GOLD', 'SILVER,RED,ORANGE', 3);

-- Vérifier que les données ont été insérées
SELECT * FROM gems WHERE id='GOLD';
SELECT * FROM fusion_recipes WHERE result_gem_id='GOLD';
