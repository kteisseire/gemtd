# Guide pour ajouter de nouvelles gemmes

## Problème actuel
La base de données SQLite est actuellement verrouillée, ce qui empêche l'ajout de gemmes via l'API ou la ligne de commande.

## Solutions disponibles

### Solution 1: DB Browser for SQLite (Recommandée)

1. **Télécharger DB Browser for SQLite**
   - Site: https://sqlitebrowser.org/
   - Téléchargez et installez la version pour Windows

2. **Ouvrir la base de données**
   - Lancez DB Browser for SQLite
   - Fichier > Ouvrir une base de données
   - Sélectionnez: `C:\Users\kevin\Game\tower-defense\server\game.db`

3. **Exécuter le script SQL**
   - Onglet "Exécuter le SQL"
   - Ouvrez le fichier `add-gold.sql` ou copiez-collez son contenu
   - Cliquez sur "Exécuter"

4. **Sauvegarder**
   - Fichier > Écrire les modifications (ou Ctrl+S)

5. **Recharger le jeu**
   - Rafraîchissez la page du jeu dans votre navigateur
   - La gemme GOLD devrait maintenant être disponible

### Solution 2: Supprimer et recréer la base (Perte de données)

Si vous voulez repartir de zéro:

```bash
# 1. Arrêter tous les serveurs
# Fermez toutes les fenêtres de terminal

# 2. Supprimer la base de données
del C:\Users\kevin\Game\tower-defense\server\game.db

# 3. Relancer le serveur API
cd C:\Users\kevin\Game\tower-defense
npm run server

# 4. Ajouter GOLD via l'API
curl -X POST http://localhost:3001/api/gems ^
  -H "Content-Type: application/json" ^
  -d "{\"id\":\"GOLD\",\"name\":\"Or\",\"color\":\"#ffd700\",\"damage\":200,\"speed\":500,\"range\":180,\"effect\":\"all\",\"icon\":\"💰\",\"is_droppable\":0,\"is_base\":0}"

curl -X POST http://localhost:3001/api/recipes ^
  -H "Content-Type: application/json" ^
  -d "{\"result_gem_id\":\"GOLD\",\"required_gems\":\"SILVER,RED,ORANGE\",\"min_count\":3}"
```

### Solution 3: Via l'API REST (si le serveur n'est pas verrouillé)

Utilisez Postman, Insomnia, ou curl:

**Créer une gemme:**
```
POST http://localhost:3001/api/gems
Content-Type: application/json

{
  "id": "GOLD",
  "name": "Or",
  "color": "#ffd700",
  "damage": 200,
  "speed": 500,
  "range": 180,
  "effect": "all",
  "icon": "💰",
  "is_droppable": 0,
  "is_base": 0
}
```

**Créer une recette:**
```
POST http://localhost:3001/api/recipes
Content-Type: application/json

{
  "result_gem_id": "GOLD",
  "required_gems": "SILVER,RED,ORANGE",
  "min_count": 3
}
```

## Structure des données

### Gemme (table `gems`)
- `id`: Identifiant unique (TEXT, ex: "GOLD")
- `name`: Nom affiché (TEXT, ex: "Or")
- `color`: Couleur hexa (TEXT, ex: "#ffd700")
- `damage`: Dégâts (INTEGER, ex: 200)
- `speed`: Vitesse d'attaque en ms (INTEGER, ex: 500)
- `range`: Portée (INTEGER, ex: 180)
- `effect`: Effets séparés par virgule (TEXT, ex: "all" ou "slow,crit")
- `icon`: Emoji (TEXT, ex: "💰")
- `is_droppable`: Peut apparaître aléatoirement (INTEGER 0 ou 1)
- `is_base`: Est la gemme de base (INTEGER 0 ou 1)

### Recette de fusion (table `fusion_recipes`)
- `result_gem_id`: ID de la gemme résultante (TEXT, ex: "GOLD")
- `required_gems`: IDs des gemmes requises séparés par virgule (TEXT, ex: "SILVER,RED,ORANGE")
- `min_count`: Nombre minimum de gemmes requises (INTEGER, ex: 3)

## Exemple: Ajouter une gemme DIAMOND

```sql
-- Gemme DIAMOND: ultra puissante, fusion de GOLD + SILVER
INSERT INTO gems (id, name, color, damage, speed, range, effect, icon, is_droppable, is_base)
VALUES ('DIAMOND', 'Diamant', '#b9f2ff', 500, 300, 200, 'all,crit,chain', '💎', 0, 0);

INSERT INTO fusion_recipes (result_gem_id, required_gems, min_count)
VALUES ('DIAMOND', 'GOLD,SILVER', 2);
```

## Notes importantes

- Après tout ajout/modification en BDD, il faut recharger la page du jeu
- Les gemmes avec `is_droppable=1` apparaissent aléatoirement lors du placement
- Les gemmes avec `is_droppable=0` ne sont obtenues que par fusion
- L'effet "all" combine tous les effets disponibles
