/**
 * Système de sons fantasy doux utilisant Web Audio API
 * Sons synthétiques plus mélodieux et musique d'ambiance
 */

class SimpleSoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.musicEnabled = true;
    this.volume = 0.25;
    this.musicVolume = 0.15;
    this.musicOscillators = [];
    this.musicGainNode = null;
    this.backgroundMusic = null;
    this.musicSource = null;
  }

  init() {
    if (this.audioContext) return;

    // Créer le contexte audio (nécessite une interaction utilisateur)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.audioContext = new AudioContext();
      console.log('AudioContext cree');

      // Démarrer la musique d'ambiance après un petit délai
      setTimeout(() => this.startAmbientMusic(), 500);
    } else {
      console.warn('Web Audio API non supportee');
    }
  }

  /**
   * Jouer un son avec filtrage pour adoucir
   */
  playTone(frequency, duration, type = 'sine', volume = this.volume, useFilter = true) {
    if (!this.enabled || !this.audioContext) return;

    // Reprendre le contexte si suspendu
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    // Chaîne audio: oscillateur -> filtre -> gain -> destination
    oscillator.connect(filter);

    if (useFilter) {
      // Filtre passe-bas pour adoucir le son
      filter.type = 'lowpass';
      filter.frequency.value = frequency * 2;
      filter.Q.value = 1;
      filter.connect(gainNode);
    } else {
      oscillator.connect(gainNode);
    }

    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    // Envelope doux (fade in/out)
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.exponentialRampToValueAtTime(volume, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  /**
   * Jouer un accord (plusieurs notes)
   */
  playChord(frequencies, duration, volume = this.volume) {
    frequencies.forEach(freq => {
      this.playTone(freq, duration, 'sine', volume * 0.7);
    });
  }

  /**
   * Charger et jouer la musique d'ambiance (MP3)
   */
  async startAmbientMusic() {
    if (!this.musicEnabled || !this.audioContext) return;
    if (this.backgroundMusic) return; // Déjà en cours

    console.log('Chargement de la musique d\'ambiance...');

    // Reprendre le contexte
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    try {
      // Charger le fichier MP3
      const response = await fetch('/music/enchanted-journey.mp3');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Créer le gain node pour la musique
      this.musicGainNode = this.audioContext.createGain();
      this.musicGainNode.gain.value = this.musicVolume;
      this.musicGainNode.connect(this.audioContext.destination);

      // Créer et configurer la source audio
      this.musicSource = this.audioContext.createBufferSource();
      this.musicSource.buffer = audioBuffer;
      this.musicSource.loop = true; // Boucler la musique
      this.musicSource.connect(this.musicGainNode);

      // Démarrer la lecture
      this.musicSource.start(0);
      this.backgroundMusic = true;

      console.log('Musique d\'ambiance demarree');
    } catch (error) {
      console.error('Erreur lors du chargement de la musique:', error);
    }
  }

  /**
   * Arrêter la musique d'ambiance
   */
  stopAmbientMusic() {
    if (this.musicSource) {
      try {
        this.musicSource.stop();
      } catch (e) {
        // Source déjà arrêtée
      }
      this.musicSource = null;
    }

    if (this.musicGainNode) {
      this.musicGainNode.disconnect();
      this.musicGainNode = null;
    }

    this.backgroundMusic = null;
  }

  /**
   * Définir le volume des effets sonores (0-1)
   */
  setSFXVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Définir le volume de la musique (0-1)
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.musicVolume;
    }
  }

  /**
   * Obtenir le volume des effets sonores
   */
  getSFXVolume() {
    return this.volume;
  }

  /**
   * Obtenir le volume de la musique
   */
  getMusicVolume() {
    return this.musicVolume;
  }

  // Sons du jeu (version douce/fantasy)

  placeTower() {
    // Accord doux montant
    setTimeout(() => this.playTone(523, 0.15, 'sine', 0.12), 0);   // C5
    setTimeout(() => this.playTone(659, 0.2, 'sine', 0.1), 50);    // E5
  }

  sellTower() {
    // Accord descendant
    setTimeout(() => this.playTone(523, 0.12, 'sine', 0.1), 0);
    setTimeout(() => this.playTone(392, 0.15, 'sine', 0.12), 60);
  }

  fuseTowers() {
    // Arpège magique montant
    setTimeout(() => this.playTone(523, 0.15, 'sine', 0.12), 0);    // C
    setTimeout(() => this.playTone(659, 0.15, 'sine', 0.12), 80);   // E
    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.12), 160);  // G
    setTimeout(() => this.playTone(1047, 0.25, 'sine', 0.15), 240); // C (octave)
  }

  shootProjectile() {
    // Petit "fwoosh" doux
    const freq = 600 + Math.random() * 200;
    this.playTone(freq, 0.08, 'sine', 0.08);
  }

  hitEnemy(effectType) {
    if (effectType === 'freeze') {
      // Glaçon cristallin
      this.playChord([1047, 1319], 0.12, 0.1);
    } else if (effectType === 'burn') {
      // Flamme crépitante
      setTimeout(() => this.playTone(220, 0.1, 'triangle', 0.1), 0);
      setTimeout(() => this.playTone(247, 0.1, 'triangle', 0.08), 50);
    } else if (effectType === 'poison') {
      // Bulles toxiques
      this.playTone(330, 0.15, 'sine', 0.1);
    } else if (effectType === 'stun') {
      // Éclair électrique
      this.playChord([1568, 1760], 0.1, 0.12);
    } else {
      // Impact normal doux
      this.playTone(392, 0.1, 'sine', 0.1);
    }
  }

  enemyDeath() {
    // Chute mélodique
    setTimeout(() => this.playTone(392, 0.1, 'sine', 0.1), 0);
    setTimeout(() => this.playTone(330, 0.12, 'sine', 0.08), 80);
    setTimeout(() => this.playTone(262, 0.15, 'sine', 0.06), 160);
  }

  waveStart() {
    // Fanfare héroïque
    setTimeout(() => this.playChord([523, 659], 0.2, 0.15), 0);
    setTimeout(() => this.playChord([587, 740], 0.2, 0.15), 200);
    setTimeout(() => this.playChord([659, 784], 0.3, 0.18), 400);
  }

  error() {
    // Accord dissonant doux
    this.playChord([330, 349], 0.25, 0.15);
  }

  buttonClick() {
    // Petit "clic" doux
    this.playTone(880, 0.04, 'sine', 0.1);
  }

  buttonHover() {
    // Très subtil
    this.playTone(1047, 0.03, 'sine', 0.06);
  }

  success() {
    // Mélodie de succès joyeuse
    setTimeout(() => this.playTone(659, 0.1, 'sine', 0.12), 0);
    setTimeout(() => this.playTone(784, 0.1, 'sine', 0.12), 100);
    setTimeout(() => this.playTone(1047, 0.2, 'sine', 0.15), 200);
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startAmbientMusic();
    } else {
      this.stopAmbientMusic();
    }
    return this.musicEnabled;
  }
}

export const simpleSounds = new SimpleSoundManager();
