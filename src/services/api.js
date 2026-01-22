const API_BASE = 'http://localhost:3001/api';

// Charger les gemmes depuis l'API
export const fetchGems = async () => {
  try {
    const response = await fetch(`${API_BASE}/gems`);
    if (response.ok) {
      const gems = await response.json();
      // L'API retourne soit un objet {ID: gem}, soit un tableau [gem]
      if (Array.isArray(gems)) {
        const gemTypesObj = {};
        gems.forEach(gem => {
          gemTypesObj[gem.id] = {
            name: gem.name,
            color: gem.color,
            image: gem.image || '/images/gemviolette.png',
            damage: gem.damage,
            speed: gem.speed,
            range: gem.range,
            effect: gem.effect,
            icon: gem.icon,
            is_droppable: gem.is_droppable,
            is_base: gem.is_base
          };
        });
        return gemTypesObj;
      } else {
        // L'API retourne déjà un objet avec les IDs comme clés
        // Filtrer les entrées invalides (comme "null")
        const filtered = {};
        Object.entries(gems).forEach(([key, gem]) => {
          if (key && key !== 'null' && gem && gem.name) {
            filtered[key] = gem;
          }
        });
        return filtered;
      }
    }
    throw new Error('Failed to fetch gems');
  } catch (error) {
    console.error('Erreur lors du chargement des gemmes:', error);
    throw error;
  }
};

// Charger les recettes de fusion depuis l'API
export const fetchRecipes = async () => {
  try {
    const response = await fetch(`${API_BASE}/recipes`);
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch recipes');
  } catch (error) {
    console.error('Erreur lors du chargement des recettes:', error);
    throw error;
  }
};

// Creer une nouvelle gemme
export const createGem = async (gemData) => {
  const response = await fetch(`${API_BASE}/gems`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gemData)
  });
  if (!response.ok) throw new Error('Failed to create gem');
  return await response.json();
};

// Mettre a jour une gemme
export const updateGem = async (gemId, gemData) => {
  const response = await fetch(`${API_BASE}/gems/${gemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gemData)
  });
  if (!response.ok) throw new Error('Failed to update gem');
  return await response.json();
};

// Supprimer une gemme
export const deleteGem = async (gemId) => {
  const response = await fetch(`${API_BASE}/gems/${gemId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete gem');
  return true;
};

// Creer une recette de fusion
export const createRecipe = async (recipeData) => {
  const response = await fetch(`${API_BASE}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipeData)
  });
  if (!response.ok) throw new Error('Failed to create recipe');
  return await response.json();
};

// Mettre a jour une recette
export const updateRecipe = async (recipeId, recipeData) => {
  const response = await fetch(`${API_BASE}/recipes/${recipeId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recipeData)
  });
  if (!response.ok) throw new Error('Failed to update recipe');
  return await response.json();
};

// Supprimer une recette
export const deleteRecipe = async (recipeId) => {
  const response = await fetch(`${API_BASE}/recipes/${recipeId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete recipe');
  return true;
};

// Recuperer le leaderboard (top 10)
export const fetchLeaderboard = async () => {
  try {
    const response = await fetch(`${API_BASE}/leaderboard`);
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Failed to fetch leaderboard');
  } catch (error) {
    console.error('Erreur lors du chargement du leaderboard:', error);
    return [];
  }
};

// Ajouter un score au leaderboard
export const submitScore = async (pseudo, score, wave) => {
  try {
    const response = await fetch(`${API_BASE}/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pseudo, score, wave })
    });
    if (!response.ok) throw new Error('Failed to submit score');
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'envoi du score:', error);
    throw error;
  }
};
