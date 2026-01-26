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
  const [hoveredEnemy, setHoveredEnemy] = useState(null);
  const [hoveredVolumeSlider, setHoveredVolumeSlider] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState(null);
  const [musicVolume, setMusicVolume] = useState(0.15);
  const [sfxVolume, setSfxVolume] = useState(0.25);

  return {
    // États
    hoveredTower,
    hoveredCell,
    hoveredButton,
    hoveredMenuButton,
    hoveredEnemy,
    hoveredVolumeSlider,
    mousePos,
    contextMenu,
    musicVolume,
    sfxVolume,

    // Setters
    setHoveredTower,
    setHoveredCell,
    setHoveredButton,
    setHoveredMenuButton,
    setHoveredEnemy,
    setHoveredVolumeSlider,
    setMousePos,
    setContextMenu,
    setMusicVolume,
    setSfxVolume
  };
};
