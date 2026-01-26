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
   * Musique d'ambiance fantasy avec melodie
   */
  startAmbientMusic() {
    if (!this.musicEnabled || !this.audioContext || this.musicOscillators.length > 0) return;

    console.log('Demarrage musique d\'ambiance...');

    // Reprendre le contexte
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Créer un gain node pour la musique
    this.musicGainNode = this.audioContext.createGain();
    this.musicGainNode.gain.value = this.musicVolume;
    this.musicGainNode.connect(this.audioContext.destination);

    // Démarrer la basse continue (drone)
    this.startBassDrone();

    // Démarrer la mélodie
    this.playMelodyLoop();
  }

  /**
   * Basse continue (drone harmonique)
   */
  startBassDrone() {
    const bassFrequencies = [
      130.81, // C3
      196.00  // G3
    ];

    bassFrequencies.forEach((freq, index) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.08;

      osc.connect(gain);
      gain.connect(this.musicGainNode);
      osc.start();

      this.musicOscillators.push({ osc, gain, type: 'bass' });
    });
  }

  /**
   * Mélodie en boucle
   */
  playMelodyLoop() {
    if (!this.musicEnabled || !this.audioContext) return;

    // Mélodie fantasy en Do majeur
    // Format: [frequence, duree, delai]
    const melody = [
      // Phrase 1
      [523, 0.4, 0],     // C5
      [659, 0.4, 0.5],   // E5
      [784, 0.4, 1.0],   // G5
      [659, 0.4, 1.5],   // E5

      // Phrase 2
      [587, 0.4, 2.0],   // D5
      [523, 0.4, 2.5],   // C5
      [440, 0.8, 3.0],   // A4

      // Phrase 3
      [523, 0.4, 4.0],   // C5
      [659, 0.4, 4.5],   // E5
      [784, 0.4, 5.0],   // G5
      [1047, 0.6, 5.5],  // C6

      // Phrase 4
      [784, 0.4, 6.5],   // G5
      [659, 0.4, 7.0],   // E5
      [523, 1.0, 7.5]    // C5
    ];

    const now = this.audioContext.currentTime;

    melody.forEach(([freq, duration, delay]) => {
      if (!this.musicEnabled) return;

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      // Configuration
      osc.type = 'sine';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.value = freq * 2;

      // Chaîne audio
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      // Envelope doux
      const startTime = now + delay;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });

    // Répéter la mélodie (durée totale: 8.5 secondes)
    if (this.musicEnabled) {
      this.melodyTimeout = setTimeout(() => this.playMelodyLoop(), 9000);
    }
  }

  /**
   * Arrêter la musique d'ambiance
   */
  stopAmbientMusic() {
    // Arrêter le timeout de la mélodie
    if (this.melodyTimeout) {
      clearTimeout(this.melodyTimeout);
      this.melodyTimeout = null;
    }

    // Arrêter tous les oscillateurs
    this.musicOscillators.forEach(item => {
      try {
        item.osc.stop();
      } catch (e) {
        // Oscillateur déjà arrêté
      }
    });
    this.musicOscillators = [];
    this.musicGainNode = null;
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
