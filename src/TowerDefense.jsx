import React, { useState, useEffect, useRef, useCallback } from 'react';

// Config
import {
  GRID_SIZE, COLS, ROWS, TOOLBAR_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT,
  DEFAULT_GEM_TYPES, isInSpawnZone, isInGoalZone, isInCheckpointZone
} from './config/constants';
import { fetchGems, fetchRecipes, updateGem, createRecipe, deleteRecipe } from './services/api';
import { createWaveEnemies, canPlaceTower, createTower, prepareWaveStart } from './services/gameLogic';
import { getEnemyPosition, findTowerTarget, createProjectile } from './services/combatSystem';

// Hooks
import { useLocalStorage } from './hooks/useLocalStorage';
import { useImages } from './hooks/useImages';
import { useCamera } from './hooks/useCamera';

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

  // Game state
  const [gameState, setGameState] = useState('menu');
  const [lives, setLives] = useState(20);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [towers, setTowers] = useState([]);
  const [tempTowers, setTempTowers] = useState([]);
  const [placementCount, setPlacementCount] = useState(0);
  const [selectedTempTower, setSelectedTempTower] = useState(null);
  const [enemies, setEnemies] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);
  const [hoveredTower, setHoveredTower] = useState(null);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [selectedTowerToDelete, setSelectedTowerToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [previousWaveHealth, setPreviousWaveHealth] = useState(0);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredMenuButton, setHoveredMenuButton] = useState(null);
  const [gemTypes, setGemTypes] = useState(DEFAULT_GEM_TYPES);
  const [contextMenu, setContextMenu] = useState(null);
  const [fusionRecipes, setFusionRecipes] = useState([]);
  const [adminPage, setAdminPage] = useState(null);
  const [editingGem, setEditingGem] = useState(null);
  const [adminMessage, setAdminMessage] = useState(null);

  // Refs
  const gameLoopRef = useRef();
  const lastTimeRef = useRef(null);
  const towerAttackTimers = useRef({});
  const enemyIdCounter = useRef(0);

  // Charger les donnees depuis l'API
  useEffect(() => {
    fetchGems().then(gems => setGemTypes(gems)).catch(() => {});
    fetchRecipes().then(recipes => setFusionRecipes(recipes)).catch(() => {});
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

  // Delete tower
  const deleteTower = () => {
    if (!selectedTowerToDelete) return;
    setTowers(prev => prev.filter(t => t.id !== selectedTowerToDelete));
    setSelectedTowerToDelete(null);
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
  const resetGame = () => {
    setGameState('preparation');
    setLives(20);
    setWave(1);
    setScore(0);
    setTowers([]);
    setTempTowers([]);
    setPlacementCount(0);
    setEnemies([]);
    setProjectiles([]);
    setCurrentPath(null);
    setSelectedTempTower(null);
    setSelectedTowerToDelete(null);
    setContextMenu(null);
    setErrorMessage(null);
    resetCamera();
  };

  // Go to menu
  const goToMenu = () => {
    if (score > 0) saveScore(score);
    setGameState('menu');
    setAdminPage(null);
  };

  // Start new game
  const startNewGame = () => {
    resetGame();
    setGameState('preparation');
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
    if (lives <= 0) {
      setGameState('gameOver');
      saveScore(score);
    }
  }, [lives, score, saveScore]);

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
      goToMenu, setGameState, setGameSpeed, zoomIn, zoomOut, resetCamera,
      setSelectedTempTower, deleteTower, startWave, resetGame
    });

    if (!isMenuOrAdmin) {
      drawToolbar(ctx, toolbarButtons, hoveredButton);
    }

    // Menu
    if (gameState === 'menu' && !adminPage) {
      drawMainMenu(ctx, { logoImage, hoveredMenuButton, pseudo, bestScore, lastScore });
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
    pseudo, bestScore, lastScore, getZoom, checkFusionPossible
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

            const fieldLabels = {
              name: 'Nom', color: 'Couleur (ex: #ef4444)', damage: 'Degats',
              speed: 'Vitesse (ms)', range: 'Portee', effect: 'Effet', icon: 'Icone (emoji)'
            };
            const currentValue = editingGem[btn.fieldKey];
            const newValue = prompt(`${fieldLabels[btn.fieldKey]}:`, String(currentValue));
            if (newValue !== null) {
              const parsedValue = ['damage', 'speed', 'range'].includes(btn.fieldKey)
                ? parseInt(newValue) || 0
                : newValue;
              setEditingGem(prev => ({ ...prev, [btn.fieldKey]: parsedValue }));
            }
          }
          else if (btn.action === 'save' && editingGem) {
            // Sauvegarder en BDD via API
            const gemData = {
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

            updateGem(editingGem.id, gemData)
              .then(() => {
                // Mettre à jour localement après succès API
                setGemTypes(prev => ({ ...prev, [editingGem.id]: gemData }));
                setAdminMessage({ type: 'success', text: `Gemme "${editingGem.name}" sauvegardee en BDD !` });
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
            const gemKeys = Object.keys(gemTypes).filter(k => k !== 'BASE');
            const requiredGems = prompt(
              `Gemmes requises (separees par des virgules)\nDisponibles: ${gemKeys.join(', ')}`,
              'RED,BLUE'
            );
            if (!requiredGems) return;

            const resultGem = prompt(
              `Gemme resultat\nDisponibles: ${gemKeys.join(', ')}`,
              'PURPLE'
            );
            if (!resultGem) return;

            const minCount = prompt('Nombre minimum de gemmes requises:', '3');
            if (!minCount) return;

            const recipeData = {
              required_gems: requiredGems.toUpperCase(),
              result_gem_id: resultGem.toUpperCase(),
              min_count: parseInt(minCount) || 3
            };

            createRecipe(recipeData)
              .then(newRecipe => {
                setFusionRecipes(prev => [...prev, newRecipe]);
                setAdminMessage({ type: 'success', text: 'Recette ajoutee en BDD !' });
                setTimeout(() => setAdminMessage(null), 3000);
              })
              .catch(err => {
                setAdminMessage({ type: 'error', text: `Erreur: ${err.message}` });
                setTimeout(() => setAdminMessage(null), 3000);
              });
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
        goToMenu, setGameState, setGameSpeed, zoomIn, zoomOut, resetCamera,
        setSelectedTempTower, deleteTower, startWave, resetGame
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
        goToMenu, setGameState, setGameSpeed, zoomIn, zoomOut, resetCamera,
        setSelectedTempTower, deleteTower, startWave, resetGame
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
      <div id="game-container" className={gameState === 'menu' || adminPage ? 'menu-active' : ''}>
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
      </div>
    </div>
  );
};

export default TowerDefense;
