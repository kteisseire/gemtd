import { useCallback } from 'react';

/**
 * Hook personnalisé pour gérer les événements de l'interface admin
 * Regroupe tous les gestionnaires d'événements liés à l'édition des gemmes
 *
 * @param {Object} params - Paramètres du hook
 * @param {Function} params.setEditingGem - Fonction pour modifier la gemme en édition
 * @param {Function} params.setShowColorPicker - Fonction pour afficher/masquer le color picker
 * @param {Function} params.setShowEmojiSelector - Fonction pour afficher/masquer le sélecteur d'emoji
 * @returns {Object} Gestionnaires d'événements
 */
export const useAdminHandlers = ({
  setEditingGem,
  setShowColorPicker,
  setShowEmojiSelector
}) => {
  // Handler pour le color picker
  const handleColorChange = useCallback((e) => {
    const newColor = e.target.value;
    setEditingGem(prev => ({ ...prev, color: newColor }));
    setShowColorPicker(false);
  }, [setEditingGem, setShowColorPicker]);

  // Handler pour le sélecteur d'effets (multi-sélection)
  const handleEffectToggle = useCallback((effectKey) => {
    setEditingGem(prev => {
      const currentEffects = prev.effect ? prev.effect.split(',') : [];
      const effectIndex = currentEffects.indexOf(effectKey);

      let newEffects;
      if (effectIndex >= 0) {
        // Retirer l'effet
        newEffects = currentEffects.filter(e => e !== effectKey);
      } else {
        // Ajouter l'effet
        newEffects = [...currentEffects, effectKey];
      }

      return { ...prev, effect: newEffects.filter(e => e).join(',') || 'none' };
    });
  }, [setEditingGem]);

  // Handler pour le sélecteur d'emojis
  const handleEmojiClick = useCallback((emojiData) => {
    setEditingGem(prev => ({ ...prev, icon: emojiData.emoji }));
    setShowEmojiSelector(false);
  }, [setEditingGem, setShowEmojiSelector]);

  return {
    handleColorChange,
    handleEffectToggle,
    handleEmojiClick
  };
};
