import React, { useState, useEffect, useRef, useCallback } from 'react';

// Components
import { FieldInputEditor, EffectSelector, EmojiSelector } from './components/admin';

// Config
import {
  GRID_SIZE, COLS, ROWS, TOOLBAR_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT,
  DEFAULT_GEM_TYPES, isInSpawnZone, isInGoalZone, isInCheckpointZone
} from './config/constants';
import { fetchGems, fetchRecipes, createGem, updateGem, deleteGem, createRecipe, updateRecipe, deleteRecipe, fetchLeaderboard, submitScore } from './services/api';
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

// Renderers
import {
  clearCanvas, createGrassCache, drawGrassBackground,
  getToolbarButtons, drawToolbar,
  drawMainMenu, getMenuButtons,
  drawAdminPage, getAdminButtons,
  drawPath, drawSpawnPortal, drawGoal, drawCheckpoints,
  drawTowers, drawTempTowers, drawEnemies, drawProjectiles, drawPlacementPreview,
  drawErrorOverlay, drawGameOverOverlay, drawTowerTooltip, drawToolbarTooltip,
  drawContextMenu, getContextMenuButtons
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

  // Other state
  const [currentPath, setCurrentPath] = useState(null);
  const [previousWaveHealth, setPreviousWaveHealth] = useState(0);
  const [gemTypes, setGemTypes] = useState(DEFAULT_GEM_TYPES);
  const [fusionRecipes, setFusionRecipes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  // Refs
  const gameLoopRef = useRef();
  const lastTimeRef = useRef(null);
  const towerAttackTimers = useRef({});
  const enemyIdCounter = useRef(0);
  const colorPickerRef = useRef(null);
  const scoreSubmittedRef = useRef(false);

  // Charger les donnees depuis l'API
  useEffect(() => {
    fetchGems().then(gems => setGemTypes(gems)).catch(() => {});
    fetchRecipes().then(recipes => setFusionRecipes(recipes)).catch(() => {});
    fetchLeaderboard().then(scores => setLeaderboard(scores)).catch(() => {});
  }, []);

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
    scoreSubmittedRef.current = false; // Réinitialiser le flag pour permettre la soumission de la prochaine partie
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'wave') {
      lastTimeRef.current = null;
      return;
    }

    const gameLoop = () => {
      const now = Date.now();
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      const adjustedDeltaTime = deltaTime * gameSpeed;

      // Update enemies
      setEnemies(prev => {
        return prev.map(enemy => {
          if (enemy.health <= 0 || !currentPath) return null;

          let newPathIndex = enemy.pathIndex;
          if (enemy.effects.stun > 0) {
            enemy.effects.stun -= adjustedDeltaTime;
          } else {
            let movement = enemy.speed * adjustedDeltaTime;
            if (enemy.effects.slow > 0) {
              movement = (enemy.speed * 0.5) * adjustedDeltaTime;
              enemy.effects.slow -= adjustedDeltaTime;
            }
            newPathIndex = enemy.pathIndex + movement;
          }

          if (enemy.effects.poison > 0) {
            enemy.health -= 3 * adjustedDeltaTime;
            enemy.effects.poison -= adjustedDeltaTime;
          }

          if (newPathIndex >= currentPath.length) {
            setLives(l => Math.max(0, l - 1));
            return null;
          }

          return { ...enemy, pathIndex: newPathIndex };
        }).filter(Boolean);
      });

      // Update projectiles
      setProjectiles(prev => {
        const damageToApply = [];
        const updatedProjectiles = prev.map(proj => {
          const targetEnemy = enemies.find(e => e.id === proj.targetId);
          if (!targetEnemy) return null;

          const enemyPos = getEnemyPosition(targetEnemy, currentPath);
          if (!enemyPos) return null;

          const dx = enemyPos.x - proj.x;
          const dy = enemyPos.y - proj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 15) {
            damageToApply.push({
              enemyId: proj.targetId, damage: proj.damage,
              effect: proj.effect, towerType: proj.towerType
            });
            return null;
          }

          const speed = 250;
          const moveX = (dx / dist) * speed * adjustedDeltaTime;
          const moveY = (dy / dist) * speed * adjustedDeltaTime;
          return { ...proj, x: proj.x + moveX, y: proj.y + moveY };
        }).filter(Boolean);

        if (damageToApply.length > 0) {
          setEnemies(currentEnemies => {
            return currentEnemies.map(e => {
              const damage = damageToApply.find(d => d.enemyId === e.id);
              if (damage) {
                const isResistant = e.resistances && e.resistances.includes(damage.towerType);
                const actualDamage = isResistant ? damage.damage * 0.5 : damage.damage;
                const newHealth = e.health - actualDamage;

                const effects = damage.effect.split(',');
                effects.forEach(eff => {
                  if (eff === 'slow') e.effects.slow = 2;
                  else if (eff === 'poison') e.effects.poison = 3;
                  else if (eff === 'stun') e.effects.stun = 1;
                });

                if (newHealth <= 0) {
                  setScore(s => s + e.reward * 10);
                  return null;
                }
                return { ...e, health: newHealth };
              }
              return e;
            }).filter(Boolean);
          });
        }

        return updatedProjectiles;
      });

      // Tower firing
      [...towers, ...tempTowers].forEach(tower => {
        if (tower.damage === 0) return;
        const timerId = `${tower.id}`;
        if (!towerAttackTimers.current[timerId]) towerAttackTimers.current[timerId] = 0;
        towerAttackTimers.current[timerId] += adjustedDeltaTime * 1000;

        if (towerAttackTimers.current[timerId] >= tower.speed) {
          towerAttackTimers.current[timerId] = 0;
          const closestEnemy = findTowerTarget(tower, enemies, currentPath);
          if (closestEnemy) {
            setProjectiles(prev => [...prev, createProjectile(tower, closestEnemy)]);
          }
        }
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [gameState, towers, tempTowers, enemies, currentPath, gameSpeed]);

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

  // Click handler
  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const zoom = getZoom();

    // Context menu click
    if (contextMenu) {
      const cmButtons = getContextMenuButtons(contextMenu, checkFusionPossible);
      for (const btn of cmButtons) {
        if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
          if (btn.action === 'fusion' && btn.fusionInfo) {
            performFusion(contextMenu.tower, btn.fusionInfo);
            setContextMenu(null);
            setSelectedTowerToDelete(null);
            setSelectedTempTower(null);
            return;
          } else if (btn.action === 'start') {
            startWave();
          } else if (btn.action === 'delete') {
            if (contextMenu.isTemp) {
              setTempTowers(prev => prev.filter(t => t.id !== contextMenu.tower.id));
              setPlacementCount(prev => Math.max(0, prev - 1));
              setSelectedTempTower(null);
            } else {
              setTowers(prev => prev.filter(t => t.id !== contextMenu.tower.id));
              setSelectedTowerToDelete(null);
            }
          }
          setContextMenu(null);
          return;
        }
      }

      // Clic en dehors du menu - vérifier si on clique sur une autre tourelle
      if (gameState === 'preparation') {
        const worldX = (x - camera.x) / zoom;
        const worldY = (y - TOOLBAR_HEIGHT - camera.y) / zoom;
        const gridX = Math.floor(worldX / GRID_SIZE);
        const gridY = Math.floor(worldY / GRID_SIZE);

        const clickedTower = towers.find(t => t.gridX === gridX && t.gridY === gridY);
        const clickedTempTower = tempTowers.find(t => t.gridX === gridX && t.gridY === gridY);

        if (clickedTower && clickedTower.id !== contextMenu.tower?.id) {
          setSelectedTowerToDelete(clickedTower.id);
          setSelectedTempTower(null);
          setContextMenu({ tower: clickedTower, x, y, isTemp: false });
          return;
        }

        if (clickedTempTower && clickedTempTower.id !== contextMenu.tower?.id) {
          setSelectedTempTower(clickedTempTower.id);
          setSelectedTowerToDelete(null);
          setContextMenu({ tower: clickedTempTower, x, y, isTemp: true });
          return;
        }
      }

      setContextMenu(null);
      setSelectedTowerToDelete(null);
      setSelectedTempTower(null);
      return;
    }

    // Menu clicks
    if (gameState === 'menu' && !adminPage) {
      const centerX = CANVAS_WIDTH / 2;
      const centerY = CANVAS_HEIGHT / 2;
      const menuButtons = getMenuButtons(centerX, centerY, pseudo);
      for (const btn of menuButtons) {
        if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
          if (btn.id === 'new-game') startNewGame();
          else if (btn.id === 'pseudo') {
            const newPseudo = prompt('Entrez votre pseudo:', pseudo);
            if (newPseudo) updatePseudo(newPseudo);
          }
          else if (btn.id === 'admin') setAdminPage('home');
          return;
        }
      }
      return;
    }

    // Admin clicks
    if (adminPage) {
      const adminButtons = getAdminButtons(adminPage, gemTypes, editingGem, fusionRecipes);
      for (const btn of adminButtons) {
        if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
          if (btn.action === 'back') {
            if (adminPage === 'edit-gem') setAdminPage('gems');
            else if (adminPage === 'recipes') setAdminPage('home');
            else setAdminPage(null);
            setEditingGem(null);
          }
          else if (btn.action === 'gems') setAdminPage('gems');
          else if (btn.action === 'recipes') setAdminPage('recipes');
          else if (btn.action === 'create-gem') {
            // Créer une nouvelle gemme avec valeurs par défaut
            setEditingGem({
              id: '',
              name: 'Nouvelle Gemme',
              color: '#888888',
              damage: 10,
              speed: 1000,
              range: 100,
              effect: 'none',
              icon: '💎',
              is_droppable: true,
              is_base: false
            });
            setAdminPage('edit-gem');
          }
          else if (btn.action === 'edit-gem') {
            setEditingGem({ ...gemTypes[btn.gemId], id: btn.gemId });
            setAdminPage('edit-gem');
          }
          else if (btn.action === 'edit-field' && editingGem) {
            // Champs booléens - toggle direct
            if (btn.fieldKey === 'is_droppable' || btn.fieldKey === 'is_base') {
              setEditingGem(prev => ({ ...prev, [btn.fieldKey]: !prev[btn.fieldKey] }));
              return;
            }

            // Couleur - ouvrir le color picker
            if (btn.fieldKey === 'color') {
              const rect = canvasRef.current.getBoundingClientRect();
              setColorPickerPosition({ x: btn.x + rect.left, y: btn.y + rect.top });
              setShowColorPicker(true);
              setTimeout(() => {
                if (colorPickerRef.current) {
                  colorPickerRef.current.click();
                }
              }, 0);
              return;
            }

            // Effet - ouvrir le sélecteur d'effets
            if (btn.fieldKey === 'effect') {
              setShowEffectSelector(prev => !prev);
              return;
            }

            // Icône - ouvrir le sélecteur d'emojis
            if (btn.fieldKey === 'icon') {
              setShowEmojiSelector(prev => !prev);
              return;
            }

            // Champs texte et numériques - ouvrir l'input
            const rect = canvasRef.current.getBoundingClientRect();
            setFieldInputPosition({ x: btn.x + rect.left, y: btn.y + rect.top });
            setFieldInputValue(String(editingGem[btn.fieldKey]));
            setEditingField(btn.fieldKey);
          }
          else if (btn.action === 'delete-gem' && editingGem) {
            // Supprimer une gemme existante
            if (confirm(`Supprimer définitivement la gemme "${editingGem.name}" ?`)) {
              deleteGem(editingGem.id)
                .then(() => {
                  // Retirer localement après succès API
                  setGemTypes(prev => {
                    const newGems = { ...prev };
                    delete newGems[editingGem.id];
                    return newGems;
                  });
                  setAdminMessage({ type: 'success', text: `Gemme "${editingGem.name}" supprimée !` });
                  setTimeout(() => setAdminMessage(null), 3000);
                  setAdminPage('gems');
                  setEditingGem(null);
                })
                .catch(err => {
                  setAdminMessage({ type: 'error', text: `Erreur: ${err.message}` });
                  setTimeout(() => setAdminMessage(null), 3000);
                });
            }
          }
          else if (btn.action === 'save' && editingGem) {
            // Vérifier que l'ID est renseigné
            if (!editingGem.id || editingGem.id.trim() === '') {
              setAdminMessage({ type: 'error', text: 'L\'ID est obligatoire !' });
              setTimeout(() => setAdminMessage(null), 3000);
              return;
            }

            const gemData = {
              id: editingGem.id.toUpperCase().trim(),
              name: editingGem.name,
              color: editingGem.color,
              damage: editingGem.damage,
              speed: editingGem.speed,
              range: editingGem.range,
              effect: editingGem.effect,
              icon: editingGem.icon,
              is_droppable: editingGem.is_droppable ?? true,
              is_base: editingGem.is_base ?? false
            };

            // Vérifier si c'est une création (pas d'ID dans gemTypes) ou une modification
            const isNewGem = !gemTypes[editingGem.id];
            const apiCall = isNewGem ? createGem(gemData) : updateGem(editingGem.id, gemData);

            apiCall
              .then(() => {
                // Mettre à jour localement après succès API
                setGemTypes(prev => ({ ...prev, [gemData.id]: gemData }));
                setAdminMessage({
                  type: 'success',
                  text: `Gemme "${editingGem.name}" ${isNewGem ? 'creee' : 'sauvegardee'} en BDD !`
                });
                setTimeout(() => setAdminMessage(null), 3000);
                setAdminPage('gems');
                setEditingGem(null);
              })
              .catch(err => {
                setAdminMessage({ type: 'error', text: `Erreur: ${err.message}` });
                setTimeout(() => setAdminMessage(null), 3000);
              });
          }
          else if (btn.action === 'add-recipe') {
            // Ouvrir l'éditeur visuel de recette
            setEditingRecipe({
              required_gems: [],
              result_gem_id: '',
              min_count: 3
            });
            setShowRecipeEditor(true);
          }
          else if (btn.action === 'edit-recipe') {
            // Ouvrir l'éditeur avec les données de la recette existante
            const recipe = btn.recipe;
            setEditingRecipe({
              id: recipe.id,
              required_gems: recipe.required_gems.split(',').map(g => g.trim()),
              result_gem_id: recipe.result_gem_id,
              min_count: recipe.min_count || 3
            });
            setShowRecipeEditor(true);
          }
          else if (btn.action === 'save-recipe' && editingRecipe) {
            // Sauvegarder la recette (création ou modification)
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

            // Vérifier si c'est une création ou une modification
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
          }
          else if (btn.action === 'toggle-ingredient') {
            // Toggle un ingrédient dans la recette
            setEditingRecipe(prev => {
              const ingredients = [...prev.required_gems];
              const index = ingredients.indexOf(btn.gemId);
              if (index >= 0) {
                ingredients.splice(index, 1);
              } else {
                ingredients.push(btn.gemId);
              }
              return { ...prev, required_gems: ingredients };
            });
          }
          else if (btn.action === 'select-result') {
            // Sélectionner la gemme résultat
            setEditingRecipe(prev => ({ ...prev, result_gem_id: btn.gemId }));
          }
          else if (btn.action === 'delete-recipe') {
            const recipe = fusionRecipes[btn.recipeIndex];
            if (confirm(`Supprimer la recette ${recipe.required_gems} -> ${recipe.result_gem_id} ?`)) {
              deleteRecipe(recipe.id)
                .then(() => {
                  setFusionRecipes(prev => prev.filter((_, i) => i !== btn.recipeIndex));
                  setAdminMessage({ type: 'success', text: 'Recette supprimee de la BDD !' });
                  setTimeout(() => setAdminMessage(null), 3000);
                })
                .catch(err => {
                  setAdminMessage({ type: 'error', text: `Erreur: ${err.message}` });
                  setTimeout(() => setAdminMessage(null), 3000);
                });
            }
          }
          return;
        }
      }
      return;
    }

    // Toolbar clicks
    if (y <= TOOLBAR_HEIGHT) {
      const toolbarButtons = getToolbarButtons({
        gameState, lives, wave, score, placementCount, camera, gameSpeed,
        tempTowers, selectedTempTower, selectedTowerToDelete, towers, enemies,
        goToMenu: goToMenuFull, setGameState, setGameSpeed, zoomIn, zoomOut, resetCamera,
        setSelectedTempTower, deleteTower, startWave, resetGame: resetGameFull
      });
      for (const btn of toolbarButtons) {
        if (x >= btn.x && x <= btn.x + btn.width && !btn.disabled && btn.action) {
          btn.action();
          return;
        }
      }
      return;
    }

    // Game world clicks
    if (gameState === 'preparation') {
      const worldX = (x - camera.x) / zoom;
      const worldY = (y - TOOLBAR_HEIGHT - camera.y) / zoom;
      const gridX = Math.floor(worldX / GRID_SIZE);
      const gridY = Math.floor(worldY / GRID_SIZE);

      // Check tower click (right-click for context menu)
      const clickedTower = towers.find(t => t.gridX === gridX && t.gridY === gridY);
      const clickedTempTower = tempTowers.find(t => t.gridX === gridX && t.gridY === gridY);

      if (clickedTower) {
        setSelectedTowerToDelete(clickedTower.id);
        setSelectedTempTower(null);
        setContextMenu({ tower: clickedTower, x, y, isTemp: false });
        return;
      }

      if (clickedTempTower) {
        setSelectedTempTower(clickedTempTower.id);
        setSelectedTowerToDelete(null);
        setContextMenu({ tower: clickedTempTower, x, y, isTemp: true });
        return;
      }

      // Click on empty cell - deselect and place new tower
      setSelectedTowerToDelete(null);
      placeTower(gridX, gridY);
    }
  };

  // Mouse move handler
  const handleCanvasMouseMove = (e) => {
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
  };

  // Mouse down/up for dragging
  const handleMouseDown = (e) => {
    if (e.button === 1 || e.button === 2) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - camera.x, y: e.clientY - camera.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

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
