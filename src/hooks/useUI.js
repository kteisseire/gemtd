import { useState } from 'react';

/**
 * Hook personnalisé pour gérer l'état de l'interface utilisateur
 * @returns {Object} État de l'UI et fonctions de gestion
 */
export const useUI = () => {
  const [hoveredTower, setHoveredTower] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [hoveredMenuButton, setHoveredMenuButton] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState(null);

  return {
    // États
    hoveredTower,
    hoveredCell,
    hoveredButton,
    hoveredMenuButton,
    mousePos,
    contextMenu,

    // Setters
    setHoveredTower,
    setHoveredCell,
    setHoveredButton,
    setHoveredMenuButton,
    setMousePos,
    setContextMenu
  };
};
