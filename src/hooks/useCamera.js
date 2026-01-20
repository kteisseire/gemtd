import { useState, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TOOLBAR_HEIGHT, COLS, ROWS, GRID_SIZE, ZOOM_LEVELS } from '../config/constants';

export const useCamera = () => {
  const [camera, setCamera] = useState({ x: 0, y: 0, zoomLevel: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const getZoom = useCallback(() => ZOOM_LEVELS[camera.zoomLevel], [camera.zoomLevel]);

  const clampCamera = useCallback((x, y, zoom) => {
    const worldWidth = COLS * GRID_SIZE * zoom;
    const worldHeight = ROWS * GRID_SIZE * zoom;
    const maxX = 0;
    const minX = CANVAS_WIDTH - worldWidth;
    const maxY = 0;
    const minY = (CANVAS_HEIGHT - TOOLBAR_HEIGHT) - worldHeight;
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
    setCamera({ x: 0, y: 0, zoomLevel: 0 });
  }, []);

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
