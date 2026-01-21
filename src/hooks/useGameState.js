import { useState, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer l'état global du jeu
 * @returns {Object} État du jeu et fonctions de mise à jour
 */
export const useGameState = () => {
  const [gameState, setGameState] = useState('menu');
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [placementCount, setPlacementCount] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [errorMessage, setErrorMessage] = useState(null);

  const resetGame = useCallback(() => {
    setLives(20);
    setWave(1);
    setScore(0);
    setPlacementCount(0);
    setGameSpeed(1);
    setErrorMessage(null);
  }, []);

  const goToMenu = useCallback(() => {
    setGameState('menu');
  }, []);

  return {
    // États
    gameState,
    lives,
    wave,
    score,
    placementCount,
    gameSpeed,
    errorMessage,

    // Setters
    setGameState,
    setLives,
    setWave,
    setScore,
    setPlacementCount,
    setGameSpeed,
    setErrorMessage,

    // Actions
    resetGame,
    goToMenu
  };
};
