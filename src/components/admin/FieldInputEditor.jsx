import React from 'react';

/**
 * Composant modal pour éditer un champ (texte ou numérique)
 * Apparaît à la position du champ cliqué
 */
export const FieldInputEditor = ({
  editingField,
  fieldInputValue,
  fieldInputPosition,
  onValueChange,
  onSave,
  onCancel
}) => {
  if (!editingField) return null;

  const isNumeric = ['damage', 'speed', 'range'].includes(editingField);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const getLabel = () => {
    const labels = {
      id: 'ID (ex: EMERALD)',
      name: 'Nom de la gemme',
      damage: 'Dégâts',
      speed: 'Vitesse (ms)',
      range: 'Portée'
    };
    return labels[editingField] || editingField;
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${fieldInputPosition.x}px`,
        top: `${fieldInputPosition.y}px`,
        zIndex: 1001,
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        padding: '15px',
        borderRadius: '8px',
        border: '2px solid #3b82f6',
        minWidth: '300px'
      }}
    >
      <div style={{ marginBottom: '10px' }}>
        <label style={{
          color: '#94a3b8',
          fontSize: '12px',
          fontWeight: 'bold',
          display: 'block',
          marginBottom: '5px'
        }}>
          {getLabel()}
        </label>
        <input
          type={isNumeric ? 'number' : 'text'}
          value={fieldInputValue}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            color: '#f1f5f9',
            border: '1px solid #475569',
            borderRadius: '5px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onSave}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#22c55e',
            color: '#f1f5f9',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold'
          }}
        >
          ✓ Valider
        </button>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#64748b',
            color: '#f1f5f9',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold'
          }}
        >
          ✗ Annuler
        </button>
      </div>
    </div>
  );
};
