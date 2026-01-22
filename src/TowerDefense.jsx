import React, { useState, useEffect, useRef, useCallback } from 'react';

// Components
import { FieldInputEditor, EffectSelector, EmojiSelector } from './components/admin';

// Config
import { TOOLBAR_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from './config/constants';
import { submitScore, fetchLeaderboard } from './services/api';
import { createWaveEnemies, canPlaceTower, createTower, prepareWaveStart } from './services/gameLogic';
import { getEnemyPosition, findTowerTarget, createProjectile } from './services/combatSystem';

// Hooks
import { useLocalStorage } from './hooks/useLocalStorage';
import { useImages } from './hooks/useImages';
import { useCamera } from './hooks/useCamera';
import { useUI } from './hooks/useUI';
import { useEnemies } from './hooks/useEnemies';
import { useTowers } from './hooks/useTowers';
import { useAdmin } from './hooks/useAdmin';
import { useAdminHandlers } from './hooks/useAdminHandlers';
import { useGameState } from './hooks/useGameState';
import { useGameData } from './hooks/useGameData';
import { useGameLoop } from './hooks/useGameLoop';
import { useCanvasHandlers } from './hooks/useCanvasHandlers';
import { useMouseHandlers } from './hooks/useMouseHandlers';

// Renderers
import {
  clearCanvas, createGrassCache, drawGrassBackground,
  getToolbarButtons, drawToolbar,
  drawMainMenu,
  drawAdminPage,
  drawPath, drawSpawnPortal, drawGoal, drawCheckpoints,
  drawTowers, drawTempTowers, drawEnemies, drawProjectiles, drawPlacementPreview,
  drawErrorOverlay, drawGameOverOverlay, drawTowerTooltip, drawToolbarTooltip,
  drawContextMenu
} from './renderers';

const TowerDefense = () => {
  const canvasRef = useRef(null);

  // Custom hooks
  const { pseudo, bestScore, lastScore, updatePseudo, saveScore } = useLocalStorage();
  const { logoImage, grassImage, portailImage, arriveeImage, checkpointImages, grassCanvasRef } = useImages();
  const { camera, setCamera, isDragging, setIsDragging, dragStart, setDragStart, getZoom, clampCamera, zoomIn, zoomOut, resetCamera } = useCamera();
  const { hoveredTower, setHoveredTower, hoveredCell, setHoveredCell, hoveredButton, setHoveredButton, hoveredMenuButton, setHoveredMenuButton, mousePos, setMousePos, contextMenu, setContextMenu } = useUI();
  const { enemies, setEnemies, projectiles, setProjectiles } = useEnemies();
  const { towers, setTowers, tempTowers, setTempTowers, selectedTowerToDelete, setSelectedTowerToDelete, selectedTempTower, setSelectedTempTower, deleteTower, clearTempTowers } = useTowers();
  const { adminPage, setAdminPage, editingGem, setEditingGem, adminMessage, setAdminMessage, editingRecipe, setEditingRecipe, showColorPicker, setShowColorPicker, colorPickerPosition, setColorPickerPosition, showEffectSelector, setShowEffectSelector, showEmojiSelector, setShowEmojiSelector, showRecipeEditor, setShowRecipeEditor, editingField, setEditingField, fieldInputValue, setFieldInputValue, fieldInputPosition, setFieldInputPosition } = useAdmin();
  const { gameState, setGameState, lives, setLives, wave, setWave, score, setScore, placementCount, setPlacementCount, gameSpeed, setGameSpeed, errorMessage, setErrorMessage, resetGame, goToMenu } = useGameState();
  const { handleColorChange, handleEffectToggle, handleEmojiClick } = useAdminHandlers({ setEditingGem, setShowColorPicker, setShowEmojiSelector });
  const { gemTypes, setGemTypes, fusionRecipes, setFusionRecipes, leaderboard, setLeaderboard } = useGameData();

  // Other state
  const [currentPath, setCurrentPath] = useState(null);
  const [previousWaveHealth, setPreviousWaveHealth] = useState(0);

  // Refs
  const enemyIdCounter = useRef(0);
  const colorPickerRef = useRef(null);
  const scoreSubmittedRef = useRef(false);

  // Verifier si une fusion est possible
  const checkFusionPossible = useCallback((tower) => {
    if (!tower || tower.type === 'BASE') return null;
    for (const recipe of fusionRecipes) {
      const requiredGems = recipe.required_gems.split(',');
      if (!requiredGems.includes(tower.type)) continue;
      const availableRecipeGems = towers.filter(t => requiredGems.includes(t.type));
      if (availableRecipeGems.length >= recipe.min_count) {
        return { recipe, availableGems: availableRecipeGems, resultGemId: recipe.result_gem_id };
      }
    }
    return null;
  }, [fusionRecipes, towers]);

  // Executer la fusion
  const performFusion = useCallback((selectedTower, fusionInfo) => {
    const updatedTowers = [...towers];
    const selectedIndex = updatedTowers.findIndex(t => t.id === selectedTower.id);
    if (selectedIndex === -1) return;

    const fusedGemType = gemTypes[fusionInfo.resultGemId];
    updatedTowers[selectedIndex] = {
      id: selectedTower.id, gridX: selectedTower.gridX, gridY: selectedTower.gridY,
      x: selectedTower.x, y: selectedTower.y, type: fusionInfo.resultGemId,
      level: selectedTower.level, isTemporary: false, ...fusedGemType
    };

    const otherRecipeGems = fusionInfo.availableGems.filter(g => g.id !== selectedTower.id);
    const shuffled = [...otherRecipeGems].sort(() => Math.random() - 0.5);
    const gemsToConvert = shuffled.slice(0, 2);
    const baseGemType = gemTypes['BASE'];

    gemsToConvert.forEach(gem => {
      const idx = updatedTowers.findIndex(t => t.id === gem.id);
      if (idx !== -1) {
        updatedTowers[idx] = {
          id: updatedTowers[idx].id, gridX: updatedTowers[idx].gridX, gridY: updatedTowers[idx].gridY,
          x: updatedTowers[idx].x, y: updatedTowers[idx].y, type: 'BASE',
          level: updatedTowers[idx].level, isTemporary: false, ...baseGemType
        };
      }
    });

    setTowers(updatedTowers);
  }, [towers, gemTypes]);

  // Spawn wave
  const spawnWave = useCallback(() => {
    const { enemies: newEnemies, newPreviousWaveHealth } = createWaveEnemies(wave, gemTypes, previousWaveHealth, enemyIdCounter);
    setPreviousWaveHealth(newPreviousWaveHealth);
    setEnemies(newEnemies);
    setGameState('wave');
  }, [wave, gemTypes, previousWaveHealth]);

  // Start wave
  const startWave = () => {
    if (gameState !== 'preparation') return;
    const { allTowers, path } = prepareWaveStart(towers, tempTowers, selectedTempTower, gemTypes);
    if (!path) {
      setErrorMessage("Chemin bloque !");
      return;
    }
    setTowers(allTowers);
    setCurrentPath(path);
    setTempTowers([]);
    setSelectedTempTower(null);
    setPlacementCount(0);
    setContextMenu(null);
    spawnWave();
  };

  // Place tower
  const placeTower = (gridX, gridY) => {
    if (gameState !== 'preparation' || placementCount >= 5) return;
    if (!canPlaceTower(gridX, gridY, towers, tempTowers)) return;
    const newTower = createTower(gridX, gridY, gemTypes);
    if (!newTower) return;
    setTempTowers(prev => [...prev, newTower]);
    setPlacementCount(prev => prev + 1);
  };

  // Reset game
  const resetGameFull = () => {
    setGameState('preparation');
    setTowers([]);
    setTempTowers([]);
    setEnemies([]);
    setProjectiles([]);
    setCurrentPath(null);
    setSelectedTempTower(null);
    setSelectedTowerToDelete(null);
    setContextMenu(null);
    resetCamera();
    resetGame(); // Call hook's resetGame for game state
  };

  // Go to menu
  const goToMenuFull = () => {
    if (score > 0) saveScore(score);
    goToMenu(); // Call hook's goToMenu
    setAdminPage(null);
  };

  // Start new game
  const startNewGame = () => {
    resetGameFull();
    setGameState('preparation');
    scoreSubmittedRef.current = false;
  };

  // Game loop (extracted to useGameLoop hook)
  useGameLoop({
    gameState, gameSpeed, towers, tempTowers, enemies, currentPath,
    setEnemies, setProjectiles, setLives, setScore
  });

  // Wave completion
  useEffect(() => {
    if (gameState === 'wave' && enemies.length === 0) {
      setTimeout(() => {
        setWave(w => w + 1);
        setGameState('preparation');
        setPlacementCount(0);
      }, 1000);
    }
  }, [gameState, enemies.length]);

  // Game over
  useEffect(() => {
    if (lives <= 0 && gameState !== 'gameOver') {
      setGameState('gameOver');
      saveScore(score);
      // Envoyer le score au leaderboard une seule fois si le pseudo est défini et le score > 0
      if (pseudo && score > 0 && !scoreSubmittedRef.current) {
        scoreSubmittedRef.current = true;
        submitScore(pseudo, score, wave)
          .then(() => {
            // Recharger le leaderboard après soumission
            fetchLeaderboard().then(scores => setLeaderboard(scores));
          })
          .catch(err => console.error('Erreur soumission score:', err));
      }
    }
  }, [lives, score, wave, pseudo, saveScore, gameState]);

  // Canvas handlers (extracted to hooks)
  const { handleCanvasClick } = useCanvasHandlers({
    canvasRef, getZoom, camera, gameState, contextMenu, adminPage, pseudo, gemTypes, editingGem, fusionRecipes,
    lives, wave, score, placementCount, gameSpeed, tempTowers, selectedTempTower, selectedTowerToDelete, towers,
    enemies, editingRecipe, setContextMenu, setAdminPage, updatePseudo, setEditingGem, setGemTypes, setAdminMessage,
    setFusionRecipes, setTempTowers, setPlacementCount, setSelectedTempTower, setTowers, setSelectedTowerToDelete,
    setColorPickerPosition, setShowColorPicker, setShowEffectSelector, setShowEmojiSelector, setFieldInputPosition,
    setFieldInputValue, setEditingField, colorPickerRef, setShowRecipeEditor, setEditingRecipe, setGameState,
    checkFusionPossible, performFusion, startWave, startNewGame, goToMenuFull, setGameSpeed, zoomIn, zoomOut,
    resetCamera, deleteTower, resetGameFull, placeTower
  });

  const { handleCanvasMouseMove, handleMouseDown, handleMouseUp } = useMouseHandlers({
    canvasRef, getZoom, camera, isDragging, dragStart, gameState, contextMenu, adminPage, pseudo, gemTypes,
    editingGem, fusionRecipes, lives, wave, score, placementCount, gameSpeed, tempTowers, selectedTempTower,
    selectedTowerToDelete, towers, enemies, setMousePos, setCamera, clampCamera, setHoveredButton,
    setHoveredMenuButton, setHoveredCell, setHoveredTower, setIsDragging, setDragStart, checkFusionPossible,
    goToMenuFull, setGameState, setGameSpeed, zoomIn, zoomOut, resetCamera, deleteTower, startWave, resetGameFull
  });

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const zoom = getZoom();
    const isMenuOrAdmin = gameState === 'menu' || adminPage;

    clearCanvas(ctx);

    // Grass background
    if (!isMenuOrAdmin) {
      createGrassCache(grassImage, grassCanvasRef);
      drawGrassBackground(ctx, camera, zoom, grassCanvasRef);
    }

    // Toolbar
    const toolbarButtons = getToolbarButtons({
      gameState, lives, wave, score, placementCount, camera, gameSpeed,
      tempTowers, selectedTempTower, selectedTowerToDelete, towers, enemies,
      goToMenu: goToMenuFull, setGameState, setGameSpeed, zoomIn, zoomOut, resetCamera,
      setSelectedTempTower, deleteTower, startWave, resetGame: resetGameFull
    });

    if (!isMenuOrAdmin) {
      drawToolbar(ctx, toolbarButtons, hoveredButton);
    }

    // Menu
    if (gameState === 'menu' && !adminPage) {
      drawMainMenu(ctx, { logoImage, hoveredMenuButton, pseudo, bestScore, lastScore, leaderboard });
      return;
    }

    // Admin
    if (adminPage) {
      drawAdminPage(ctx, adminPage, {
        gemTypes, fusionRecipes, hoveredMenuButton, editingGem, adminMessage
      });
      return;
    }

    // Game world
    ctx.save();
    ctx.translate(camera.x, camera.y + TOOLBAR_HEIGHT);
    ctx.scale(zoom, zoom);

    drawPath(ctx, currentPath, zoom);
    drawSpawnPortal(ctx, portailImage, zoom);
    drawGoal(ctx, arriveeImage, zoom);
    drawCheckpoints(ctx, checkpointImages, zoom);

    drawTowers(ctx, towers, { hoveredTower, selectedTowerToDelete, gameState, checkFusionPossible, zoom });
    drawTempTowers(ctx, tempTowers, { hoveredTower, selectedTempTower, zoom });
    drawEnemies(ctx, enemies, currentPath, zoom);
    drawPlacementPreview(ctx, hoveredCell, { gameState, placementCount, towers, tempTowers });
    drawProjectiles(ctx, projectiles);

    ctx.restore();

    // Overlays
    if (errorMessage) drawErrorOverlay(ctx, errorMessage);
    if (gameState === 'gameOver') drawGameOverOverlay(ctx, score, wave);
    if (hoveredTower && !contextMenu) {
      drawTowerTooltip(ctx, { hoveredTower, towers, tempTowers, mousePos, gemTypes, fusionRecipes });
    }
    if (hoveredButton) {
      drawToolbarTooltip(ctx, { hoveredButton, mousePos, toolbarButtons });
    }
    if (contextMenu && gameState === 'preparation') {
      drawContextMenu(ctx, contextMenu, { checkFusionPossible, hoveredButton });
    }
  }, [
    gameState, lives, wave, score, placementCount, towers, tempTowers, enemies, projectiles,
    currentPath, camera, hoveredTower, hoveredCell, hoveredButton, hoveredMenuButton,
    selectedTempTower, selectedTowerToDelete, contextMenu, mousePos, errorMessage,
    gameSpeed, adminPage, editingGem, adminMessage, gemTypes, fusionRecipes,
    logoImage, grassImage, portailImage, arriveeImage, checkpointImages,
    pseudo, bestScore, lastScore, leaderboard, getZoom, checkFusionPossible
  ]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div id="game-container" className={gameState === 'menu' || adminPage ? 'menu-active' : ''} style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp();
            setHoveredTower(null);
            setHoveredCell(null);
            setHoveredButton(null);
          }}
          onContextMenu={(e) => e.preventDefault()}
          className={`border-2 border-gray-700 ${
            gameState === 'preparation' && !isDragging ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-default'
          }`}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        {/* Color Picker */}
        {showColorPicker && editingGem && (
          <input
            ref={colorPickerRef}
            type="color"
            value={editingGem.color || '#888888'}
            onChange={handleColorChange}
            style={{
              position: 'absolute',
              left: `${colorPickerPosition.x}px`,
              top: `${colorPickerPosition.y}px`,
              opacity: 0,
              pointerEvents: 'all'
            }}
          />
        )}

        {/* Field Input Editor */}
        <FieldInputEditor
          editingField={editingField}
          fieldInputValue={fieldInputValue}
          fieldInputPosition={fieldInputPosition}
          onValueChange={setFieldInputValue}
          onSave={() => {
            const parsedValue = ['damage', 'speed', 'range'].includes(editingField)
              ? parseInt(fieldInputValue) || 0
              : fieldInputValue;
            setEditingGem(prev => ({ ...prev, [editingField]: parsedValue }));
            setEditingField(null);
          }}
          onCancel={() => setEditingField(null)}
        />

        {/* Effect Selector - Multi-sélection */}
        <EffectSelector
          editingGem={editingGem}
          showEffectSelector={showEffectSelector}
          onEffectToggle={handleEffectToggle}
          onClose={() => setShowEffectSelector(false)}
        />

        {/* Emoji Picker */}
        <EmojiSelector
          showEmojiSelector={showEmojiSelector}
          onEmojiClick={handleEmojiClick}
          onClose={() => setShowEmojiSelector(false)}
        />

        {/* Recipe Editor */}
        {showRecipeEditor && editingRecipe && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              backgroundColor: 'rgba(15, 23, 42, 0.98)',
              padding: '30px',
              borderRadius: '15px',
              border: '3px solid #a855f7',
              width: '700px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <h2 style={{ color: '#f1f5f9', marginBottom: '10px', fontSize: '24px', fontWeight: 'bold', textAlign: 'center' }}>
              🔮 {editingRecipe.id ? 'Modifier la recette' : 'Créer une recette de fusion'}
            </h2>

            {/* Section Ingrédients */}
            <div style={{ marginTop: '25px' }}>
              <h3 style={{ color: '#a855f7', fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                Ingrédients requis
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '15px' }}>
                Sélectionnez les gemmes nécessaires pour cette fusion
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                {Object.entries(gemTypes)
                  .filter(([key]) => key !== 'BASE')
                  .map(([key, gem]) => {
                    const isSelected = editingRecipe.required_gems.includes(key);
                    return (
                      <div
                        key={key}
                        onClick={() => {
                          const ingredients = [...editingRecipe.required_gems];
                          const index = ingredients.indexOf(key);
                          if (index >= 0) {
                            ingredients.splice(index, 1);
                          } else {
                            ingredients.push(key);
                          }
                          setEditingRecipe(prev => ({ ...prev, required_gems: ingredients }));
                        }}
                        style={{
                          padding: '12px',
                          backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.3)' : 'rgba(30, 41, 59, 0.5)',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #a855f7' : '2px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontSize: '32px', marginBottom: '5px' }}>{gem.icon}</div>
                        <div style={{ color: '#f1f5f9', fontSize: '12px', fontWeight: isSelected ? 'bold' : 'normal' }}>
                          {key}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Section Résultat */}
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ color: '#22c55e', fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                Gemme résultat
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '15px' }}>
                Sélectionnez la gemme qui sera créée
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
                {Object.entries(gemTypes)
                  .filter(([key]) => key !== 'BASE')
                  .map(([key, gem]) => {
                    const isSelected = editingRecipe.result_gem_id === key;
                    return (
                      <div
                        key={key}
                        onClick={() => setEditingRecipe(prev => ({ ...prev, result_gem_id: key }))}
                        style={{
                          padding: '12px',
                          backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(30, 41, 59, 0.5)',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid #22c55e' : '2px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontSize: '32px', marginBottom: '5px' }}>{gem.icon}</div>
                        <div style={{ color: '#f1f5f9', fontSize: '12px', fontWeight: isSelected ? 'bold' : 'normal' }}>
                          {key}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Section Minimum */}
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
                Nombre minimum de gemmes
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '15px' }}>
                Nombre minimum d'ingrédients requis pour déclencher la fusion
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={editingRecipe.min_count}
                  onChange={(e) => setEditingRecipe(prev => ({ ...prev, min_count: parseInt(e.target.value) }))}
                  style={{
                    flex: 1,
                    height: '8px',
                    borderRadius: '4px',
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(editingRecipe.min_count - 2) * 12.5}%, #1e293b ${(editingRecipe.min_count - 2) * 12.5}%, #1e293b 100%)`,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{
                  minWidth: '60px',
                  padding: '10px',
                  backgroundColor: '#3b82f6',
                  color: '#f1f5f9',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  {editingRecipe.min_count}
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowRecipeEditor(false);
                  setEditingRecipe(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#475569',
                  color: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  // Sauvegarder la recette
                  if (editingRecipe.required_gems.length === 0) {
                    setAdminMessage({ type: 'error', text: 'Sélectionnez au moins un ingrédient !' });
                    setTimeout(() => setAdminMessage(null), 3000);
                    return;
                  }
                  if (!editingRecipe.result_gem_id) {
                    setAdminMessage({ type: 'error', text: 'Sélectionnez une gemme résultat !' });
                    setTimeout(() => setAdminMessage(null), 3000);
                    return;
                  }

                  const recipeData = {
                    required_gems: editingRecipe.required_gems.join(','),
                    result_gem_id: editingRecipe.result_gem_id,
                    min_count: editingRecipe.min_count
                  };

                  createRecipe(recipeData)
                    .then(newRecipe => {
                      setFusionRecipes(prev => [...prev, newRecipe]);
                      setAdminMessage({ type: 'success', text: 'Recette ajoutée en BDD !' });
                      setTimeout(() => setAdminMessage(null), 3000);
                      setShowRecipeEditor(false);
                      setEditingRecipe(null);
                    })
                    .catch(err => {
                      setAdminMessage({ type: 'error', text: `Erreur: ${err.message}` });
                      setTimeout(() => setAdminMessage(null), 3000);
                    });
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#22c55e',
                  color: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                💾 Sauvegarder
              </button>
            </div>
          </div>
        )}

        {/* Overlay sombre pour les sélecteurs */}
        {(showEffectSelector || showEmojiSelector || showRecipeEditor) && (
          <div
            onClick={() => {
              setShowEffectSelector(false);
              setShowEmojiSelector(false);
              setShowRecipeEditor(false);
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 999
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TowerDefense;
