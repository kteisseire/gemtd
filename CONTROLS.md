# Contrôles du jeu - Gem Tower Defense

## Menu Principal

- **Nouvelle Partie** : Cliquer sur le bouton pour commencer une nouvelle partie
- **Pseudo** : Cliquer sur le champ pour modifier votre pseudo
- Le menu affiche votre meilleur score et dernier score

## Phase de Préparation (entre les vagues)

### Placement des gemmes
- **Cliquer sur une case vide** : Place une gemme aléatoire (maximum 5 par tour)
- Les gemmes placées apparaissent en blanc avec un point d'interrogation
- Vous ne pouvez pas placer de gemmes sur :
  - La zone de spawn (rouge, en haut à gauche)
  - La zone d'objectif (vert, en haut au centre)
  - Les checkpoints (bleu)
  - Des cases déjà occupées

### Menu contextuel des gemmes

#### Pour les gemmes temporaires (blanches)
1. **Cliquer sur une gemme temporaire** : Ouvre le menu contextuel
2. Le **menu contextuel** affiche :
   - L'icône et le nom de la gemme
   - **Bouton "Lancer la vague"** (vert) : Lance la prochaine vague et conserve cette gemme
   - **Bouton "Supprimer"** (rouge) : Supprime la gemme et libère un emplacement

#### Pour les tours permanentes (colorées)
1. **Cliquer sur une tour permanente** : Ouvre le menu contextuel
2. Le **menu contextuel** affiche :
   - L'icône et le nom de la gemme avec mention "(Permanent)"
   - **Bouton "Supprimer"** (rouge) : Supprime définitivement la tour

#### Comportement commun
- **Cliquer en dehors du menu** : Ferme le menu
- **Important** : Le menu contextuel masque temporairement le tooltip pour une meilleure lisibilité
- Alternative : Utiliser le bouton "Suppr. gemme" dans la barre d'outils (nécessite de sélectionner la tour d'abord)

## Phase de Vague

- Les ennemis apparaissent et suivent le chemin
- Vos tours attaquent automatiquement
- **Bouton Pause** : Met le jeu en pause
- **Boutons de vitesse** (x1, x2, x3) : Accélère le jeu

## Navigation Caméra

- **Clic gauche maintenu + déplacer** : Déplacer la caméra
- **Molette de la souris** : Zoomer/dézoomer (6 niveaux de zoom)
- **Double-clic sur un bouton de zoom** : Centrer la caméra

## Barre d'outils

- 🏠 **Menu** : Retour au menu principal
- ❤️ **Vies** : Nombre de vies restantes
- 🌊 **Vague** : Numéro de la vague actuelle
- ⭐ **Score** : Score total
- 💎 **Gemmes** : Nombre de gemmes placées ce tour / 5
- ⏸️ **Pause** : Pause/Reprendre
- 🗑️ **Suppr. gemme** : Supprimer la tour sélectionnée
- **x1, x2, x3** : Vitesse du jeu
- **Zoom +/-** : Contrôles de zoom

## Tooltips

- **Survoler une tour** : Affiche ses statistiques (dégâts, vitesse, portée, effet)
- **Survoler un bouton** de la barre d'outils : Affiche son nom

## Types de gemmes

Chaque gemme a des propriétés uniques :
- **⚪ Base** : Aucune attaque (utilisée pour bloquer le chemin)
- **🔥 Feu** : Dégâts élevés
- **❄️ Glace** : Ralentit les ennemis
- **☠️ Poison** : Dégâts sur la durée
- **⚡ Foudre** : Attaque rapide
- **🔮 Arcane** : Dégâts magiques
- **💥 Explosion** : Zone d'effet
- **💧 Eau** : Très rapide
- **✨ Lumière** : Coups critiques
- **🗿 Pierre** : Étourdissement
- **🌑 Ombre** : Attaque en chaîne

## Stratégie

1. Placez stratégiquement vos gemmes pour créer un labyrinthe
2. Choisissez judicieusement quelle gemme conserver (une seule par tour)
3. Les gemmes de base (⚪) sont utiles pour bloquer mais n'attaquent pas
4. Créez des tours permanentes en les sélectionnant avant de lancer la vague
5. Supprimez les tours mal placées pour optimiser votre défense
6. Observez les résistances des ennemis (icônes sous leur emoji)
7. Les ennemis rapides (⚡) et lents (🐌) ont des points de vie différents

## Game Over

- La partie se termine quand vos vies tombent à 0
- Votre score est automatiquement sauvegardé
- Appuyez sur le bouton 🔄 pour recommencer
