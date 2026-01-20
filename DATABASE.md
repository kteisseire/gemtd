# Guide d'utilisation de la base de données

## Introduction

Le jeu Gem Tower Defense utilise maintenant une base de données SQLite pour stocker les statistiques des gemmes (tourelles). Cela facilite grandement l'équilibrage du jeu sans avoir à modifier le code source.

## Démarrage

### 1. Démarrer le serveur backend

Dans un premier terminal :

```bash
npm run server
```

Le serveur démarre sur `http://localhost:3001` et crée automatiquement la base de données avec les gemmes initiales.

### 2. Démarrer le jeu

Dans un second terminal :

```bash
npm run dev
```

Le jeu se connecte automatiquement à l'API pour charger les statistiques des gemmes.

## Équilibrage des gemmes

Vous avez plusieurs options pour modifier les statistiques des gemmes :

### Option 1 : Outil interactif (Recommandé)

```bash
npm run balance
```

Cet outil vous permet de :
- Lister toutes les gemmes
- Modifier les statistiques d'une gemme
- Comparer les statistiques entre gemmes
- Exporter les gemmes au format code

### Option 2 : API REST

Utiliser curl ou Postman pour modifier les gemmes :

```bash
# Lister toutes les gemmes
curl http://localhost:3001/api/gems

# Voir une gemme spécifique
curl http://localhost:3001/api/gems/RED

# Modifier une gemme
curl -X PUT http://localhost:3001/api/gems/RED \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Feu",
    "color": "#ef4444",
    "damage": 25,
    "speed": 900,
    "range": 110,
    "effect": "damage",
    "icon": "🔥"
  }'
```

### Option 3 : Modification directe de la base

Utiliser un outil SQLite comme [DB Browser for SQLite](https://sqlitebrowser.org/) pour éditer directement le fichier `server/game.db`.

## Propriétés des gemmes

Chaque gemme possède les propriétés suivantes :

- `id` (TEXT) : Identifiant unique (ex: "RED", "BLUE")
- `name` (TEXT) : Nom affiché (ex: "Feu", "Glace")
- `color` (TEXT) : Couleur hexadécimale (ex: "#ef4444")
- `damage` (INTEGER) : Dégâts infligés par projectile
- `speed` (INTEGER) : Vitesse d'attaque en millisecondes (plus petit = plus rapide)
- `range` (INTEGER) : Portée de la tourelle en pixels
- `effect` (TEXT) : Effet spécial ("damage", "slow", "poison", etc.)
- `icon` (TEXT) : Emoji représentant la gemme

## Conseils d'équilibrage

### Dégâts
- BASE : 0 (pas d'attaque)
- Faible : 5-10
- Moyen : 10-20
- Élevé : 20-30
- Très élevé : 30+

### Vitesse d'attaque (ms)
- Très rapide : 400-600
- Rapide : 600-900
- Moyen : 900-1200
- Lent : 1200-1500
- Très lent : 1500-2000+

### Portée
- Courte : 80-90
- Moyenne : 90-110
- Longue : 110-130

### Équilibrage général
- Les gemmes à dégâts élevés devraient avoir une vitesse plus lente
- Les gemmes à longue portée devraient avoir des dégâts ou une vitesse réduite
- Les effets spéciaux peuvent compenser des statistiques plus faibles

## Recharger les modifications

Après avoir modifié les gemmes via l'API ou l'outil :
1. Le serveur n'a pas besoin d'être redémarré
2. Rechargez simplement la page du jeu (F5) pour voir les nouveaux stats

## Réinitialiser la base de données

Pour revenir aux valeurs initiales :

```bash
# Arrêter le serveur (Ctrl+C)
# Supprimer la base de données
rm server/game.db  # Linux/Mac
del server\game.db  # Windows

# Redémarrer le serveur
npm run server
```

La base de données sera recréée avec les valeurs par défaut.

## Structure du projet

```
tower-defense/
├── server/
│   ├── database.js         # Configuration SQLite
│   ├── initData.js         # Données initiales
│   ├── index.js            # Serveur Express + API
│   ├── balancing-tool.js   # Outil d'équilibrage
│   ├── game.db             # Base de données (générée)
│   └── README.md           # Documentation serveur
├── src/
│   └── TowerDefense.jsx    # Jeu (charge les gemmes depuis l'API)
└── package.json
```

## Dépannage

### Le jeu affiche les anciennes valeurs
- Assurez-vous que le serveur est démarré (`npm run server`)
- Vérifiez la console du navigateur pour les erreurs de connexion
- Rechargez la page (F5)

### Erreur de connexion à l'API
- Vérifiez que le serveur tourne sur le port 3001
- Vérifiez qu'il n'y a pas de pare-feu bloquant localhost:3001

### La base de données ne se crée pas
- Vérifiez que better-sqlite3 est bien installé : `npm install`
- Vérifiez les permissions d'écriture dans le dossier `server/`
