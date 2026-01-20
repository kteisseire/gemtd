# Base de données Gem Tower Defense

Ce dossier contient le serveur backend et la base de données SQLite pour le jeu Gem Tower Defense.

## Structure

- `database.js` - Configuration de la base de données SQLite
- `initData.js` - Initialisation des données des gemmes
- `index.js` - Serveur Express avec les routes API
- `game.db` - Base de données SQLite (générée automatiquement)

## Démarrage

1. Installer les dépendances (si ce n'est pas déjà fait) :
```bash
npm install
```

2. Démarrer le serveur :
```bash
npm run server
```

Le serveur démarre sur `http://localhost:3001`

## API Endpoints

### GET /api/gems
Récupère toutes les gemmes au format objet.

**Exemple de réponse :**
```json
{
  "RED": {
    "name": "Feu",
    "color": "#ef4444",
    "damage": 20,
    "speed": 1000,
    "range": 100,
    "effect": "damage",
    "icon": "🔥"
  },
  ...
}
```

### GET /api/gems/:id
Récupère une gemme spécifique par son ID.

**Exemple :** `GET /api/gems/RED`

### PUT /api/gems/:id
Met à jour une gemme (pour l'équilibrage).

**Body :**
```json
{
  "name": "Feu",
  "color": "#ef4444",
  "damage": 25,
  "speed": 900,
  "range": 110,
  "effect": "damage",
  "icon": "🔥"
}
```

### POST /api/gems
Crée une nouvelle gemme.

**Body :**
```json
{
  "id": "NEW_GEM",
  "name": "Nouvelle Gemme",
  "color": "#ffffff",
  "damage": 15,
  "speed": 1000,
  "range": 100,
  "effect": "none",
  "icon": "💎"
}
```

### DELETE /api/gems/:id
Supprime une gemme.

## Équilibrage

Pour modifier les statistiques des gemmes, vous pouvez :

1. **Via l'API** - Utiliser un outil comme Postman ou curl :
```bash
curl -X PUT http://localhost:3001/api/gems/RED \
  -H "Content-Type: application/json" \
  -d '{"name":"Feu","color":"#ef4444","damage":25,"speed":900,"range":110,"effect":"damage","icon":"🔥"}'
```

2. **Directement dans la base de données** - Utiliser un outil SQLite comme DB Browser for SQLite pour éditer le fichier `game.db`.

3. **Via le script utilitaire** - Voir `balancing-tool.js` pour un outil interactif.

## Développement

Pour modifier les données initiales, éditez le fichier `initData.js` et supprimez `game.db`, puis redémarrez le serveur.
