import React from 'react';
import { EFFECT_NAMES } from '../../config/constants';

/**
 * Composant modal pour sélectionner plusieurs effets
 * Affiche une liste de checkboxes avec tous les effets disponibles
 */
export const EffectSelector = ({ editingGem, onEffectToggle, onClose }) => {
  if (!editingGem) return null;

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
        border: '3px solid #3b82f6',
        minWidth: '400px',
        maxHeight: '600px',
        overflowY: 'auto'
      }}
    >
      <h3 style={{
        color: '#f1f5f9',
        marginBottom: '10px',
        fontSize: '20px',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        Sélectionnez les effets
      </h3>
      <p style={{
        color: '#94a3b8',
        fontSize: '13px',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        Vous pouvez sélectionner plusieurs effets
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Object.entries(EFFECT_NAMES).map(([key, name]) => {
          const currentEffects = editingGem.effect ? editingGem.effect.split(',') : [];
          const isSelected = currentEffects.includes(key);

          return (
            <label
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(30, 41, 59, 0.5)',
                borderRadius: '8px',
                cursor: 'pointer',
                border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.8)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.5)';
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onEffectToggle(key)}
                style={{
                  width: '20px',
                  height: '20px',
                  marginRight: '12px',
                  cursor: 'pointer',
                  accentColor: '#3b82f6'
                }}
              />
              <div>
                <div style={{
                  color: '#f1f5f9',
                  fontSize: '16px',
                  fontWeight: isSelected ? 'bold' : 'normal'
                }}>
                  {name}
                </div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>
                  {key}
                </div>
              </div>
            </label>
          );
        })}
      </div>
      <button
        onClick={onClose}
        style={{
          marginTop: '20px',
          width: '100%',
          padding: '12px',
          backgroundColor: '#3b82f6',
          color: '#f1f5f9',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        Valider
      </button>
    </div>
  );
};
