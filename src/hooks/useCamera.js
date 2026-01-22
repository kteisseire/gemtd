import { useState, useCallback, useMemo } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TOOLBAR_HEIGHT, COLS, ROWS, ZOOM_LEVELS, ISO_TILE_WIDTH, ISO_TILE_HEIGHT } from '../config/constants';

export const useCamera = () => {
  // Calculer l'offset initial pour centrer la grille isométrique
  const initialOffset = useMemo(() => {
    // Dimensions de la grille isométrique (avec l'offset intégré dans gridToIso)
    // La grille va de x=0 à x=(COLS+ROWS-2) * (ISO_TILE_WIDTH/2)
    const isoWidth = (COLS + ROWS - 2) * (ISO_TILE_WIDTH / 2);
    const isoHeight = (COLS + ROWS - 2) * (ISO_TILE_HEIGHT / 2);

    // Centrer horizontalement et verticalement (avec zoom par défaut = niveau 2 = 1.0)
    const offsetX = (CANVAS_WIDTH - isoWidth * ZOOM_LEVELS[2]) / 2;
    const offsetY = ((CANVAS_HEIGHT - TOOLBAR_HEIGHT) - isoHeight * ZOOM_LEVELS[2]) / 2;

    return { x: offsetX, y: offsetY };
  }, []);

  const [camera, setCamera] = useState({ x: initialOffset.x, y: initialOffset.y, zoomLevel: 2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const getZoom = useCallback(() => ZOOM_LEVELS[camera.zoomLevel], [camera.zoomLevel]);

  const clampCamera = useCallback((x, y, zoom) => {
    // Dimensions de la grille isométrique (avec l'offset intégré)
    const isoWidth = (COLS + ROWS - 2) * (ISO_TILE_WIDTH / 2) * zoom;
    const isoHeight = (COLS + ROWS - 2) * (ISO_TILE_HEIGHT / 2) * zoom;

    // Permettre un peu de marge pour voir au-delà des bords
    const margin = 100;
    const maxX = margin;
    const minX = CANVAS_WIDTH - isoWidth - margin;
    const maxY = margin;
    const minY = (CANVAS_HEIGHT - TOOLBAR_HEIGHT) - isoHeight - margin;

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y))
    };
  }, []);

  const zoomIn = useCallback(() => {
    setCamera(prev => {
      const newLevel = Math.min(ZOOM_LEVELS.length - 1, prev.zoomLevel + 1);
      const newZoom = ZOOM_LEVELS[newLevel];
      const clamped = clampCamera(prev.x, prev.y, newZoom);
      return { ...clamped, zoomLevel: newLevel };
    });
  }, [clampCamera]);

  const zoomOut = useCallback(() => {
    setCamera(prev => {
      const newLevel = Math.max(0, prev.zoomLevel - 1);
      const newZoom = ZOOM_LEVELS[newLevel];
      const clamped = clampCamera(prev.x, prev.y, newZoom);
      return { ...clamped, zoomLevel: newLevel };
    });
  }, [clampCamera]);

  const resetCamera = useCallback(() => {
    setCamera({ x: initialOffset.x, y: initialOffset.y, zoomLevel: 2 });
  }, [initialOffset]);

  const startDrag = useCallback((e, currentCamera) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - currentCamera.x, y: e.clientY - currentCamera.y });
  }, []);

  const updateDrag = useCallback((e, currentZoom) => {
    if (!isDragging) return null;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    return clampCamera(newX, newY, currentZoom);
  }, [isDragging, dragStart, clampCamera]);

  const endDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    camera,
    setCamera,
    isDragging,
    setIsDragging,
    dragStart,
    setDragStart,
    getZoom,
    clampCamera,
    zoomIn,
    zoomOut,
    resetCamera,
    startDrag,
    updateDrag,
    endDrag
  };
};
