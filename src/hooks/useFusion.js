import { useCallback } from 'react';

/**
 * Hook personnalisé pour gérer la logique de fusion des gemmes
 * Centralise la vérification et l'exécution des fusions
 *
 * @param {Object} params - Paramètres du hook
 * @param {Array} params.towers - Liste des tours existantes
 * @param {Function} params.setTowers - Fonction pour modifier les tours
 * @param {Array} params.fusionRecipes - Recettes de fusion disponibles
 * @param {Object} params.gemTypes - Types de gemmes avec leurs propriétés
 * @returns {Object} Fonctions de fusion
 */
export const useFusion = ({ towers, setTowers, fusionRecipes, gemTypes }) => {
  /**
   * Vérifie si une fusion est possible pour une tour donnée
   * @param {Object} tower - La tour à vérifier
   * @returns {Object|null} Informations sur la fusion possible ou null
   */
  const checkFusionPossible = useCallback((tower) => {
    if (!tower || tower.type === 'BASE') return null;

    for (const recipe of fusionRecipes) {
      const requiredGems = recipe.required_gems.split(',');
      if (!requiredGems.includes(tower.type)) continue;

      const availableRecipeGems = towers.filter(t => requiredGems.includes(t.type));
      if (availableRecipeGems.length >= recipe.min_count) {
        return {
          recipe,
          availableGems: availableRecipeGems,
          resultGemId: recipe.result_gem_id
        };
      }
    }

    return null;
  }, [fusionRecipes, towers]);

  /**
   * Exécute la fusion d'une tour avec d'autres gemmes
   * @param {Object} selectedTower - La tour sélectionnée pour la fusion
   * @param {Object} fusionInfo - Informations sur la fusion (recipe, availableGems, resultGemId)
   */
  const performFusion = useCallback((selectedTower, fusionInfo) => {
    const updatedTowers = [...towers];
    const selectedIndex = updatedTowers.findIndex(t => t.id === selectedTower.id);
    if (selectedIndex === -1) return;

    // Transformer la tour sélectionnée en gemme fusionnée
    const fusedGemType = gemTypes[fusionInfo.resultGemId];
    updatedTowers[selectedIndex] = {
      id: selectedTower.id,
      gridX: selectedTower.gridX,
      gridY: selectedTower.gridY,
      x: selectedTower.x,
      y: selectedTower.y,
      type: fusionInfo.resultGemId,
      level: selectedTower.level,
      isTemporary: false,
      ...fusedGemType
    };

    // Convertir 2 autres gemmes de la recette en gemmes BASE
    const otherRecipeGems = fusionInfo.availableGems.filter(g => g.id !== selectedTower.id);
    const shuffled = [...otherRecipeGems].sort(() => Math.random() - 0.5);
    const gemsToConvert = shuffled.slice(0, 2);
    const baseGemType = gemTypes['BASE'];

    gemsToConvert.forEach(gem => {
      const idx = updatedTowers.findIndex(t => t.id === gem.id);
      if (idx !== -1) {
        updatedTowers[idx] = {
          id: updatedTowers[idx].id,
          gridX: updatedTowers[idx].gridX,
          gridY: updatedTowers[idx].gridY,
          x: updatedTowers[idx].x,
          y: updatedTowers[idx].y,
          type: 'BASE',
          level: updatedTowers[idx].level,
          isTemporary: false,
          ...baseGemType
        };
      }
    });

    setTowers(updatedTowers);
  }, [towers, gemTypes, setTowers]);

  return {
    checkFusionPossible,
    performFusion
  };
};
