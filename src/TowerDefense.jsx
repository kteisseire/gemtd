import React, { useState, useEffect, useRef, useCallback } from 'react';

// Components
import { FieldInputEditor, EffectSelector, EmojiSelector, RecipeEditor } from './components/admin';

// Config
import { TOOLBAR_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT } from './config/constants';
import { submitScore, fetchLeaderboard, createRecipe, updateRecipe, fetchWaves } from './services/api';

import { createWaveEnemies, canPlaceTower, createTower, prepareWaveStart, calculateCurrentPath } from './services/gameLogic';
import { getEnemyPosition, findTowerTarget, createProjectile } from './services/combatSystem';
import { gridToIso } from './renderers/canvasUtils';
import { soundManager } from './services/soundManager';
import { generateSynthSounds } from './services/soundGenerator';
import { simpleSounds } from './services/simpleSounds';

// Utiliser simpleSounds au lieu de soundManager (plus simple et fonctionne mieux)
const sound = simpleSounds;

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
import { useFusion } from './hooks/useFusion';


// Renderers
import {  clearCanvas, createGrassCache, drawGrassBackground, drawIsoGrid,
  getToolbarButtons, drawToolbar,
  drawMainMenu,
  drawAdminPage,
  drawPath, drawSpawnPortal, drawGoal, drawCheckpoints,
  drawTowers, drawTempTowers, drawEnemies, drawProjectiles, drawPlacementPreview, drawTowerHighlights,
  drawErrorOverlay, drawGameOverOverlay, getGameOverButtons, drawTowerTooltip, drawToolbarTooltip, drawEnemyTooltip,
  drawContextMenu

} from './renderers';

const TowerDefense = () => {
  const canvasRef = useRef(null);

  // Custom hooks
  const { pseudo, bestScore, lastScore, updatePseudo, saveScore } = useLocalStorage();
  const { logoImage, grassImage, portailImage, arriveeImage, gemholderImage, checkpointImages, gemImages, grassCanvasRef, loadGemImages } = useImages();
  const { camera, setCamera, isDragging, setIsDragging, dragStart, setDragStart, getZoom, clampCamera, zoomIn, zoomOut, resetCamera } = useCamera();
  const { hoveredTower, setHoveredTower, hoveredCell, setHoveredCell, hoveredButton, setHoveredButton, hoveredMenuButton, setHoveredMenuButton, hoveredEnemy, setHoveredEnemy, hoveredVolumeSlider, setHoveredVolumeSlider, mousePos, setMousePos, contextMenu, setContextMenu, musicVolume, setMusicVolume, sfxVolume, setSfxVolume } = useUI();
  const { enemies, setEnemies, projectiles, setProjectiles } = useEnemies();
  const { towers, setTowers, tempTowers, setTempTowers, selectedTowerToDelete, setSelectedTowerToDelete, selectedTempTower, setSelectedTempTower, deleteTower, clearTempTowers } = useTowers();
  const { adminPage, setAdminPage, editingGem, setEditingGem, editingEnemy, setEditingEnemy, adminMessage, setAdminMessage, editingRecipe, setEditingRecipe, showColorPicker, setShowColorPicker, colorPickerPosition, setColorPickerPosition, showEffectSelector, setShowEffectSelector, showEmojiSelector, setShowEmojiSelector, showRecipeEditor, setShowRecipeEditor, editingField, setEditingField, fieldInputValue, setFieldInputValue, fieldInputPosition, setFieldInputPosition } = useAdmin();
  const { gameState, setGameState, lives, setLives, wave, setWave, score, setScore, placementCount, setPlacementCount, gameSpeed, setGameSpeed, errorMessage, setErrorMessage, resetGame, goToMenu } = useGameState();
  const { handleColorChange, handleEffectToggle, handleEmojiClick } = useAdminHandlers({ setEditingGem, setEditingEnemy, setShowColorPicker, setShowEmojiSelector });
  const { gemTypes, setGemTypes, fusionRecipes, setFusionRecipes, enemyTypes, setEnemyTypes, leaderboard, setLeaderboard } = useGameData();
  const { checkFusionPossible, performFusion } = useFusion({ towers, setTowers, fusionRecipes, gemTypes });

  // Other state
  const [currentPath, setCurrentPath] = useState(null);
  const [previousWaveHealth, setPreviousWaveHealth] = useState(0);
  const [wavesData, setWavesData] = useState(null);

  // Refs
  const enemyIdCounter = useRef(0);
  const colorPickerRef = useRef(null);
  const scoreSubmittedRef = useRef(false);

  // Initialiser le système audio
  useEffect(() => {
    console.log('🎵 Initialisation du système audio (simpleSounds)...');
    simpleSounds.init();
    console.log('✅ Système audio initialisé');
  }, []);

  // Spawn wave
  const spawnWave = useCallback(() => {
    const waveData = wavesData ? wavesData[wave] : null;
    console.log('Spawn wave:', wave, 'waveData:', waveData);
    const { enemies: newEnemies, newPreviousWaveHealth } = createWaveEnemies(wave, gemTypes, previousWaveHealth, enemyIdCounter, waveData);
    setPreviousWaveHealth(newPreviousWaveHealth);
    setEnemies(newEnemies);
    setGameState('wave');
  }, [wave, gemTypes, previousWaveHealth, wavesData]);

  // Start wave
  const startWave = () => {
    if (gameState !== 'preparation') return;
    const { allTowers, path } = prepareWaveStart(towers, tempTowers, selectedTempTower, gemTypes);
    if (!path) {
      setErrorMessage("Chemin bloque !");
      simpleSounds.error();
      return;
    }
    setTowers(allTowers);
    setCurrentPath(path);
    setTempTowers([]);
    setSelectedTempTower(null);
    setPlacementCount(0);
    setContextMenu(null);
    simpleSounds.waveStart();
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
    simpleSounds.placeTower();
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
  // Recipe save handler
  const handleRecipeSave = () => {
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

    const isNewRecipe = !editingRecipe.id;
    const apiCall = isNewRecipe ? createRecipe(recipeData) : updateRecipe(editingRecipe.id, recipeData);

    apiCall
      .then(savedRecipe => {
        if (isNewRecipe) {
          setFusionRecipes(prev => [...prev, savedRecipe]);
          setAdminMessage({ type: 'success', text: 'Recette ajoutée en BDD !' });
        } else {
          setFusionRecipes(prev => prev.map(r => r.id === editingRecipe.id ? savedRecipe : r));
          setAdminMessage({ type: 'success', text: 'Recette modifiée en BDD !' });
        }
        setTimeout(() => setAdminMessage(null), 3000);
        setShowRecipeEditor(false);
        setEditingRecipe(null);
      })
      .catch(err => {
        setAdminMessage({ type: 'error', text: `Erreur: ${err.message}` });
        setTimeout(() => setAdminMessage(null), 3000);
      });
  };

  useGameLoop({
    gameState, gameSpeed, towers, tempTowers, enemies, currentPath,
    setEnemies, setProjectiles, setLives, setScore
  });

  // Migration des tours existantes vers les coordonnées isométriques (au montage uniquement)
  useEffect(() => {
    // Migrer les tours permanentes
    setTowers(prevTowers =>
      prevTowers.map(tower => {
        // Si la tour a déjà été migrée, ne pas la re-migrer
        // On peut détecter ça en vérifiant si x/y correspondent déjà aux coordonnées iso
        const { isoX, isoY } = gridToIso(tower.gridX + 0.5, tower.gridY + 0.5);

        // Si les coordonnées correspondent déjà (avec une marge d'erreur de 1 pixel), pas besoin de migrer
        if (Math.abs(tower.x - isoX) < 1 && Math.abs(tower.y - isoY) < 1) {
          return tower;
        }

        return { ...tower, x: isoX, y: isoY };
      })
    );

    // Migrer les tours temporaires
    setTempTowers(prevTempTowers =>
      prevTempTowers.map(tower => {
        const { isoX, isoY } = gridToIso(tower.gridX + 0.5, tower.gridY + 0.5);

        if (Math.abs(tower.x - isoX) < 1 && Math.abs(tower.y - isoY) < 1) {
          return tower;
        }

        return { ...tower, x: isoX, y: isoY };
      })
    );
  }, []); // Exécuté une seule fois au montage

  // Invalider le cache de l'herbe pour forcer la régénération (au montage uniquement)
  useEffect(() => {
    grassCanvasRef.current = null;
  }, []);

  // Calculer le chemin en temps réel pendant le placement des gemmes
  useEffect(() => {
    if (gameState === 'preparation') {
      const path = calculateCurrentPath(towers, tempTowers);
      setCurrentPath(path);
    }
  }, [gameState, towers, tempTowers]);

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

  // Charger les images des gemmes quand gemTypes change
  useEffect(() => {
    if (gemTypes && Object.keys(gemTypes).length > 0) {
      loadGemImages(gemTypes);
    }
  }, [gemTypes, loadGemImages]);

  // Charger les vagues depuis l'API au démarrage
  useEffect(() => {
    fetchWaves()
      .then(waves => {
        console.log('Vagues chargées:', waves);
        setWavesData(waves);
      })
      .catch(err => {
        console.error('Erreur lors du chargement des vagues:', err);
        setWavesData(null); // Utiliser le fallback aléatoire
      });
  }, []);

  // Effacer le message d'erreur quand les tours changent (chemin débloqué)
  useEffect(() => {
    if (gameState === 'preparation' && errorMessage) {
      // Recalculer le chemin pour vérifier s'il est toujours bloqué
      const { path } = prepareWaveStart(towers, tempTowers, selectedTempTower, gemTypes);
      if (path) {
        // Le chemin est débloqué, effacer le message
        setErrorMessage(null);
      }
    }
  }, [towers, tempTowers, gameState, errorMessage, selectedTempTower, gemTypes]);

  // Canvas handlers (extracted to hooks)
  const { handleCanvasClick } = useCanvasHandlers({
    canvasRef, getZoom, camera, gameState, contextMenu, adminPage, pseudo, gemTypes, editingGem, fusionRecipes, enemyTypes, editingEnemy, editingField,
    lives, wave, score, placementCount, gameSpeed, tempTowers, selectedTempTower, selectedTowerToDelete, towers,
    enemies, editingRecipe, setContextMenu, setAdminPage, updatePseudo, setEditingGem, setGemTypes, setAdminMessage,
    setFusionRecipes, setEnemyTypes, setEditingEnemy, setTempTowers, setPlacementCount, setSelectedTempTower, setTowers, setSelectedTowerToDelete,
    setColorPickerPosition, setShowColorPicker, setShowEffectSelector, setShowEmojiSelector, setFieldInputPosition,
    setFieldInputValue, setEditingField, colorPickerRef, setShowRecipeEditor, setEditingRecipe, setGameState, setMusicVolume, setSfxVolume,
    checkFusionPossible, performFusion, startWave, startNewGame, goToMenuFull, setGameSpeed, zoomIn, zoomOut,
    resetCamera, deleteTower, resetGameFull, placeTower
  });

  const { handleCanvasMouseMove, handleMouseDown, handleMouseUp } = useMouseHandlers({
    canvasRef, getZoom, camera, isDragging, dragStart, gameState, contextMenu, adminPage, pseudo, gemTypes,
    editingGem, fusionRecipes, enemyTypes, editingEnemy, editingField, lives, wave, score, placementCount, gameSpeed, tempTowers, selectedTempTower,
    selectedTowerToDelete, towers, enemies, currentPath, setMousePos, setCamera, clampCamera, setHoveredButton,
    setHoveredMenuButton, setHoveredCell, setHoveredTower, setHoveredEnemy, setIsDragging, setDragStart, setHoveredVolumeSlider, checkFusionPossible,
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

    // Menu
    if (gameState === 'menu' && !adminPage) {
      drawMainMenu(ctx, { logoImage, hoveredMenuButton, pseudo, bestScore, lastScore, leaderboard, musicVolume, sfxVolume, hoveredVolumeSlider });
      return;
    }

    // Admin
    if (adminPage) {
      drawAdminPage(ctx, adminPage, {
        gemTypes, fusionRecipes, enemyTypes, hoveredMenuButton, editingGem, editingEnemy, adminMessage, editingField
      });
      return;
    }

    // Toolbar (sans transformation)
    const toolbarButtons = getToolbarButtons({
      gameState, lives, wave, score, placementCount, camera, gameSpeed,
      tempTowers, selectedTempTower, selectedTowerToDelete, towers, enemies,
      goToMenu: goToMenuFull, setGameState, setGameSpeed, zoomIn, zoomOut, resetCamera,
      setSelectedTempTower, deleteTower, startWave, resetGame: resetGameFull
    });

    if (!isMenuOrAdmin) {
      drawToolbar(ctx, toolbarButtons, hoveredButton);
    }

    // Game world (avec zoom et transformation de caméra)
    ctx.save();

    // Définir une zone de clipping pour ne pas déborder sur la toolbar
    ctx.beginPath();
    ctx.rect(0, TOOLBAR_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - TOOLBAR_HEIGHT);
    ctx.clip();

    ctx.translate(camera.x, camera.y + TOOLBAR_HEIGHT);
    ctx.scale(zoom, zoom);

    // Grass background (AVEC transformation pour suivre le jeu)
    createGrassCache(grassImage, grassCanvasRef);
    drawGrassBackground(ctx, grassCanvasRef);

    // Dessiner la grille isométrique
    drawIsoGrid(ctx);


    drawPath(ctx, currentPath, zoom);
    drawSpawnPortal(ctx, portailImage, zoom);
    drawGoal(ctx, arriveeImage, zoom);

    // Dessiner avec tri en profondeur (z-ordering) pour l'effet 3D isométrique
    // 1. D'abord les tours/gemmes derrière les checkpoints
    drawTowers(ctx, towers, { hoveredTower, selectedTowerToDelete, gameState, checkFusionPossible, zoom, gemImages, checkpoints: true, behind: true });
    drawTempTowers(ctx, tempTowers, { hoveredTower, selectedTempTower, zoom, gemImages, checkpoints: true, behind: true });

    // 2. Ensuite les checkpoints
    drawCheckpoints(ctx, checkpointImages, zoom);

    // 3. Puis les tours/gemmes devant les checkpoints
    drawTowers(ctx, towers, { hoveredTower, selectedTowerToDelete, gameState, checkFusionPossible, zoom, gemImages, checkpoints: true, behind: false });
    drawTempTowers(ctx, tempTowers, { hoveredTower, selectedTempTower, zoom, gemImages, checkpoints: true, behind: false });

    drawEnemies(ctx, enemies, currentPath, zoom, gemTypes);
    drawPlacementPreview(ctx, hoveredCell, { gameState, placementCount, towers, tempTowers, gemholderImage });
    drawProjectiles(ctx, projectiles);

    // Dessiner les surbrillances des gemmes derrière les checkpoints (au-dessus de tout)
    drawTowerHighlights(ctx, towers, tempTowers);

    ctx.restore();

    // Overlays
    if (errorMessage) drawErrorOverlay(ctx, errorMessage);
    if (gameState === 'gameOver') drawGameOverOverlay(ctx, score, wave, hoveredButton);

    if (hoveredTower && !contextMenu) {
      drawTowerTooltip(ctx, { hoveredTower, towers, tempTowers, mousePos, gemTypes, fusionRecipes });
    }
    if (hoveredEnemy && !contextMenu) {
      drawEnemyTooltip(ctx, { hoveredEnemy, mousePos, gemTypes });
    }
    if (hoveredButton) {
      drawToolbarTooltip(ctx, { hoveredButton, mousePos, toolbarButtons });
    }
    if (contextMenu && gameState === 'preparation') {
      drawContextMenu(ctx, contextMenu, { checkFusionPossible, hoveredButton });
    }
  }, [
    gameState, lives, wave, score, placementCount, towers, tempTowers, enemies, projectiles,
    currentPath, camera, hoveredTower, hoveredCell, hoveredButton, hoveredMenuButton, hoveredEnemy,
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

        {/* Field Input Editor */}        <FieldInputEditor
          editingField={editingField}
          fieldInputValue={fieldInputValue}
          fieldInputPosition={fieldInputPosition}
          onValueChange={setFieldInputValue}
          onSave={() => {
            // Cas spécial pour le pseudo du menu
            if (editingField === 'pseudo') {
              updatePseudo(fieldInputValue);
              setEditingField(null);
              return;
            }

            // Déterminer si c'est un nombre ou une chaîne
            const isNumericField = ['damage', 'speed', 'range', 'hp', 'global_resistance'].includes(editingField);
            let parsedValue = isNumericField
              ? (['speed', 'global_resistance'].includes(editingField) ? parseFloat(fieldInputValue) : parseInt(fieldInputValue)) || 0
              : fieldInputValue;

            // Convertir la résistance globale de % vers décimal
            if (editingField === 'global_resistance') {
              parsedValue = parsedValue / 100;
            }

            // Mettre à jour le bon objet (gem ou enemy)
            if (adminPage === 'edit-enemy') {
              setEditingEnemy(prev => ({ ...prev, [editingField]: parsedValue }));
            } else {
              setEditingGem(prev => ({ ...prev, [editingField]: parsedValue }));
            }
            setEditingField(null);
          }}
          onCancel={() => setEditingField(null)}
        />


        {/* Effect Selector - Multi-sélection */}        <EffectSelector
          editingGem={editingGem}
          showEffectSelector={showEffectSelector}
          onEffectToggle={handleEffectToggle}
          onClose={() => setShowEffectSelector(false)}
        />

        {/* Emoji Picker */}
        <EmojiSelector
          showEmojiSelector={showEmojiSelector}
          onEmojiClick={(emojiData) => handleEmojiClick(emojiData, adminPage === 'edit-enemy')}
          onClose={() => setShowEmojiSelector(false)}
        />

        {/* Recipe Editor */}
        <RecipeEditor
          showRecipeEditor={showRecipeEditor}
          editingRecipe={editingRecipe}
          gemTypes={gemTypes}
          setEditingRecipe={setEditingRecipe}
          onSave={handleRecipeSave}
          onCancel={() => {
            setShowRecipeEditor(false);
            setEditingRecipe(null);
          }}
        />


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