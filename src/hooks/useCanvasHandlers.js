import { useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TOOLBAR_HEIGHT, GRID_SIZE } from '../config/constants';
import { getMenuButtons, getAdminButtons, getContextMenuButtons, getToolbarButtons } from '../renderers';
import { createGem, updateGem, deleteGem, createRecipe, updateRecipe, deleteRecipe } from '../services/api';

/**
 * Hook personnalisé pour gérer les clics sur le canvas
 * Centralise toute la logique de gestion des clics (menu, admin, jeu, toolbar)
 */
export const useCanvasHandlers = (deps) => {
  const {
    canvasRef, getZoom, camera,
    // States
    gameState, contextMenu, adminPage, pseudo, gemTypes, editingGem, fusionRecipes, lives, wave, score,
    placementCount, gameSpeed, tempTowers, selectedTempTower, selectedTowerToDelete, towers, enemies, editingRecipe,
    // Setters
    setContextMenu, setAdminPage, updatePseudo, setEditingGem, setGemTypes, setAdminMessage, setFusionRecipes,
    setTempTowers, setPlacementCount, setSelectedTempTower, setTowers, setSelectedTowerToDelete,
    setColorPickerPosition, setShowColorPicker, setShowEffectSelector, setShowEmojiSelector,
    setFieldInputPosition, setFieldInputValue, setEditingField, colorPickerRef,
    setShowRecipeEditor, setEditingRecipe, setGameState,
    // Functions
    checkFusionPossible, performFusion, startWave, startNewGame, goToMenuFull, setGameSpeed,
    zoomIn, zoomOut, resetCamera, deleteTower, resetGameFull, placeTower
  } = deps;

  const handleCanvasClick = useCallback((e) => {
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
            setEditingGem({
              id: '', name: 'Nouvelle Gemme', color: '#888888', damage: 10, speed: 1000,
              range: 100, effect: 'none', icon: '💎', is_droppable: true, is_base: false
            });
            setAdminPage('edit-gem');
          }
          else if (btn.action === 'edit-gem') {
            setEditingGem({ ...gemTypes[btn.gemId], id: btn.gemId });
            setAdminPage('edit-gem');
          }
          else if (btn.action === 'edit-field' && editingGem) {
            if (btn.fieldKey === 'is_droppable' || btn.fieldKey === 'is_base') {
              setEditingGem(prev => ({ ...prev, [btn.fieldKey]: !prev[btn.fieldKey] }));
              return;
            }
            if (btn.fieldKey === 'color') {
              const rect = canvasRef.current.getBoundingClientRect();
              setColorPickerPosition({ x: btn.x + rect.left, y: btn.y + rect.top });
              setShowColorPicker(true);
              setTimeout(() => { if (colorPickerRef.current) colorPickerRef.current.click(); }, 0);
              return;
            }
            if (btn.fieldKey === 'effect') {
              setShowEffectSelector(prev => !prev);
              return;
            }
            if (btn.fieldKey === 'icon') {
              setShowEmojiSelector(prev => !prev);
              return;
            }
            const rect = canvasRef.current.getBoundingClientRect();
            setFieldInputPosition({ x: btn.x + rect.left, y: btn.y + rect.top });
            setFieldInputValue(String(editingGem[btn.fieldKey]));
            setEditingField(btn.fieldKey);
          }
          else if (btn.action === 'delete-gem' && editingGem) {
            if (confirm(`Supprimer définitivement la gemme "${editingGem.name}" ?`)) {
              deleteGem(editingGem.id)
                .then(() => {
                  setGemTypes(prev => { const newGems = { ...prev }; delete newGems[editingGem.id]; return newGems; });
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
            if (!editingGem.id || editingGem.id.trim() === '') {
              setAdminMessage({ type: 'error', text: 'L\'ID est obligatoire !' });
              setTimeout(() => setAdminMessage(null), 3000);
              return;
            }
            const gemData = {
              id: editingGem.id.toUpperCase().trim(), name: editingGem.name, color: editingGem.color,
              damage: editingGem.damage, speed: editingGem.speed, range: editingGem.range,
              effect: editingGem.effect, icon: editingGem.icon,
              is_droppable: editingGem.is_droppable ?? true, is_base: editingGem.is_base ?? false
            };
            const isNewGem = !gemTypes[editingGem.id];
            const apiCall = isNewGem ? createGem(gemData) : updateGem(editingGem.id, gemData);
            apiCall
              .then(() => {
                setGemTypes(prev => ({ ...prev, [gemData.id]: gemData }));
                setAdminMessage({ type: 'success', text: `Gemme "${editingGem.name}" ${isNewGem ? 'creee' : 'sauvegardee'} en BDD !` });
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
            setEditingRecipe({ required_gems: [], result_gem_id: '', min_count: 3 });
            setShowRecipeEditor(true);
          }
          else if (btn.action === 'edit-recipe') {
            const recipe = btn.recipe;
            setEditingRecipe({
              id: recipe.id, required_gems: recipe.required_gems.split(',').map(g => g.trim()),
              result_gem_id: recipe.result_gem_id, min_count: recipe.min_count || 3
            });
            setShowRecipeEditor(true);
          }
          else if (btn.action === 'save-recipe' && editingRecipe) {
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
              result_gem_id: editingRecipe.result_gem_id, min_count: editingRecipe.min_count
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
          }
          else if (btn.action === 'toggle-ingredient') {
            setEditingRecipe(prev => {
              const ingredients = [...prev.required_gems];
              const index = ingredients.indexOf(btn.gemId);
              if (index >= 0) ingredients.splice(index, 1);
              else ingredients.push(btn.gemId);
              return { ...prev, required_gems: ingredients };
            });
          }
          else if (btn.action === 'select-result') {
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

      setSelectedTowerToDelete(null);
      placeTower(gridX, gridY);
    }
  }, [canvasRef, getZoom, camera, gameState, contextMenu, adminPage, pseudo, gemTypes, editingGem, fusionRecipes,
    lives, wave, score, placementCount, gameSpeed, tempTowers, selectedTempTower, selectedTowerToDelete, towers,
    enemies, editingRecipe, setContextMenu, setAdminPage, updatePseudo, setEditingGem, setGemTypes, setAdminMessage,
    setFusionRecipes, setTempTowers, setPlacementCount, setSelectedTempTower, setTowers, setSelectedTowerToDelete,
    setColorPickerPosition, setShowColorPicker, setShowEffectSelector, setShowEmojiSelector, setFieldInputPosition,
    setFieldInputValue, setEditingField, colorPickerRef, setShowRecipeEditor, setEditingRecipe, setGameState,
    checkFusionPossible, performFusion, startWave, startNewGame, goToMenuFull, setGameSpeed, zoomIn, zoomOut,
    resetCamera, deleteTower, resetGameFull, placeTower]);

  return { handleCanvasClick };
};
