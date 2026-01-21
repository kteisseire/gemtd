import { useState } from 'react';

/**
 * Hook personnalisé pour gérer les ennemis et projectiles
 * @returns {Object} État des ennemis/projectiles et fonctions de gestion
 */
export const useEnemies = () => {
  const [enemies, setEnemies] = useState([]);
  const [projectiles, setProjectiles] = useState([]);

  return {
    // États
    enemies,
    projectiles,

    // Setters
    setEnemies,
    setProjectiles
  };
};
