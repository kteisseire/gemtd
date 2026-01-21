import React from 'react';
import EmojiPicker from 'emoji-picker-react';

/**
 * Composant modal pour sélectionner un emoji
 * Utilise la librairie emoji-picker-react
 */
export const EmojiSelector = ({ showEmojiSelector, onEmojiClick, onClose }) => {
  if (!showEmojiSelector) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000
      }}
    >
      <EmojiPicker
        onEmojiClick={onEmojiClick}
        theme="dark"
        width={400}
        height={500}
      />
      <button
        onClick={onClose}
        style={{
          marginTop: '10px',
          width: '100%',
          padding: '10px',
          backgroundColor: '#a855f7',
          color: '#f1f5f9',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      >
        Fermer
      </button>
    </div>
  );
};
