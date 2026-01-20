// Script pour ajouter la gemme GOLD et sa recette
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api';

async function addGoldGem() {
  try {
    // 1. Créer la gemme GOLD
    console.log('Création de la gemme GOLD...');
    const gemResponse = await fetch(`${API_URL}/gems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'GOLD',
        name: 'Or',
        color: '#ffd700',
        damage: 200,
        speed: 500,
        range: 180,
        effect: 'all',
        icon: '💰',
        is_droppable: 0,
        is_base: 0
      })
    });

    const gemResult = await gemResponse.json();
    console.log('Gemme GOLD:', gemResult);

    // 2. Créer la recette de fusion pour GOLD
    console.log('Création de la recette de fusion GOLD...');
    const recipeResponse = await fetch(`${API_URL}/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        result_gem_id: 'GOLD',
        required_gems: 'SILVER,RED,ORANGE',
        min_count: 3
      })
    });

    const recipeResult = await recipeResponse.json();
    console.log('Recette GOLD:', recipeResult);

    console.log('\n✅ Gemme GOLD et sa recette ont été ajoutées avec succès!');
    console.log('Rechargez la page du jeu pour voir les changements.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

addGoldGem();
