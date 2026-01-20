import { useState, useCallback } from 'react';

export const useLocalStorage = () => {
  const [pseudo, setPseudo] = useState(() => localStorage.getItem('gtd_pseudo') || '');
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('gtd_bestScore')) || 0);
  const [lastScore, setLastScore] = useState(() => parseInt(localStorage.getItem('gtd_lastScore')) || 0);

  const updatePseudo = useCallback((newPseudo) => {
    setPseudo(newPseudo);
    localStorage.setItem('gtd_pseudo', newPseudo);
  }, []);

  const saveScore = useCallback((score) => {
    setLastScore(score);
    localStorage.setItem('gtd_lastScore', score.toString());
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('gtd_bestScore', score.toString());
    }
  }, [bestScore]);

  return {
    pseudo,
    bestScore,
    lastScore,
    updatePseudo,
    saveScore
  };
};
