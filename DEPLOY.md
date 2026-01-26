# Guide de déploiement sur Render

Ce guide vous explique comment déployer votre jeu Tower Defense sur Render.com.

## Prérequis

1. Un compte GitHub/GitLab avec votre projet poussé
2. Un compte gratuit sur [Render.com](https://render.com)

## Étapes de déploiement

### 1. Préparer votre repository Git

Assurez-vous que tous les fichiers sont commités et poussés sur GitHub/GitLab :

```bash
git add .
git commit -m "Préparation pour déploiement sur Render"
git push origin main
```

### 2. Créer un nouveau Web Service sur Render

1. Connectez-vous sur [Render.com](https://render.com)
2. Cliquez sur "New +" puis "Web Service"
3. Connectez votre repository GitHub/GitLab
4. Sélectionnez le repository `tower-defense`

### 3. Configurer le Web Service

Render détectera automatiquement votre fichier `render.yaml` et pré-remplira les configurations. Vérifiez que les paramètres sont corrects :

- **Name**: `tower-defense` (ou le nom que vous préférez)
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: `Free`

### 4. Variables d'environnement

Les variables d'environnement sont déjà configurées dans le fichier `render.yaml` :
- `NODE_ENV=production`
- `PORT=10000`

Render définira automatiquement la variable `PORT`. Vous n'avez rien à ajouter manuellement.

### 5. Déployer

1. Cliquez sur "Create Web Service"
2. Render va automatiquement :
   - Installer les dépendances
   - Builder votre application React avec Vite
   - Démarrer le serveur Node.js
   - Servir l'application

Le déploiement prend généralement 2-5 minutes.

### 6. Accéder à votre application

Une fois le déploiement terminé, Render vous fournira une URL publique :
```
https://tower-defense-xxxx.onrender.com
```

Votre jeu est maintenant en ligne ! 🎉

## Déploiements futurs

Render redéploie automatiquement votre application à chaque push sur la branche `main` de votre repository Git.

```bash
git add .
git commit -m "Nouvelle fonctionnalité"
git push origin main
# Render redéploie automatiquement !
```

## Persistance de la base de données

La base de données SQLite est stockée dans le système de fichiers de Render.

⚠️ **Important** : Sur le plan gratuit, le disque peut être réinitialisé lors des redéploiements. Pour une persistence garantie :

1. Passez au plan payant ($7/mois) qui inclut un disque persistant
2. Ou migrez vers une base de données externe (PostgreSQL, MySQL)

## Limitations du plan gratuit

- L'application se met en veille après 15 minutes d'inactivité
- Temps de démarrage à froid : ~30 secondes à la première visite
- 750 heures/mois (suffisant pour un projet personnel)
- Disque non garanti persistant entre redéploiements

## Passer au plan payant

Pour éliminer la mise en veille et garantir la persistence des données :

1. Allez dans les paramètres de votre Web Service
2. Cliquez sur "Upgrade"
3. Sélectionnez le plan "Starter" ($7/mois)

## Dépannage

### Le build échoue

Vérifiez que toutes les dépendances sont dans `package.json` (pas seulement dans `devDependencies`).

### L'API ne répond pas

Vérifiez les logs sur Render :
1. Allez dans votre Web Service
2. Cliquez sur "Logs"
3. Recherchez les erreurs

### La base de données est vide après redéploiement

C'est normal sur le plan gratuit. Les données sont initialisées par `initData.js` au démarrage.

## Commandes utiles en local

```bash
# Développement (avec Vite hot reload)
npm run dev

# Tester le build de production en local
npm run build
npm start

# Outil de balancement
npm run balance
```

## Support

Pour plus d'aide, consultez la [documentation Render](https://render.com/docs) ou ouvrez une issue sur GitHub.
