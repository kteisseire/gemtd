import { useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TOOLBAR_HEIGHT, GRID_SIZE, COLS, ROWS, isInSpawnZone, isInGoalZone, isInCheckpointZone } from '../config/constants';
import { getMenuButtons, getAdminButtons, getContextMenuButtons, getToolbarButtons, getGameOverButtons } from '../renderers';

/**
 * Hook personnalisé pour gérer les événements de souris
 * Gestion du survol, drag de la caméra, tooltips
 */
export const useMouseHandlers = (deps) => {
  const {
    canvasRef, getZoom, camera, isDragging, dragStart,
    // States
    gameState, contextMenu, adminPage, pseudo, gemTypes, editingGem, fusionRecipes,
    lives, wave, score, placementCount, gameSpeed, tempTowers, selectedTempTower,
    selectedTowerToDelete, towers, enemies,
    // Setters
    setMousePos, setCamera, clampCamera, setHoveredButton, setHoveredMenuButton,
    setHoveredCell, setHoveredTower, setIsDragging, setDragStart,
    // Functions
    checkFusionPossible, goToMenuFull, setGameState, setGameSpeed, zoomIn,
    zoomOut, resetCamera, deleteTower, startWave, resetGameFull
  } = deps;

  const handleCanvasMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const zoom = getZoom();

    setMousePos({ x, y });

    // Dragging
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      const clamped = clampCamera(newX, newY, zoom);
      setCamera(prev => ({ ...prev, ...clamped }));
      return;
    }

    // Context menu hover
    if (contextMenu) {
      const cmButtons = getContextMenuButtons(contextMenu, checkFusionPossible);
      let found = null;
      for (const btn of cmButtons) {
        if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
          found = btn.id;
          break;
        }
      }
      setHoveredButton(found);
      return;
    }

    // Game Over hover
    if (gameState === 'gameOver') {
      const gameOverButtons = getGameOverButtons();
      let found = null;
      for (const btn of gameOverButtons) {
        if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
          found = btn.id;
          break;
        }
      }
      setHoveredButton(found);
      return;
    }

    // Menu hover
    if (gameState === 'menu' && !adminPage) {
      const centerX = CANVAS_WIDTH / 2;
      const centerY = CANVAS_HEIGHT / 2;
      const menuButtons = getMenuButtons(centerX, centerY, pseudo);
      let found = null;
      for (const btn of menuButtons) {
        if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
          found = btn.id;
          break;
        }
      }
      setHoveredMenuButton(found);
      return;
    }

    // Admin hover
    if (adminPage) {
      const adminButtons = getAdminButtons(adminPage, gemTypes, editingGem, fusionRecipes);
      let found = null;
      for (const btn of adminButtons) {
        if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
          found = btn.id;
          break;
        }
      }
      setHoveredMenuButton(found);
      return;
    }

    // Toolbar hover
    if (y <= TOOLBAR_HEIGHT) {
      const toolbarButtons = getToolbarButtons({
        gameState, lives, wave, score, placementCount, camera, gameSpeed,
        tempTowers, selectedTempTower, selectedTowerToDelete, towers, enemies,
        goToMenu: goToMenuFull, setGameState, setGameSpeed, zoomIn, zoomOut, resetCamera,
        setSelectedTempTower, deleteTower, startWave, resetGame: resetGameFull
      });
      let found = null;
      for (const btn of toolbarButtons) {
        if (x >= btn.x && x <= btn.x + btn.width) {
          found = btn.id;
          break;
        }
      }
      setHoveredButton(found);
      setHoveredTower(null);
      setHoveredCell(null);
      return;
    }

    setHoveredButton(null);

    // Game world hover
    const worldX = (x - camera.x) / zoom;
    const worldY = (y - TOOLBAR_HEIGHT - camera.y) / zoom;
    const gridX = Math.floor(worldX / GRID_SIZE);
    const gridY = Math.floor(worldY / GRID_SIZE);

    if (gridX >= 0 && gridX < COLS && gridY >= 0 && gridY < ROWS) {
      if (!isInSpawnZone(gridX, gridY) && !isInGoalZone(gridX, gridY) && !isInCheckpointZone(gridX, gridY)) {
        setHoveredCell({ x: gridX, y: gridY });
      } else {
        setHoveredCell(null);
      }

      const tower = [...towers, ...tempTowers].find(t => t.gridX === gridX && t.gridY === gridY);
      setHoveredTower(tower ? tower.id : null);
    } else {
      setHoveredCell(null);
      setHoveredTower(null);
    }
  }, [canvasRef, getZoom, camera, isDragging, dragStart, gameState, contextMenu, adminPage, pseudo, gemTypes,
    editingGem, fusionRecipes, lives, wave, score, placementCount, gameSpeed, tempTowers, selectedTempTower,
    selectedTowerToDelete, towers, enemies, setMousePos, setCamera, clampCamera, setHoveredButton,
    setHoveredMenuButton, setHoveredCell, setHoveredTower, checkFusionPossible, goToMenuFull, setGameState,
    setGameSpeed, zoomIn, zoomOut, resetCamera, deleteTower, startWave, resetGameFull]);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 1 || e.button === 2) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - camera.x, y: e.clientY - camera.y });
    }
  }, [setIsDragging, setDragStart, camera]);

  const handleMouseUp = useCallback(() => setIsDragging(false), [setIsDragging]);

  return { handleCanvasMouseMove, handleMouseDown, handleMouseUp };
};
