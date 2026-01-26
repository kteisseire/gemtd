/**
 * Générateur de sons synthétiques en base64 (Web Audio API)
 * Pour créer des sons de placeholder avant d'avoir de vrais fichiers audio
 */

/**
 * Créer un buffer audio simple
 */
function createAudioBuffer(audioContext, duration, frequency, type = 'sine') {
  const sampleRate = audioContext.sampleRate;
  const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < buffer.length; i++) {
    const t = i / sampleRate;
    let value = 0;

    if (type === 'sine') {
      value = Math.sin(2 * Math.PI * frequency * t);
    } else if (type === 'square') {
      value = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
    } else if (type === 'sawtooth') {
      value = 2 * ((t * frequency) % 1) - 1;
    }

    // Envelope (fade in/out)
    const fadeIn = Math.min(t / 0.01, 1);
    const fadeOut = Math.min((duration - t) / 0.05, 1);
    data[i] = value * fadeIn * fadeOut;
  }

  return buffer;
}

/**
 * Générer des sons synthétiques
 */
export const generateSynthSounds = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    console.warn('Web Audio API non supportée');
    return {};
  }

  const audioContext = new AudioContext();

  /**
   * Convertir un buffer en data URL
   */
  const bufferToDataURL = (buffer) => {
    // Créer un wav simple
    const length = buffer.length;
    const data = buffer.getChannelData(0);

    // Encoder en WAV
    const wav = new ArrayBuffer(44 + length * 2);
    const view = new DataView(wav);

    // Header WAV
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, audioContext.sampleRate, true);
    view.setUint32(28, audioContext.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    // Data
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(44 + i * 2, sample * 0x7FFF, true);
    }

    // Convertir en base64
    const blob = new Blob([wav], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  };

  // Générer les sons
  const sounds = {
    // UI
    click: bufferToDataURL(createAudioBuffer(audioContext, 0.1, 800, 'sine')),
    hover: bufferToDataURL(createAudioBuffer(audioContext, 0.05, 1200, 'sine')),
    error: bufferToDataURL(createAudioBuffer(audioContext, 0.3, 200, 'square')),
    success: bufferToDataURL(createAudioBuffer(audioContext, 0.4, 600, 'sine')),

    // Tours
    place: bufferToDataURL(createAudioBuffer(audioContext, 0.15, 500, 'sine')),
    sell: bufferToDataURL(createAudioBuffer(audioContext, 0.2, 300, 'sawtooth')),
    fuse: bufferToDataURL(createAudioBuffer(audioContext, 0.5, 800, 'sine')),

    // Combat
    shoot: bufferToDataURL(createAudioBuffer(audioContext, 0.1, 400, 'sawtooth')),
    hit: bufferToDataURL(createAudioBuffer(audioContext, 0.15, 300, 'square')),
    death: bufferToDataURL(createAudioBuffer(audioContext, 0.3, 150, 'sawtooth')),

    // Effets
    hit_poison: bufferToDataURL(createAudioBuffer(audioContext, 0.2, 250, 'sawtooth')),
    hit_freeze: bufferToDataURL(createAudioBuffer(audioContext, 0.2, 1500, 'sine')),
    hit_burn: bufferToDataURL(createAudioBuffer(audioContext, 0.2, 180, 'square')),
    hit_stun: bufferToDataURL(createAudioBuffer(audioContext, 0.15, 2000, 'square')),

    // Vagues
    wave_start: bufferToDataURL(createAudioBuffer(audioContext, 0.5, 440, 'sine')),
    wave_complete: bufferToDataURL(createAudioBuffer(audioContext, 0.6, 523, 'sine')),
    game_over: bufferToDataURL(createAudioBuffer(audioContext, 1, 220, 'sawtooth'))
  };

  return sounds;
};
