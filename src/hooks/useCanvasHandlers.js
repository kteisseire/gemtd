import { useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TOOLBAR_HEIGHT } from '../config/constants';
import { getMenuButtons, getAdminButtons, getContextMenuButtons, getToolbarButtons, getGameOverButtons, getVolumeSliders } from '../renderers';
import { createGem, updateGem, deleteGem, createRecipe, updateRecipe, deleteRecipe, createEnemy, updateEnemy, deleteEnemy } from '../services/api';
import { isoToGrid } from '../renderers/canvasUtils';
import { simpleSounds } from '../services/simpleSounds';

// URL de l'API
const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Hook personnalisé pour gérer les clics sur le canvas
 * Centralise toute la logique de gestion des clics (menu, admin, jeu, toolbar)
 */
export const useCanvasHandlers = (deps) => {
  const {
    canvasRef, getZoom, camera,
    // States
    gameState, contextMenu, adminPage, pseudo, gemTypes, editingGem, fusionRecipes, enemyTypes, editingEnemy, editingField, lives, wave, score,
    placementCount, gameSpeed, tempTowers, selectedTempTower, selectedTowerToDelete, towers, enemies, editingRecipe,
    // Setters
    setContextMenu, setAdminPage, updatePseudo, setEditingGem, setGemTypes, setAdminMessage, setFusionRecipes, setEnemyTypes, setEditingEnemy,
    setTempTowers, setPlacementCount, setSelectedTempTower, setTowers, setSelectedTowerToDelete,
    setColorPickerPosition, setShowColorPicker, setShowEffectSelector, setShowEmojiSelector,
    setFieldInputPosition, setFieldInputValue, setEditingField, colorPickerRef,
    setShowRecipeEditor, setEditingRecipe, setGameState, setMusicVolume, setSfxVolume,
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
        const isoX = (x - camera.x) / zoom;
        const isoY = (y - TOOLBAR_HEIGHT - camera.y) / zoom;
        const { gridX, gridY } = isoToGrid(isoX, isoY);

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

    // Game Over clicks
    if (gameState === 'gameOver') {
      const gameOverButtons = getGameOverButtons();
      for (const btn of gameOverButtons) {
        if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
          if (btn.action === 'restart') {
            resetGameFull();
            startNewGame();
          } else if (btn.action === 'menu') {
            goToMenuFull();
          }
          return;
        }
      }
      return;
    }

    // Menu clicks
    if (gameState === 'menu' && !adminPage) {
      const centerX = CANVAS_WIDTH / 2;
      const centerY = CANVAS_HEIGHT / 2;

      // Check volume sliders first
      const volumeSliders = getVolumeSliders(centerX, centerY);
      for (const slider of volumeSliders) {
        if (x >= slider.x && x <= slider.x + slider.width && y >= slider.y && y <= slider.y + slider.height) {
          // Calculate new volume based on click position
          const relativeX = x - slider.x;
          const newVolume = Math.max(0, Math.min(1, relativeX / slider.width));

          if (slider.type === 'music') {
            simpleSounds.setMusicVolume(newVolume);
            setMusicVolume(newVolume);
          } else if (slider.type === 'sfx') {
            simpleSounds.setSFXVolume(newVolume);
            setSfxVolume(newVolume);
            // Play a test sound
            simpleSounds.buttonClick();
          }
          return;
        }
      }

      const menuButtons = getMenuButtons(centerX, centerY, pseudo);
      for (const btn of menuButtons) {
        if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
          if (btn.id === 'new-game') startNewGame();
          else if (btn.id === 'pseudo') {
            const rect = canvasRef.current.getBoundingClientRect();
            setFieldInputPosition({ x: btn.x + rect.left, y: btn.y + rect.top });
            setFieldInputValue(pseudo || '');
            setEditingField('pseudo');
          }
          else if (btn.id === 'admin') {
            // Demander le mot de passe
            const password = prompt('Mot de passe administrateur :');
            if (password === 'prout') {
              setAdminPage('home');
            } else if (password !== null) {
              // Si l'utilisateur n'a pas annulé, afficher une erreur
              alert('Mot de passe incorrect !');
            }
          }
          return;
        }
      }
      return;
    }

    // Admin clicks
    if (adminPage) {
      const adminButtons = getAdminButtons(adminPage, gemTypes, editingGem, fusionRecipes, enemyTypes, editingEnemy, editingField);
      for (const btn of adminButtons) {
        if (x >= btn.x && x <= btn.x + btn.width && y >= btn.y && y <= btn.y + btn.height) {
          if (btn.action === 'back') {
            if (adminPage === 'edit-gem') setAdminPage('gems');
            else if (adminPage === 'edit-enemy') setAdminPage('enemies');
            else if (adminPage === 'resistances') setAdminPage('home');
            else if (adminPage === 'recipes') setAdminPage('home');
            else if (adminPage === 'enemies') setAdminPage('home');
            else setAdminPage(null);
            setEditingGem(null);
            setEditingEnemy(null);
          }
          else if (btn.action === 'gems') setAdminPage('gems');
          else if (btn.action === 'enemies') setAdminPage('enemies');
          else if (btn.action === 'resistances') setAdminPage('resistances');
          else if (btn.action === 'recipes') setAdminPage('recipes');
          else if (btn.action === 'create-gem') {
            setEditingGem({
              id: '', name: 'Nouvelle Gemme', color: '#888888', image: '/images/gemviolette.png',
              damage: 10, speed: 1000, range: 100, effect: 'none', icon: '💎',
              is_droppable: true, is_base: false
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
              image: editingGem.image || '/images/gemviolette.png',
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
          else if (btn.action === 'create-enemy') {
            setEditingEnemy({
              id: '', name: 'Nouvel Ennemi', hp: 100, speed: 0.5,
              resistance1: null, resistance2: null, emoji: '👾', global_resistance: 0.1
            });
            setAdminPage('edit-enemy');
          }
          else if (btn.action === 'edit-enemy') {
            setEditingEnemy({ ...enemyTypes[btn.enemyId], id: btn.enemyId });
            setAdminPage('edit-enemy');
          }
          else if (btn.action === 'enemy-field' && editingEnemy) {
            if (btn.fieldKey === 'emoji') {
              setShowEmojiSelector(prev => !prev);
              return;
            }
            const rect = canvasRef.current.getBoundingClientRect();
            setFieldInputPosition({ x: btn.x + rect.left, y: btn.y + rect.top });

            // Convertir global_resistance en pourcentage pour l'affichage
            let displayValue = editingEnemy[btn.fieldKey];
            if (btn.fieldKey === 'global_resistance') {
              displayValue = (displayValue || 0.1) * 100;
            }

            setFieldInputValue(String(displayValue));
            setEditingField(btn.fieldKey);
          }
          else if (btn.action === 'toggle-resistance1') {
            setEditingField(editingField === 'resistance1-dropdown' ? null : 'resistance1-dropdown');
          }
          else if (btn.action === 'toggle-resistance2') {
            setEditingField(editingField === 'resistance2-dropdown' ? null : 'resistance2-dropdown');
          }
          else if (btn.action === 'select-resistance1') {
            setEditingEnemy(prev => ({ ...prev, resistance1: btn.gemId === 'none' ? null : btn.gemId }));
            setEditingField(null); // Fermer le dropdown
          }
          else if (btn.action === 'select-resistance2') {
            setEditingEnemy(prev => ({ ...prev, resistance2: btn.gemId === 'none' ? null : btn.gemId }));
            setEditingField(null); // Fermer le dropdown
          }
          else if (btn.action === 'save-enemy' && editingEnemy) {
            if (!editingEnemy.id || editingEnemy.id.trim() === '') {
              setAdminMessage({ type: 'error', text: 'L\'ID est obligatoire !' });
              setTimeout(() => setAdminMessage(null), 3000);
              return;
            }
            const enemyData = {
              id: editingEnemy.id.toUpperCase().trim(),
              name: editingEnemy.name,
              hp: editingEnemy.hp,
              speed: editingEnemy.speed,
              resistance1: editingEnemy.resistance1 || null,
              resistance2: editingEnemy.resistance2 || null,
              emoji: editingEnemy.emoji,
              global_resistance: editingEnemy.global_resistance || 0.1
            };
            const isNewEnemy = !enemyTypes[editingEnemy.id];
            const apiCall = isNewEnemy ? createEnemy(enemyData) : updateEnemy(editingEnemy.id, enemyData);
            apiCall
              .then(() => {
                setEnemyTypes(prev => ({ ...prev, [enemyData.id]: enemyData }));
                setAdminMessage({ type: 'success', text: `Ennemi "${editingEnemy.name}" ${isNewEnemy ? 'cree' : 'sauvegarde'} en BDD !` });
                setTimeout(() => setAdminMessage(null), 3000);
                setAdminPage('enemies');
                setEditingEnemy(null);
              })
              .catch(err => {
                setAdminMessage({ type: 'error', text: `Erreur: ${err.message}` });
                setTimeout(() => setAdminMessage(null), 3000);
              });
          }
          else if (btn.action === 'delete-enemy' && editingEnemy) {
            if (confirm(`Supprimer définitivement l'ennemi "${editingEnemy.name}" ?`)) {
              deleteEnemy(editingEnemy.id)
                .then(() => {
                  setEnemyTypes(prev => { const newEnemies = { ...prev }; delete newEnemies[editingEnemy.id]; return newEnemies; });
                  setAdminMessage({ type: 'success', text: `Ennemi "${editingEnemy.name}" supprime !` });
                  setTimeout(() => setAdminMessage(null), 3000);
                  setAdminPage('enemies');
                  setEditingEnemy(null);
                })
                .catch(err => {
                  setAdminMessage({ type: 'error', text: `Erreur: ${err.message}` });
                  setTimeout(() => setAdminMessage(null), 3000);
                });
            }
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
          else if (btn.action === 'edit-global-resistance') {
            // Modifier la résistance globale d'un ennemi
            const enemy = enemyTypes[btn.enemyId];
            const currentGlobalRes = enemy.global_resistance || 0.1;
            const currentPercent = Math.round(currentGlobalRes * 100);

            const newPercent = prompt(
              `Résistance globale de ${btn.enemyId}\n\nValeur actuelle: ${currentPercent}%\nEntrez la nouvelle valeur (0-100):`,
              currentPercent
            );

            if (newPercent !== null) {
              const parsedValue = parseFloat(newPercent);
              if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 100) {
                setAdminMessage({ type: 'error', text: 'Valeur invalide (0-100 attendu)' });
                setTimeout(() => setAdminMessage(null), 3000);
                return;
              }

              const newGlobalRes = parsedValue / 100;

              // Appeler l'API pour mettre à jour l'ennemi
              fetch(`${API_URL}/enemies/${btn.enemyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...enemy,
                  global_resistance: newGlobalRes
                })
              })
                .then(res => res.json())
                .then(() => {
                  setEnemyTypes(prev => ({
                    ...prev,
                    [btn.enemyId]: {
                      ...prev[btn.enemyId],
                      global_resistance: newGlobalRes
                    }
                  }));
                  setAdminMessage({ type: 'success', text: `Résistance globale: ${parsedValue}%` });
                  setTimeout(() => setAdminMessage(null), 2000);
                })
                .catch(err => {
                  setAdminMessage({ type: 'error', text: `Erreur: ${err.message}` });
                  setTimeout(() => setAdminMessage(null), 3000);
                });
            }
          }
          else if (btn.action === 'toggle-resistance') {
            // Toggle la résistance d'un ennemi à une gemme
            const enemy = enemyTypes[btn.enemyId];
            const currentResistances = enemy.resistances || [];
            const hasResistance = currentResistances.includes(btn.gemId);

            // Appeler l'API pour ajouter ou supprimer la résistance
            if (hasResistance) {
              // Supprimer la résistance
              fetch(`${API_URL}/resistances/${btn.enemyId}/${btn.gemId}`, {
                method: 'DELETE'
              })
                .then(res => res.json())
                .then(() => {
                  setEnemyTypes(prev => ({
                    ...prev,
                    [btn.enemyId]: {
                      ...prev[btn.enemyId],
                      resistances: currentResistances.filter(g => g !== btn.gemId)
                    }
                  }));
                  setAdminMessage({ type: 'success', text: 'Résistance retirée !' });
                  setTimeout(() => setAdminMessage(null), 2000);
                })
                .catch(err => {
                  setAdminMessage({ type: 'error', text: `Erreur: ${err.message}` });
                  setTimeout(() => setAdminMessage(null), 3000);
                });
            } else {
              // Ajouter la résistance
              fetch(`${API_URL}/resistances`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  enemy_type_id: btn.enemyId,
                  gem_type_id: btn.gemId,
                  resistance_value: 0.2
                })
              })
                .then(res => res.json())
                .then(() => {
                  setEnemyTypes(prev => ({
                    ...prev,
                    [btn.enemyId]: {
                      ...prev[btn.enemyId],
                      resistances: [...currentResistances, btn.gemId]
                    }
                  }));
                  setAdminMessage({ type: 'success', text: 'Résistance ajoutée !' });
                  setTimeout(() => setAdminMessage(null), 2000);
                })
                .catch(err => {
                  setAdminMessage({ type: 'error', text: `Erreur: ${err.message}` });
                  setTimeout(() => setAdminMessage(null), 3000);
                });
            }
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
      const isoX = (x - camera.x) / zoom;
      const isoY = (y - TOOLBAR_HEIGHT - camera.y) / zoom;
      const { gridX, gridY } = isoToGrid(isoX, isoY);

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
  }, [canvasRef, getZoom, camera, gameState, contextMenu, adminPage, pseudo, gemTypes, editingGem, fusionRecipes, enemyTypes, editingEnemy, editingField,
    lives, wave, score, placementCount, gameSpeed, tempTowers, selectedTempTower, selectedTowerToDelete, towers,
    enemies, editingRecipe, setContextMenu, setAdminPage, updatePseudo, setEditingGem, setGemTypes, setAdminMessage,
    setFusionRecipes, setEnemyTypes, setEditingEnemy, setTempTowers, setPlacementCount, setSelectedTempTower, setTowers, setSelectedTowerToDelete,
    setColorPickerPosition, setShowColorPicker, setShowEffectSelector, setShowEmojiSelector, setFieldInputPosition,
    setFieldInputValue, setEditingField, colorPickerRef, setShowRecipeEditor, setEditingRecipe, setGameState,
    checkFusionPossible, performFusion, startWave, startNewGame, goToMenuFull, setGameSpeed, zoomIn, zoomOut,
    resetCamera, deleteTower, resetGameFull, placeTower]);

  return { handleCanvasClick };
};
