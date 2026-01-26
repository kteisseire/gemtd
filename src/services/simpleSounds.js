/**
 * Système de sons simplifié utilisant Web Audio API
 * Sons synthétiques générés à la volée
 */

class SimpleSoundManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.3;
  }

  init() {
    if (this.audioContext) return;

    // Créer le contexte audio (nécessite une interaction utilisateur)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.audioContext = new AudioContext();
      console.log('✅ AudioContext créé');
    } else {
      console.warn('❌ Web Audio API non supportée');
    }
  }

  /**
   * Jouer un son avec une fréquence et durée donnée
   */
  playTone(frequency, duration, type = 'sine', volume = this.volume) {
    if (!this.enabled || !this.audioContext) return;

    // Reprendre le contexte si suspendu (politique des navigateurs)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    // Envelope (fade in/out)
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  // Sons du jeu
  placeTower() {
    this.playTone(500, 0.15, 'sine', 0.2);
  }

  sellTower() {
    this.playTone(300, 0.2, 'sawtooth', 0.2);
  }

  fuseTowers() {
    // Son montant
    setTimeout(() => this.playTone(400, 0.1, 'sine', 0.15), 0);
    setTimeout(() => this.playTone(600, 0.1, 'sine', 0.15), 100);
    setTimeout(() => this.playTone(800, 0.2, 'sine', 0.15), 200);
  }

  shootProjectile() {
    const freq = 300 + Math.random() * 200;
    this.playTone(freq, 0.08, 'sawtooth', 0.15);
  }

  hitEnemy(effectType) {
    if (effectType === 'freeze') {
      this.playTone(1500, 0.15, 'sine', 0.2);
    } else if (effectType === 'burn') {
      this.playTone(180, 0.2, 'square', 0.2);
    } else if (effectType === 'poison') {
      this.playTone(250, 0.2, 'sawtooth', 0.2);
    } else if (effectType === 'stun') {
      this.playTone(2000, 0.1, 'square', 0.2);
    } else {
      this.playTone(300, 0.12, 'square', 0.2);
    }
  }

  enemyDeath() {
    const freq = 150 + Math.random() * 50;
    this.playTone(freq, 0.25, 'sawtooth', 0.2);
  }

  waveStart() {
    setTimeout(() => this.playTone(440, 0.15, 'sine', 0.25), 0);
    setTimeout(() => this.playTone(554, 0.15, 'sine', 0.25), 150);
    setTimeout(() => this.playTone(659, 0.2, 'sine', 0.25), 300);
  }

  error() {
    this.playTone(200, 0.3, 'square', 0.3);
  }

  buttonClick() {
    this.playTone(800, 0.05, 'sine', 0.15);
  }

  buttonHover() {
    this.playTone(1200, 0.03, 'sine', 0.1);
  }

  success() {
    setTimeout(() => this.playTone(523, 0.1, 'sine', 0.2), 0);
    setTimeout(() => this.playTone(659, 0.15, 'sine', 0.2), 100);
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

export const simpleSounds = new SimpleSoundManager();
