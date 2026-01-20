# Comment ajouter la gemme GOLD

## Problème actuel
La base de données SQLite est verrouillée par un fichier journal (`game.db-journal`) qui empêche toute modification.

## Solution la plus simple (Recommandée)

### Option 1: Redémarrer l'ordinateur
1. Fermez tous les programmes
2. Redémarrez votre ordinateur
3. Ouvrez un terminal dans `c:\Users\kevin\Game\tower-defense`
4. Exécutez: `node server/add-gold-direct.js`
5. Démarrez le serveur API: `npm run server`
6. Rechargez la page du jeu

### Option 2: Utiliser DB Browser for SQLite (sans redémarrage)
1. Téléchargez DB Browser for SQLite: https://sqlitebrowser.org/
2. Installez et lancez le programme
3. Fichier > Ouvrir une base de données
4. Sélectionnez: `C:\Users\kevin\Game\tower-defense\server\game.db`
5. Onglet "Exécuter le SQL"
6. Copiez et exécutez ce code SQL:

\`\`\`sql
-- Ajouter la gemme GOLD
INSERT INTO gems (id, name, color, damage, speed, range, effect, icon, is_droppable, is_base)
VALUES ('GOLD', 'Or', '#ffd700', 200, 500, 180, 'all', '💰', 0, 0);

-- Ajouter la recette de fusion GOLD
INSERT INTO fusion_recipes (result_gem_id, required_gems, min_count)
VALUES ('GOLD', 'SILVER,RED,ORANGE', 3);
\`\`\`

7. Cliquez sur "Exécuter" (icône ▶)
8. Fichier > Écrire les modifications (Ctrl+S)
9. Fermez DB Browser
10. Démarrez le serveur API: `npm run server`
11. Rechargez la page du jeu

## Vérifier que GOLD a été ajouté

Une fois le serveur API démarré, vérifiez avec:
\`\`\`bash
curl http://localhost:3001/api/gems | grep GOLD
curl http://localhost:3001/api/recipes
\`\`\`

Vous devriez voir la gemme GOLD et sa recette.

## Caractéristiques de la gemme GOLD
- **Dégâts**: 200 (le plus élevé)
- **Vitesse**: 500ms (très rapide)
- **Portée**: 180 (la plus longue)
- **Effet**: "all" (tous les effets combinés)
- **Icône**: 💰
- **Obtention**: Fusion de SILVER + RED + ORANGE (minimum 3 gemmes)

## Scripts disponibles

- `add-gold.sql` - Script SQL à exécuter dans DB Browser
- `server/add-gold-direct.js` - Script Node.js à exécuter quand serveur arrêté
- `fix-and-add-gold.bat` - Script batch Windows (peut nécessiter redémarrage)
- `GUIDE_AJOUT_GEMMES.md` - Guide complet pour ajouter d'autres gemmes
