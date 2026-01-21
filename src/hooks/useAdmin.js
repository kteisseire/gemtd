import { useState } from 'react';

/**
 * Hook personnalisé pour gérer l'interface d'administration
 * @returns {Object} État de l'admin et fonctions de gestion
 */
export const useAdmin = () => {
  const [adminPage, setAdminPage] = useState(null);
  const [editingGem, setEditingGem] = useState(null);
  const [adminMessage, setAdminMessage] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);

  // États des sélecteurs visuels
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });
  const [showEffectSelector, setShowEffectSelector] = useState(false);
  const [showEmojiSelector, setShowEmojiSelector] = useState(false);
  const [showRecipeEditor, setShowRecipeEditor] = useState(false);

  // États pour l'édition de champs
  const [editingField, setEditingField] = useState(null);
  const [fieldInputValue, setFieldInputValue] = useState('');
  const [fieldInputPosition, setFieldInputPosition] = useState({ x: 0, y: 0 });

  return {
    // États principaux
    adminPage,
    editingGem,
    adminMessage,
    editingRecipe,

    // États des sélecteurs
    showColorPicker,
    colorPickerPosition,
    showEffectSelector,
    showEmojiSelector,
    showRecipeEditor,

    // États d'édition de champs
    editingField,
    fieldInputValue,
    fieldInputPosition,

    // Setters
    setAdminPage,
    setEditingGem,
    setAdminMessage,
    setEditingRecipe,
    setShowColorPicker,
    setColorPickerPosition,
    setShowEffectSelector,
    setShowEmojiSelector,
    setShowRecipeEditor,
    setEditingField,
    setFieldInputValue,
    setFieldInputPosition
  };
};
