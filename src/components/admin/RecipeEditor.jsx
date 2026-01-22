import React from 'react';

/**
 * Composant modal pour créer ou modifier une recette de fusion
 * Permet de sélectionner les ingrédients, le résultat et le nombre minimum de gemmes
 */
export const RecipeEditor = ({
  showRecipeEditor,
  editingRecipe,
  gemTypes,
  setEditingRecipe,
  onSave,
  onCancel
}) => {
  if (!showRecipeEditor || !editingRecipe) return null;

  return (
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
          onClick={onCancel}
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
          onClick={onSave}
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
  );
};
