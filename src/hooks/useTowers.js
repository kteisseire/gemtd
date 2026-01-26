import { useState, useCallback } from 'react';
import { soundManager } from '../services/soundManager';

/**
 * Hook personnalisé pour gérer les tourelles (permanentes et temporaires)
 * @returns {Object} État des tourelles et fonctions de gestion
 */
export const useTowers = () => {
  const [towers, setTowers] = useState([]);
  const [tempTowers, setTempTowers] = useState([]);
  const [selectedTowerToDelete, setSelectedTowerToDelete] = useState(null);
  const [selectedTempTower, setSelectedTempTower] = useState(null);

  const deleteTower = useCallback(() => {
    if (selectedTowerToDelete !== null) {
      setTowers(prev => prev.filter(t => t.id !== selectedTowerToDelete));
      setSelectedTowerToDelete(null);
      soundManager.sellTower();
    }
  }, [selectedTowerToDelete]);

  const clearTempTowers = useCallback(() => {
    setTempTowers([]);
  }, []);

  return {
    // États
    towers,
    tempTowers,
    selectedTowerToDelete,
    selectedTempTower,

    // Setters
    setTowers,
    setTempTowers,
    setSelectedTowerToDelete,
    setSelectedTempTower,

    // Actions
    deleteTower,
    clearTempTowers
  };
};
