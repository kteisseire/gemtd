import { useState, useEffect } from 'react';
import { fetchGems, fetchRecipes, fetchLeaderboard, fetchEnemies } from '../services/api';
import { DEFAULT_GEM_TYPES } from '../config/constants';

/**
 * Hook personnalisé pour gérer les données du jeu
 * Charge et gère gemTypes, fusionRecipes, enemyTypes et leaderboard depuis l'API
 *
 * @returns {Object} Données du jeu et leurs setters
 */
export const useGameData = () => {
  const [gemTypes, setGemTypes] = useState(DEFAULT_GEM_TYPES);
  const [fusionRecipes, setFusionRecipes] = useState([]);
  const [enemyTypes, setEnemyTypes] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);

  // Charger les données depuis l'API au montage
  useEffect(() => {
    fetchGems()
      .then(gems => setGemTypes(gems))
      .catch(() => {
        console.error('Erreur lors du chargement des gemmes');
      });

    fetchRecipes()
      .then(recipes => setFusionRecipes(recipes))
      .catch(() => {
        console.error('Erreur lors du chargement des recettes');
      });

    fetchEnemies()
      .then(enemies => setEnemyTypes(enemies))
      .catch(() => {
        console.error('Erreur lors du chargement des ennemis');
      });

    fetchLeaderboard()
      .then(scores => setLeaderboard(scores))
      .catch(() => {
        console.error('Erreur lors du chargement du leaderboard');
      });
  }, []);

  return {
    // États
    gemTypes,
    fusionRecipes,
    enemyTypes,
    leaderboard,

    // Setters
    setGemTypes,
    setFusionRecipes,
    setEnemyTypes,
    setLeaderboard
  };
};
